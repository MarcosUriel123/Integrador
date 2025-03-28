#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Key.h>
#include <Keypad.h>
#include <HardwareSerial.h>
#include <Adafruit_Fingerprint.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h> 
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>

// Configuración del WiFi
const char* ssid = "Telcel-A2C3";
const char* password = "A810YHTMGRD";

// Configuración del servidor
const char* ipServer = "192.168.1.133:8082";

// Configuración del servidor web
WebServer server(80);

// Configuración del RFID
#define SS_PIN 4
#define RST_PIN 15
#define RELAY_PIN 25
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Configuración del sensor magnético
#define MAGNETIC_SENSOR_PIN 36
int doorState = -1;
unsigned long lastDoorStatusCheck = 0;
const unsigned long DOOR_CHECK_INTERVAL = 1000;

// Configuración del LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Configuración del teclado
const byte FILAS = 4;
const byte COLUMNAS = 4;
char teclas[FILAS][COLUMNAS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

byte pinesFilas[FILAS] = {32, 14, 12, 13};
byte pinesColumnas[COLUMNAS] = {27, 26, 5, 33};
Keypad teclado = Keypad(makeKeymap(teclas), pinesFilas, pinesColumnas, FILAS, COLUMNAS);

// Configuración de contraseña
char claveIngresada[5];
int indiceClave = 0;
bool estaBloqueado = true;
int intentosFallidos = 0;

// Estado del menú
int estadoMenu = 0;

// Configuración del sensor PIR y buzzer
const int pinPIR = 34;
const int pinBuzzer = 2;
int contadorDetecciones = 0;
unsigned long tiempoUltimaDeteccion = 0;
const unsigned long retrasoDeteccion = 1000;
bool alarmaActivada = false;
int contadorPitidos = 0;
unsigned long tiempoUltimoPitido = 0;
bool alarmaCicloCompletado = false;

// Configuración del sensor de huella
HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// Variables para el estado de los procesos
String rfidStatus = "idle";
String fingerprintStatus = "idle";
String lastCardId = "";
int lastFingerprintId = -1;
String lastErrorMessage = "";
bool isRegistrationActive = false;
int registrationStep = 0;
bool isRFIDOperationActive = false;
unsigned long rfidOperationStartTime = 0;
const unsigned long RFID_TIMEOUT = 30000;
bool registroRemotoActivo = false;
bool registroRfidActivo = false;

// Variables para controlar la visualización temporal de dígitos
unsigned long tiempoUltimaTecla = 0;
bool reemplazarCaracter = false;
int posicionTeclaActual = -1;

// Configuración MQTT
const char* mqtt_server = "cff146d73f214b82bb19d3ae4f6a3e7d.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "PuertaIOT";
const char* mqtt_password = "1234abcD";
const char* mqtt_client_id = "ESP32_Puerta_";
const char* mqtt_command_topic = "valoresPuerta/comandos";
const char* mqtt_status_topic = "valoresPuerta/estadoPuerta";
const char* mqtt_pir_topic = "valoresPuerta/conteoPIR";
const char* mqtt_magnetic_topic = "valoresPuerta/sensorMagnetico";
const char* mqtt_mac_topic = "valoresPuerta/direccionMAC";

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);
unsigned long lastMqttPublish = 0;
const unsigned long MQTT_PUBLISH_INTERVAL = 2000;

void setupMQTT() {
  espClient.setInsecure();
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensaje recibido [");
  Serial.print(topic);
  Serial.print("]: ");
  
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  if (String(topic) == mqtt_command_topic) {
    if (message == "abrir") {
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("Puerta abierta por comando MQTT");
      mqttClient.publish(mqtt_status_topic, "open", true);
      delay(5000);
      digitalWrite(RELAY_PIN, HIGH);
      mqttClient.publish(mqtt_status_topic, "closed", true);
    } else if (message == "cerrar") {
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("Puerta cerrada por comando MQTT");
      mqttClient.publish(mqtt_status_topic, "closed", true);
    }
  }
}

void reconnectMQTT() {
  String clientId = mqtt_client_id;
  String macAddress = WiFi.macAddress();
  clientId += macAddress.substring(12);
  
  while (!mqttClient.connected()) {
    Serial.print("Conectando a HiveMQ Cloud...");
    
    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println("conectado");
      mqttClient.subscribe(mqtt_command_topic);
      mqttClient.publish("valoresPuerta/status", "online", true);
      // Publicar la dirección MAC en el tópico correspondiente
      mqttClient.publish(mqtt_mac_topic, macAddress.c_str(), true);
    } else {
      Serial.print("falló, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" reintentando en 5 segundos");
      delay(5000);
    }
  }
}

void pitidoCorto() {
  digitalWrite(pinBuzzer, HIGH);
  delay(100);
  digitalWrite(pinBuzzer, LOW);
}

void pitidoExito() {
  for(int i = 0; i < 2; i++) {
    digitalWrite(pinBuzzer, HIGH);
    delay(100);
    digitalWrite(pinBuzzer, LOW);
    delay(100);
  }
}

void pitidoError() {
  digitalWrite(pinBuzzer, HIGH);
  delay(1000);
  digitalWrite(pinBuzzer, LOW);
}

void setup() {
  Serial.begin(115200);
  lcd.init();
  lcd.backlight();
  pinMode(pinPIR, INPUT);
  pinMode(pinBuzzer, OUTPUT);
  digitalWrite(pinBuzzer, LOW);
  
  pinMode(MAGNETIC_SENSOR_PIN, INPUT);

  SPI.begin();
  mfrc522.PCD_Init();
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  mySerial.begin(57600, SERIAL_8N1, 16, 17);
  finger.begin(57600);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando a WiFi...");
  }
  Serial.println("Conectado a WiFi");
  Serial.println(WiFi.localIP());

  // Configurar rutas del servidor web
  server.on("/leerRFID", handleLeerRFID);
  server.on("/controlPuerta", handleControlPuerta);
  server.on("/api/arduino/status", HTTP_GET, handleStatus);
  server.on("/api/arduino/rfid/read", HTTP_POST, handleStartRFIDRead);
  server.on("/api/arduino/rfid/status", HTTP_GET, handleRFIDStatus);
  server.on("/api/arduino/fingerprint/register", HTTP_POST, handleFingerprintRegister);
  server.on("/api/arduino/fingerprint/status", HTTP_GET, handleFingerprintStatus);
  server.on("/api/arduino/ping", HTTP_GET, []() {
    sendCORSHeaders();
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  });

  server.on("/api/arduino/fingerprint/register", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.on("/api/arduino/rfid/read", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.on("/api/arduino/status", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.on("/api/arduino/fingerprint/status", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.on("/api/arduino/rfid/status", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      sendCORSHeaders();
      server.send(200, "text/plain", "");
    } else {
      server.send(404, "text/plain", "Not found");
    }
  });

  server.on("/api/arduino/fingerprint/([0-9]+)", HTTP_DELETE, [](){
    sendCORSHeaders();
    
    String uri = server.uri();
    int lastSlash = uri.lastIndexOf('/');
    String idStr = uri.substring(lastSlash + 1);
    int id = idStr.toInt();
    
    if (id < 1 || id > 127) {
      server.send(400, "application/json", "{\"success\":false,\"message\":\"ID de huella inválido\"}");
      return;
    }
    
    uint8_t p = finger.deleteModel(id);
    if (p == FINGERPRINT_OK) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Huella eliminada");
      lcd.setCursor(0, 1);
      lcd.print("ID: " + String(id));
      delay(2000);
      mostrarMenuPrincipal();
      
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Huella eliminada correctamente\"}");
    } else {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Error al eliminar");
      lcd.setCursor(0, 1);
      lcd.print("huella");
      delay(2000);
      mostrarMenuPrincipal();
      
      server.send(500, "application/json", "{\"success\":false,\"message\":\"Error al eliminar huella\"}");
    }
  });

  server.on("/api/arduino/rfid/([^/]+)", HTTP_DELETE, [](){
    sendCORSHeaders();
    
    String uri = server.uri();
    int lastSlash = uri.lastIndexOf('/');
    String rfidId = uri.substring(lastSlash + 1);
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Tarjeta RFID");
    lcd.setCursor(0, 1);
    lcd.print("eliminada");
    delay(2000);
    mostrarMenuPrincipal();
    
    server.send(200, "application/json", "{\"success\":true,\"message\":\"RFID eliminado correctamente\"}");
  });

  server.on("/api/arduino/fingerprint/([0-9]+)", HTTP_OPTIONS, [](){
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.on("/api/arduino/rfid/([^/]+)", HTTP_OPTIONS, [](){
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.on("/api/arduino/rfid/reset", HTTP_POST, []() {
    sendCORSHeaders();
    
    isRFIDOperationActive = false;
    registroRfidActivo = false;
    rfidStatus = "idle";
    lastCardId = "";
    lastErrorMessage = "";
    
    Serial.println("Estado de RFID reiniciado");
    
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Estado RFID reiniciado\"}");
  });

  server.on("/api/arduino/rfid/reset", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.on("/api/arduino/info", HTTP_GET, []() {
    sendCORSHeaders();
    
    String mac = WiFi.macAddress();
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("MAC Address:");
    lcd.setCursor(0, 1);
    lcd.print(mac);
    
    DynamicJsonDocument doc(200);
    doc["mac"] = mac;
    doc["ip"] = WiFi.localIP().toString();
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });

  server.on("/api/arduino/info", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.on("/api/arduino/register-complete", HTTP_POST, []() {
    sendCORSHeaders();
    
    mostrarMenuPrincipal();
    
    server.send(200, "application/json", "{\"success\":true}");
  });

  server.on("/api/arduino/register-complete", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.on("/api/arduino/doorstatus", HTTP_GET, handleDoorStatus);
  server.on("/api/arduino/doorstatus", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.begin();
  Serial.println("Servidor web iniciado");

  setupMQTT();

  mostrarMenuPrincipal();
}

void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

void handleLeerRFID() {
  sendCORSHeaders();

  if (!mfrc522.PICC_IsNewCardPresent()) {
    server.send(200, "text/plain", "No se detectó ninguna tarjeta RFID");
    return;
  }

  if (!mfrc522.PICC_ReadCardSerial()) {
    server.send(200, "text/plain", "Error al leer la tarjeta RFID");
    return;
  }

  String tagID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    tagID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    tagID += String(mfrc522.uid.uidByte[i], HEX);
  }
  tagID.toUpperCase();

  server.send(200, "text/plain", tagID);
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

void handleControlPuerta() {
  sendCORSHeaders();

  if (server.hasArg("action")) {
    String action = server.arg("action");

    if (action == "abrir") {
      digitalWrite(RELAY_PIN, LOW);
      server.send(200, "text/plain", "Puerta abierta");
      delay(5000);
      digitalWrite(RELAY_PIN, HIGH);
    } else if (action == "cerrar") {
      digitalWrite(RELAY_PIN, HIGH);
      server.send(200, "text/plain", "Puerta cerrada");
    } else {
      server.send(400, "text/plain", "Acción no válida");
    }
  } else {
    server.send(400, "text/plain", "Falta el parámetro 'action'");
  }
}

void handleStatus() {
  sendCORSHeaders();
  
  DynamicJsonDocument doc(200);
  doc["connected"] = true;
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleStartRFIDRead() {
  sendCORSHeaders();
  
  if (isRFIDOperationActive) {
    if (millis() - rfidOperationStartTime > RFID_TIMEOUT) {
      isRFIDOperationActive = false;
      rfidStatus = "idle";
      lastCardId = "";
      lastErrorMessage = "";
    } else {
      server.send(409, "application/json", "{\"error\":\"Ya hay una operación RFID en progreso\"}");
      return;
    }
  }
  
  isRFIDOperationActive = true;
  registroRfidActivo = true;
  rfidStatus = "reading";
  rfidOperationStartTime = millis();
  lastCardId = "";
  lastErrorMessage = "";
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Acerque tarjeta");
  lcd.setCursor(0, 1);
  lcd.print("RFID al lector");
  
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Iniciando lectura RFID\"}");
  
  Serial.println("Iniciando lectura RFID");
}

void handleRFIDStatus() {
  sendCORSHeaders();
  
  if (rfidStatus == "reading") {
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      String tagID = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        tagID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
        tagID += String(mfrc522.uid.uidByte[i], HEX);
      }
      
      tagID.toUpperCase();
      lastCardId = tagID;
      
      rfidStatus = "completed";
      
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
      
      if (registroRfidActivo) {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("RFID capturado!");
        lcd.setCursor(0, 1);
        lcd.print(lastCardId.substring(0, 8) + "...");
        delay(2000);
        mostrarMenuPrincipal();
      }
    }
  }
  
  DynamicJsonDocument doc(200);
  doc["status"] = rfidStatus;
  
  if (rfidStatus == "completed") {
    doc["cardId"] = lastCardId;
    
    isRFIDOperationActive = false;
    registroRfidActivo = false;
  }
  
  if (rfidStatus == "error") {
    doc["message"] = lastErrorMessage;
    
    isRFIDOperationActive = false;
    registroRfidActivo = false;
  }
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleFingerprintRegister() {
  sendCORSHeaders();
  
  DynamicJsonDocument doc(512);
  deserializeJson(doc, server.arg("plain"));
  
  String userName = doc["userName"].as<String>();
  
  lastFingerprintId = random(1, 128);
  
  registroRemotoActivo = true;
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Registrando");
  lcd.setCursor(0, 1);
  lcd.print("huella para " + (userName.length() > 10 ? userName.substring(0, 10) : userName));
  
  fingerprintStatus = "step1";
  registrationStep = 1;
  isRegistrationActive = true;
  
  DynamicJsonDocument responseDoc(200);
  responseDoc["fingerprintId"] = String(lastFingerprintId);
  
  String response;
  serializeJson(responseDoc, response);
  server.send(200, "application/json", response);
  responseDoc.clear();
}

void handleFingerprintStatus() {
  sendCORSHeaders();
  
  DynamicJsonDocument doc(200);
  doc["status"] = fingerprintStatus;
  
  if (fingerprintStatus == "error") {
    doc["message"] = lastErrorMessage;
  }
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void mostrarMenuPrincipal() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Ingresa el PIN:");
}

void actualizarClave() {
  lcd.setCursor(0, 1);
  lcd.print("PIN ");
  for(int i = 0; i < 12; i++) {
    lcd.setCursor(5 + i, 1);
    lcd.print(" ");
  }
  for(int i = 0; i < indiceClave; i++) {
    lcd.setCursor(5 + i, 1);
    lcd.print("*");
  }
}

void ingresarClave(char tecla) {
  pitidoCorto();
  
  if (tecla == 'D' && indiceClave > 0) {
    indiceClave--;
    actualizarClave();
  }
  else if (tecla >= '0' && tecla <= '9' && indiceClave < 4) {
    claveIngresada[indiceClave] = tecla;
    
    lcd.setCursor(5 + indiceClave, 1);
    lcd.print(tecla);
    
    posicionTeclaActual = indiceClave;
    reemplazarCaracter = true;
    tiempoUltimaTecla = millis();
    
    indiceClave++;
    
    if (indiceClave == 4) {
      claveIngresada[4] = '\0';
      
      if (mqttClient.connected()) {
        mqttClient.publish("valoresPuerta/PIN", claveIngresada, true);
        Serial.println("PIN publicado en HiveMQ: " + String(claveIngresada));
      }
      
      verificarPINEnServidor();
      
      indiceClave = 0;
      reemplazarCaracter = false;
    }
  }
}

void verificarPINEnServidor() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Verificando PIN...");
  
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String serverUrl = "http://" + String(ipServer) + "/api/pins/verify";
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", "IntegradorIOTKey2025");
    
    String macAddress = WiFi.macAddress();
    String jsonData = "{\"macAddress\":\"" + macAddress + "\",\"pin\":\"" + String(claveIngresada) + "\"}";
    
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode == 200) {
      String response = http.getString();
      
      DynamicJsonDocument doc(256);
      deserializeJson(doc, response);
      
      if (doc["authorized"].as<bool>()) {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Acceso");
        lcd.setCursor(0, 1);
        lcd.print("Concedido");
        pitidoExito();
        digitalWrite(RELAY_PIN, LOW);
        
        contadorDetecciones = 0;
        alarmaActivada = false;
        alarmaCicloCompletado = false;
        
        delay(5000);
        digitalWrite(RELAY_PIN, HIGH);
        estaBloqueado = true; 
        intentosFallidos = 0;
        estadoMenu = 0;
      } else {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("PIN");
        lcd.setCursor(0, 1);
        lcd.print("Incorrecto");
        intentosFallidos++;
        if (intentosFallidos >= 5) {
          pitidoError();
        }
        delay(2000);
      }
    } else {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Error de");
      lcd.setCursor(0, 1);
      lcd.print("conexion");
      delay(2000);
    }
    
    http.end();
  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sin conexion");
    lcd.setCursor(0, 1);
    lcd.print("WiFi");
    delay(2000);
  }
  
  mostrarMenuPrincipal();
}

void verificarRFID() {
  if (registroRfidActivo || isRFIDOperationActive) return;
  
  mfrc522.PCD_Init();
  delay(50);
  
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }
  
  delay(50);
  
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  String tagID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    tagID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    tagID += String(mfrc522.uid.uidByte[i], HEX);
  }
  
  tagID.toUpperCase();
  Serial.println("RFID detectado: " + tagID);
  
  if (mqttClient.connected()) {
    mqttClient.publish("valoresPuerta/valorRFID", tagID.c_str(), true);
    Serial.println("RFID publicado en HiveMQ: " + tagID);
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String serverUrl = "http://" + String(ipServer) + "/api/rfids/verify-device";
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", "IntegradorIOTKey2025");
    
    String jsonData = "{\"rfid\":\"" + tagID + "\"}";
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode == 200) {
      String response = http.getString();
      Serial.println("Respuesta: " + response);
      
      DynamicJsonDocument doc(256);
      deserializeJson(doc, response);
      
      if (doc["authorized"].as<bool>()) {
        lcd.clear();
        lcd.print("Acceso Concedido");
        lcd.setCursor(0, 1);
        lcd.print("RFID: " + tagID.substring(0, 8) + "...");
        pitidoExito();
        digitalWrite(RELAY_PIN, LOW);
        
        contadorDetecciones = 0;
        alarmaActivada = false;
        alarmaCicloCompletado = false;
        
        delay(5000);
        digitalWrite(RELAY_PIN, HIGH);
        intentosFallidos = 0;
      } else {
        lcd.clear();
        lcd.print("RFID no");
        lcd.setCursor(0, 1);
        lcd.print("autorizado");
        intentosFallidos++;
        if (intentosFallidos >= 5) {
          pitidoError();
        }
        delay(2000);
      }
    } else {
      lcd.clear();
      lcd.print("Error de");
      lcd.setCursor(0, 1);
      lcd.print("verificacion");
      delay(2000);
    }
    
    http.end();
  } else {
    lcd.clear();
    lcd.print("Sin conexion");
    lcd.setCursor(0, 1);
    lcd.print("al servidor");
    delay(2000);
  }

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  
  mfrc522.PCD_Reset();
  mfrc522.PCD_Init();

  mostrarMenuPrincipal();
}

void verificarSensorPIR() {
  unsigned long tiempoActual = millis();
  
  if (digitalRead(pinPIR) == HIGH) {
    if (tiempoActual - tiempoUltimaDeteccion >= retrasoDeteccion) {
      contadorDetecciones++;
      tiempoUltimaDeteccion = tiempoActual;
      Serial.println("Movimiento detectado");
      Serial.println("Contador " + String(contadorDetecciones));

      if (contadorDetecciones >= 12 && !alarmaActivada && !alarmaCicloCompletado) {
        alarmaActivada = true;
        contadorPitidos = 0;
        tiempoUltimoPitido = tiempoActual;
        Serial.println("Alarma activada");
        
        if(WiFi.status() == WL_CONNECTED) {
          HTTPClient http;
          String serverUrl = "http://" + String(ipServer) + "/api/registros/add";
          Serial.println("Intentando conectar a: " + serverUrl);
          
          http.begin(serverUrl);
          http.addHeader("Content-Type", "application/json");
          
          String jsonData = "{\"mensaje\":\"Alerta\",\"descripcion\":\"Detección sospechosa\"}";
          Serial.println("Enviando datos: " + jsonData);
          
          int httpResponseCode = http.POST(jsonData);
          
          if(httpResponseCode > 0) {
            String response = http.getString();
            Serial.println("Código de respuesta HTTP: " + String(httpResponseCode));
            Serial.println("Respuesta del servidor: " + response);
          } else {
            Serial.println("Error en la petición HTTP. Código: " + String(httpResponseCode));
          }
          http.end();
        }
        
        if (mqttClient.connected()) {
          mqttClient.publish("valoresPuerta/alarma", "activada", true);
          Serial.println("Alarma publicada en HiveMQ");
        }
      }
    }
  } else {
    if (tiempoActual - tiempoUltimaDeteccion > 30000) {
      contadorDetecciones = 0;
      alarmaCicloCompletado = false;
      Serial.println("Contador reiniciado por inactividad");
    }
  }
  
  if (alarmaActivada && contadorPitidos < 6) {
    if (tiempoActual - tiempoUltimoPitido > 500) {
      digitalWrite(pinBuzzer, HIGH);
      delay(300);
      digitalWrite(pinBuzzer, LOW);
      
      contadorPitidos++;
      tiempoUltimoPitido = tiempoActual;
      
      if (contadorPitidos >= 6) {
        alarmaActivada = false;
        alarmaCicloCompletado = true;
        Serial.println("Alarma desactivada después de 6 pitidos");
      }
    }
  } else {
    digitalWrite(pinBuzzer, LOW);
  }
}

void mostrarMensajeHuella(const char* mensaje) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(mensaje);
}

void verificarHuella() {
  if (registroRemotoActivo) return;
  
  int p = finger.getImage();
  if (p == FINGERPRINT_OK) {
    p = finger.image2Tz(1);
    if (p == FINGERPRINT_OK) {
      p = finger.fingerFastSearch();
      if (p == FINGERPRINT_OK) {
        lcd.clear();
        lcd.print("Acceso Concedido");
        pitidoExito();
        digitalWrite(RELAY_PIN, LOW);
        
        contadorDetecciones = 0;
        alarmaActivada = false;
        alarmaCicloCompletado = false;
        
        delay(5000);
        digitalWrite(RELAY_PIN, HIGH);
        intentosFallidos = 0;
      } else {
        lcd.clear();
        lcd.print("Huella invalida");
        intentosFallidos++;
        if (intentosFallidos >= 5) {
          pitidoError();
        }
        delay(2000);
      }
      mostrarMenuPrincipal();
    }
  }
}

void processFingerprintRegistration() {
  if (!isRegistrationActive) return;
  
  switch (registrationStep) {
    case 1:
      {
        if (millis() % 2000 < 1000) {
          lcd.setCursor(0, 0);
          lcd.print("Coloca tu dedo  ");
        } else {
          lcd.setCursor(0, 0);
          lcd.print("Esperando huella");
        }
        
        int p = finger.getImage();
        if (p == FINGERPRINT_OK) {
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Huella detectada");
          
          p = finger.image2Tz(1);
          if (p == FINGERPRINT_OK) {
            fingerprintStatus = "step2";
            registrationStep = 2;
          } else {
            fingerprintStatus = "error";
            lastErrorMessage = "Error al procesar primera imagen";
            isRegistrationActive = false;
            registroRemotoActivo = false;
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Error al procesar");
            lcd.setCursor(0, 1);
            lcd.print("la huella");
            delay(2000);
            mostrarMenuPrincipal();
          }
        }
      }
      break;
      
    case 2:
      {
        lcd.setCursor(0, 0);
        lcd.print("Retira tu dedo  ");
        
        if (finger.getImage() == FINGERPRINT_NOFINGER) {
          registrationStep = 3;
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Ahora coloca");
          lcd.setCursor(0, 1);
          lcd.print("el dedo de nuevo");
        }
      }
      break;
      
    case 3:
      {
        if (millis() % 2000 < 1000) {
          lcd.setCursor(0, 0);
          lcd.print("Coloca tu dedo  ");
          lcd.setCursor(0, 1);
          lcd.print("nuevamente      ");
        }
        
        int p = finger.getImage();
        if (p == FINGERPRINT_OK) {
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Procesando...");
          
          p = finger.image2Tz(2);
          if (p == FINGERPRINT_OK) {
            p = finger.createModel();
            if (p == FINGERPRINT_OK) {
              lcd.setCursor(0, 0);
              lcd.print("Guardando huella");
              
              p = finger.storeModel(lastFingerprintId);
              if (p == FINGERPRINT_OK) {
                fingerprintStatus = "completed";
                isRegistrationActive = false;
                registroRemotoActivo = false;
                lcd.clear();
                lcd.setCursor(0, 0);
                lcd.print("Huella guardada!");
                lcd.setCursor(0, 1);
                lcd.print("ID: " + String(lastFingerprintId));
                delay(3000);
                mostrarMenuPrincipal();
              } else {
                fingerprintStatus = "error";
                lastErrorMessage = "Error al almacenar modelo";
                isRegistrationActive = false;
                registroRemotoActivo = false;
                lcd.clear();
                lcd.setCursor(0, 0);
                lcd.print("Error al guardar");
                delay(2000);
                mostrarMenuPrincipal();
              }
            } else {
              fingerprintStatus = "error";
              lastErrorMessage = "Error al crear modelo";
              isRegistrationActive = false;
              registroRemotoActivo = false;
              lcd.clear();
              lcd.setCursor(0, 0);
              lcd.print("Error al crear");
              lcd.setCursor(0, 1);
              lcd.print("modelo de huella");
              delay(2000);
              mostrarMenuPrincipal();
            }
          } else {
            fingerprintStatus = "error";
            lastErrorMessage = "Error al procesar segunda imagen";
            isRegistrationActive = false;
            registroRemotoActivo = false;
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Error en 2da");
            lcd.setCursor(0, 1);
            lcd.print("captura");
            delay(2000);
            mostrarMenuPrincipal();
          }
        }
      }
      break;
  }
}

void verificarSensorMagnetico() {
  unsigned long tiempoActual = millis();
  
  if (tiempoActual - lastDoorStatusCheck >= DOOR_CHECK_INTERVAL) {
    lastDoorStatusCheck = tiempoActual;
    
    int nuevoEstado = digitalRead(MAGNETIC_SENSOR_PIN);
    
    if (nuevoEstado != doorState) {
      doorState = nuevoEstado;
      Serial.println("Estado de puerta: " + String(doorState == HIGH ? "Abierta" : "Cerrada"));
      
      enviarCambioEstadoPuerta();
    }
  }
}

void enviarCambioEstadoPuerta() {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String serverUrl = "http://" + String(ipServer) + "/api/door/status-change";
    
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", "IntegradorIOTKey2025");
    
    String estadoActual = doorState == HIGH ? "open" : "closed";
    String jsonData = "{\"status\":\"" + estadoActual + "\"}";
    
    int httpResponseCode = http.POST(jsonData);
    
    if(httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Notificación de cambio enviada: " + response);
    } else {
      Serial.println("Error al enviar cambio de estado: " + String(httpResponseCode));
    }
    http.end();
    
    if (mqttClient.connected()) {
      mqttClient.publish("valoresPuerta/estadoPuerta", estadoActual.c_str(), true);
      Serial.println("Estado de puerta publicado en HiveMQ: " + estadoActual);
    }
    
    if(estadoActual == "open") {
      http.begin("http://" + String(ipServer) + "/api/registros/add");
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-API-Key", "IntegradorIOTKey2025");
      
      String registroData = "{\"mensaje\":\"Apertura de puerta\",\"descripcion\":\"La puerta ha sido abierta\"}";
      httpResponseCode = http.POST(registroData);
      
      if(httpResponseCode > 0) {
        Serial.println("Registro de apertura creado correctamente");
      } else {
        Serial.println("Error al crear registro de apertura: " + String(httpResponseCode));
      }
      http.end();
    }
  }
}

void handleDoorStatus() {
  sendCORSHeaders();
  
  DynamicJsonDocument doc(200);
  doc["status"] = doorState == HIGH ? "open" : "closed";
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void enviarAlertaApertura() {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String serverUrl = "http://" + String(ipServer) + "/api/registros/add";
    
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", "IntegradorIOTKey2025");
    
    String jsonData = "{\"mensaje\":\"Alerta\",\"descripcion\":\"Apertura forzada de puerta\"}";
    
    int httpResponseCode = http.POST(jsonData);
    
    if(httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Alerta de apertura enviada: " + response);
    } else {
      Serial.println("Error al enviar alerta: " + String(httpResponseCode));
    }
    http.end();
  }
}

void loop() {
  if (reemplazarCaracter && millis() - tiempoUltimaTecla >= 400) {
    lcd.setCursor(5 + posicionTeclaActual, 1);
    lcd.print("*");
    reemplazarCaracter = false;
  }
  
  char tecla = teclado.getKey();
  if (tecla) {
    Serial.println("Tecla presionada: " + String(tecla));
    if (estadoMenu == 0) {
      ingresarClave(tecla);
    } else {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Tecla: " + String(tecla));
      delay(1000);
      mostrarMenuPrincipal();
    }
  }
  
  verificarSensorPIR();
  verificarRFID();
  verificarHuella();
  verificarSensorMagnetico();
  processFingerprintRegistration();
  
  server.handleClient();

  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
  unsigned long currentMillis = millis();
  if (currentMillis - lastMqttPublish >= MQTT_PUBLISH_INTERVAL) {
    lastMqttPublish = currentMillis;
    
    char pirMsg[10];
    sprintf(pirMsg, "%d", contadorDetecciones);
    mqttClient.publish(mqtt_pir_topic, pirMsg, true);
    
    char doorMsg[2];
    sprintf(doorMsg, "%d", doorState);
    mqttClient.publish(mqtt_magnetic_topic, doorMsg, true);
    
    // Publicar la dirección MAC periódicamente
    String macAddress = WiFi.macAddress();
    mqttClient.publish(mqtt_mac_topic, macAddress.c_str(), true);
  }
}