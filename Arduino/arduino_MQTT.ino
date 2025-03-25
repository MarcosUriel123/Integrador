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
// Añadir bibliotecas para WiFiManager y MQTT
#include <WiFiManager.h>
#include <PubSubClient.h>

// Configuración MQTT - ahora como variables no constantes
char mqtt_server[40] = "broker.emqx.io"; // Broker MQTT público por defecto
int mqtt_port = 1883;
char mqtt_topic_base[40] = "puerta_iot/"; // Base para todos los tópicos
char mqtt_client_id[40] = "ESP32_PuertaIOT";
char mqtt_username[20] = ""; // Dejar vacío si no se requiere autenticación
char mqtt_password[20] = ""; // Dejar vacío si no se requiere autenticación

// Cliente MQTT
WiFiClient espClient;
PubSubClient mqtt(espClient);

// Configuración del servidor web
WebServer server(80);

// Configuración del RFID
#define SS_PIN 4
#define RST_PIN 15
#define RELAY_PIN 25
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Configuración del LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Configuración del teclado
const byte FILAS = 4;
const byte COLUMNAS = 4;
char teclas[FILAS][COLUMNAS] = {
  {'1','5','2','A'},
  {'3','4','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

byte pinesFilas[FILAS] = {32, 14, 12, 13};
byte pinesColumnas[COLUMNAS] = {27, 26, 5, 33};
Keypad teclado = Keypad(makeKeymap(teclas), pinesFilas, pinesColumnas, FILAS, COLUMNAS);

// Configuración de contraseña
const char claveCorrecta[5] = "1750";
char claveIngresada[5];
int indiceClave = 0;
bool estaBloqueado = true;
int intentosFallidos = 0;

// Estado del menú
int estadoMenu = 0;

// Configuración del sensor PIR, LED y buzzer
const int pinPIR = 34;
const int pinLED = 5;
const int pinBuzzer = 2;
int contadorDetecciones = 0;
unsigned long tiempoUltimaDeteccion = 0;
const unsigned long retrasoDeteccion = 1000;
const unsigned long umbralAlarma = 60000;
bool estadoLED = false;
bool alarmaActivada = false;

// Configuración del sensor de huella
HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// Variables para el estado de los procesos
String rfidStatus = "idle"; // Variable global para el estado
String fingerprintStatus = "idle";
String lastCardId = "";
int lastFingerprintId = -1;
String lastErrorMessage = "";
bool isRegistrationActive = false;
int registrationStep = 0;

bool isRFIDOperationActive = false;

unsigned long rfidOperationStartTime = 0;
const unsigned long RFID_TIMEOUT = 30000; // 30 segundos

bool registroRemotoActivo = false;

// Añade estas variables globales junto con las otras variables de estado
bool registroRfidActivo = false;  // Para controlar cuando estamos registrando un RFID

// Variables para MQTT
unsigned long lastMqttReconnectAttempt = 0;
const unsigned long mqttReconnectInterval = 5000; // 5 segundos entre intentos de reconexión

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

// Función para publicar mensajes MQTT
void publishMqttMessage(const char* subtopic, const char* message) {
  if (mqtt.connected()) {
    String topic = String(mqtt_topic_base) + subtopic;
    mqtt.publish(topic.c_str(), message);
    Serial.println("MQTT mensaje enviado: " + topic + " - " + message);
  }
}

// Función de callback para mensajes MQTT recibidos
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensaje recibido [");
  Serial.print(topic);
  Serial.print("] ");
  
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  
  // Procesar comandos recibidos por MQTT
  if (String(topic) == String(mqtt_topic_base) + "control/puerta") {
    if (message == "abrir") {
      digitalWrite(RELAY_PIN, LOW); // Abrir la puerta
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Puerta abierta");
      lcd.setCursor(0, 1);
      lcd.print("via MQTT");
      publishMqttMessage("estado/puerta", "abierta");
      delay(5000);
      digitalWrite(RELAY_PIN, HIGH); // Cerrar la puerta
      publishMqttMessage("estado/puerta", "cerrada");
      mostrarMenuPrincipal();
    }
  }
}

// Función para reconectar al broker MQTT
bool reconnectMqtt() {
  if (!mqtt.connected()) {
    Serial.print("Intentando conexión MQTT...");
    if (mqtt.connect(mqtt_client_id, mqtt_username, mqtt_password)) {
      Serial.println("conectado");
      
      // Suscribirse a tópicos
      String topicSubscribe = String(mqtt_topic_base) + "control/#";
      mqtt.subscribe(topicSubscribe.c_str());
      
      // Publicar mensaje de conexión
      publishMqttMessage("estado/dispositivo", "conectado");
      return true;
    } else {
      Serial.print("falló, rc=");
      Serial.print(mqtt.state());
      Serial.println(" intentando de nuevo en 5 segundos");
      return false;
    }
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  lcd.init();
  lcd.backlight();
  pinMode(pinPIR, INPUT);
  pinMode(pinLED, OUTPUT);
  pinMode(pinBuzzer, OUTPUT);
  digitalWrite(pinLED, LOW);
  digitalWrite(pinBuzzer, LOW);

  // Inicialización del RFID
  SPI.begin();
  mfrc522.PCD_Init();
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  // Inicialización del sensor de huella
  mySerial.begin(57600, SERIAL_8N1, 16, 17);
  finger.begin(57600);

  // if (finger.verifyPassword()) {
  //   Serial.println("Sensor encontrado correctamente.");
  // } else {
  //   Serial.println("Error al encontrar el sensor de huellas.");
  //   while (1);
  // }

  // Configuración de WiFiManager
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Iniciando");
  lcd.setCursor(0, 1);
  lcd.print("WiFiManager...");
  
  WiFiManager wifiManager;
  
  // Configurar parámetros MQTT en el portal
  WiFiManagerParameter custom_mqtt_server("server", "MQTT Server", mqtt_server, 40);
  WiFiManagerParameter custom_mqtt_port("port", "MQTT Port", String(mqtt_port).c_str(), 6);
  WiFiManagerParameter custom_mqtt_user("user", "MQTT User", mqtt_username, 20);
  WiFiManagerParameter custom_mqtt_pass("pass", "MQTT Password", mqtt_password, 20);
  
  wifiManager.addParameter(&custom_mqtt_server);
  wifiManager.addParameter(&custom_mqtt_port);
  wifiManager.addParameter(&custom_mqtt_user);
  wifiManager.addParameter(&custom_mqtt_pass);
  
  // Intentar conectar usando credenciales guardadas
  // Si falla, inicia un punto de acceso llamado "PuertaIOT-Setup"
  if (!wifiManager.autoConnect("PuertaIOT-Setup")) {
    Serial.println("Falló la conexión y expiró el tiempo de espera");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Error WiFi");
    lcd.setCursor(0, 1);
    lcd.print("Reiniciando...");
    delay(3000);
    ESP.restart();
  }
  
  // Obtener parámetros MQTT del portal
  strcpy(mqtt_server, custom_mqtt_server.getValue());
  mqtt_port = String(custom_mqtt_port.getValue()).toInt();
  strcpy(mqtt_username, custom_mqtt_user.getValue());
  strcpy(mqtt_password, custom_mqtt_pass.getValue());
  
  Serial.println("Conectado a WiFi");
  Serial.println(WiFi.localIP());
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Conectado");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP().toString());
  delay(2000);
  
  // Configurar MQTT
  mqtt.setServer(mqtt_server, mqtt_port);
  mqtt.setCallback(mqttCallback);
  
  // Intentar conectar a MQTT
  reconnectMqtt();

  // Configurar rutas del servidor web
  server.on("/leerRFID", handleLeerRFID); // Ruta para leer el RFID
  server.on("/controlPuerta", handleControlPuerta); // Ruta para controlar la puerta
  server.on("/api/arduino/status", HTTP_GET, handleStatus);
  server.on("/api/arduino/rfid/read", HTTP_POST, handleStartRFIDRead);
  server.on("/api/arduino/rfid/status", HTTP_GET, handleRFIDStatus);
  server.on("/api/arduino/fingerprint/register", HTTP_POST, handleFingerprintRegister);
  server.on("/api/arduino/fingerprint/status", HTTP_GET, handleFingerprintStatus);
  server.on("/api/arduino/ping", HTTP_GET, []() {
    sendCORSHeaders();
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  });

  // Agregar este código antes de server.begin():

  // Manejador para solicitudes OPTIONS preflight
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

  // También puedes añadir un manejador genérico para cualquier ruta OPTIONS
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      sendCORSHeaders();
      server.send(200, "text/plain", "");
    } else {
      server.send(404, "text/plain", "Not found");
    }
  });

  // Añadir estos manejadores en la sección de configuración del servidor (setup)

  // Agrega esto justo después de los otros handlers en el setup
  // Manejadores para eliminar huellas (fingerprint)
  server.on("/api/arduino/fingerprint/([0-9]+)", HTTP_DELETE, [](){
    sendCORSHeaders();
    
    // Extraer el ID de la URL
    String uri = server.uri();
    int lastSlash = uri.lastIndexOf('/');
    String idStr = uri.substring(lastSlash + 1);
    int id = idStr.toInt();
    
    // Verificar ID válido
    if (id < 1 || id > 127) {
      server.send(400, "application/json", "{\"success\":false,\"message\":\"ID de huella inválido\"}");
      return;
    }
    
    // Eliminar huella
    uint8_t p = finger.deleteModel(id);
    if (p == FINGERPRINT_OK) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Huella eliminada");
      lcd.setCursor(0, 1);
      lcd.print("ID: " + String(id));
      delay(2000);
      mostrarMenuPrincipal();
      
      // Publicar en MQTT
      String mqttMsg = "{\"id\":" + String(id) + ",\"action\":\"deleted\"}";
      publishMqttMessage("evento/huella", mqttMsg.c_str());
      
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

  // Manejadores para eliminar RFID
  server.on("/api/arduino/rfid/([^/]+)", HTTP_DELETE, [](){
    sendCORSHeaders();
    
    // Extraer el ID de la URL
    String uri = server.uri();
    int lastSlash = uri.lastIndexOf('/');
    String rfidId = uri.substring(lastSlash + 1);
    
    // Mostrar mensaje en LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Tarjeta RFID");
    lcd.setCursor(0, 1);
    lcd.print("eliminada");
    delay(2000);
    mostrarMenuPrincipal();
    
    // Publicar en MQTT
    String mqttMsg = "{\"id\":\"" + rfidId + "\",\"action\":\"deleted\"}";
    publishMqttMessage("evento/rfid", mqttMsg.c_str());
    
    // Nota: Aquí deberías implementar la lógica real para eliminar el RFID
    // de tu sistema de almacenamiento (EEPROM, SD, etc.)
    // Como no veo en el código actual un sistema para almacenar IDs,
    // solo devuelvo un mensaje de éxito
    
    server.send(200, "application/json", "{\"success\":true,\"message\":\"RFID eliminado correctamente\"}");
  });

  // Manejadores OPTIONS para CORS
  server.on("/api/arduino/fingerprint/([0-9]+)", HTTP_OPTIONS, [](){
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  server.on("/api/arduino/rfid/([^/]+)", HTTP_OPTIONS, [](){
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  // Iniciar servidor
  server.begin();
  Serial.println("Servidor web iniciado");

  // Publicar mensaje de inicio
  publishMqttMessage("estado/sistema", "iniciado");

  mostrarMenuPrincipal();
}

void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

void handleLeerRFID() {
  // Agregar encabezados CORS
  sendCORSHeaders();

  // Verifica si hay una tarjeta cerca
  if (!mfrc522.PICC_IsNewCardPresent()) {
    server.send(200, "text/plain", "No se detectó ninguna tarjeta RFID");
    return;
  }

  // Intenta leer la tarjeta
  if (!mfrc522.PICC_ReadCardSerial()) {
    server.send(200, "text/plain", "Error al leer la tarjeta RFID");
    return;
  }

  // Leer el UID de la tarjeta
  String tagID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    tagID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    tagID += String(mfrc522.uid.uidByte[i], HEX);
  }
  // Convertir a mayúsculas para consistencia
  tagID.toUpperCase();

  // Enviar el UID como respuesta
  server.send(200, "text/plain", tagID);

  // Finalizar la comunicación con la tarjeta
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

void handleControlPuerta() {
  // Agregar encabezados CORS
  sendCORSHeaders();

  // Verificar si se recibió un parámetro 'action'
  if (server.hasArg("action")) {
    String action = server.arg("action");

    if (action == "abrir") {
      digitalWrite(RELAY_PIN, LOW); // Abrir la puerta
      server.send(200, "text/plain", "Puerta abierta");
      
      // Publicar en MQTT
      publishMqttMessage("estado/puerta", "abierta");
      
      delay(5000); // Mantener la puerta abierta por 5 segundos
      digitalWrite(RELAY_PIN, HIGH); // Cerrar la puerta
      
      // Publicar en MQTT
      publishMqttMessage("estado/puerta", "cerrada");
    } else if (action == "cerrar") {
      digitalWrite(RELAY_PIN, HIGH); // Cerrar la puerta
      server.send(200, "text/plain", "Puerta cerrada");
      
      // Publicar en MQTT
      publishMqttMessage("estado/puerta", "cerrada");
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
    // Retornar error de operación en progreso
    DynamicJsonDocument errorDoc(128);
    errorDoc["success"] = false;
    errorDoc["message"] = "Operación RFID en progreso";
    
    String errorResponse;
    serializeJson(errorDoc, errorResponse);
    server.send(409, "application/json", errorResponse);
    return;
  }
  
  DynamicJsonDocument inputDoc(256);
  deserializeJson(inputDoc, server.arg("plain"));
  
  // Modificar esta línea para aceptar "mode" en lugar de "registration"
  bool isRegistration = inputDoc["mode"] == "register";
  String userName = inputDoc["userName"].as<String>();
  
  isRFIDOperationActive = true;
  rfidStatus = "reading";
  lastCardId = "";
  rfidOperationStartTime = millis();
  
  // Si es para registro, activar el modo registro
  if (isRegistration) {
    registroRfidActivo = true;
    
    // Mostrar mensaje en LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Registrando RFID");
    lcd.setCursor(0, 1);
    lcd.print("para " + (userName.length() > 10 ? userName.substring(0, 10) : userName));
    
    // Publicar en MQTT
    String mqttMsg = "{\"action\":\"register_start\",\"user\":\"" + userName + "\"}";
    publishMqttMessage("evento/rfid", mqttMsg.c_str());
  } else {
    registroRfidActivo = false;
    
    // Publicar en MQTT
    publishMqttMessage("evento/rfid", "{\"action\":\"read_start\"}");
  }
  
  DynamicJsonDocument doc(200);
  doc["success"] = true;
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleRFIDStatus() {
  sendCORSHeaders();
  
  // Si está en estado "reading", intentar leer tarjeta
  if (rfidStatus == "reading") {
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      String tagID = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        tagID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
        tagID += String(mfrc522.uid.uidByte[i], HEX);
      }
      
      // Corregir estas líneas:
      tagID.toUpperCase();  // Convertir a mayúsculas in-place
      lastCardId = tagID;   // Asignar a lastCardId
      
      rfidStatus = "completed";
      
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
      
      // Si estaba en modo registro, mostrar mensaje adicional
      if (registroRfidActivo) {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("RFID capturado!");
        lcd.setCursor(0, 1);
        lcd.print(lastCardId.substring(0, 8) + "...");
        
        // Publicar en MQTT
        String mqttMsg = "{\"action\":\"register_complete\",\"cardId\":\"" + lastCardId + "\"}";
        publishMqttMessage("evento/rfid", mqttMsg.c_str());
        
        delay(2000);
        mostrarMenuPrincipal();
      } else {
        // Publicar en MQTT
        String mqttMsg = "{\"action\":\"read_complete\",\"cardId\":\"" + lastCardId + "\"}";
        publishMqttMessage("evento/rfid", mqttMsg.c_str());
      }
    }
  }
  
  DynamicJsonDocument doc(200);
  doc["status"] = rfidStatus;
  
  if (rfidStatus == "completed") {
    doc["cardId"] = lastCardId;
    
    // Resetear los flags si hemos completado
    isRFIDOperationActive = false;
    registroRfidActivo = false;
  }
  
  if (rfidStatus == "error") {
    doc["message"] = lastErrorMessage;
    
    // Resetear los flags en caso de error
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
  
  // Obtener un ID disponible para la huella
  lastFingerprintId = random(1, 128);  // En producción, usar una lógica para IDs únicos
  
  // Activar el modo de registro remoto
  registroRemotoActivo = true;
  
  // Mostrar mensaje en LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Registrando");
  lcd.setCursor(0, 1);
  lcd.print("huella para " + (userName.length() > 10 ? userName.substring(0, 10) : userName));
  
  fingerprintStatus = "step1";
  registrationStep = 1;
  isRegistrationActive = true;
  
  // Publicar en MQTT
  String mqttMsg = "{\"action\":\"register_start\",\"user\":\"" + userName + "\",\"id\":" + String(lastFingerprintId) + "}";
  publishMqttMessage("evento/huella", mqttMsg.c_str());
  
  DynamicJsonDocument responseDoc(200);
  responseDoc["fingerprintId"] = String(lastFingerprintId);
  
  String response;
  serializeJson(responseDoc, response);
  server.send(200, "application/json", response);
  responseDoc.clear(); // Liberar memoria
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

void verificarRFID() {
  // Si estamos en registro de RFID, no verificar accesos
  if (registroRfidActivo || isRFIDOperationActive) return;
  
  // Reinicializar el módulo RFID
  mfrc522.PCD_Init();
  delay(50); // Pequeña pausa para estabilización
  
  // Verifica si hay una tarjeta cerca
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }
  
  // Espera un momento para asegurarse de que la tarjeta esté estable
  delay(50);
  
  // Intenta leer la tarjeta
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  String tagID = "";
  // Leer el UID de la tarjeta (con ceros a la izquierda)
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    tagID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    tagID += String(mfrc522.uid.uidByte[i], HEX);
  }
  
  // Convertir a mayúsculas para consistencia
  tagID.toUpperCase();
  Serial.println("RFID detectado: " + tagID);
  
  // Publicar en MQTT
  String mqttMsg = "{\"action\":\"detected\",\"cardId\":\"" + tagID + "\"}";
  publishMqttMessage("evento/rfid", mqttMsg.c_str());

  // Verificar el RFID contra el servidor
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String serverUrl = "http://192.168.8.3:8082/api/rfids/verify";
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String jsonData = "{\"rfid\":\"" + tagID + "\"}";
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode == 200) {
      String response = http.getString();
      Serial.println("Respuesta: " + response);
      
      // Verificar si el RFID está autorizado
      DynamicJsonDocument doc(256);
      deserializeJson(doc, response);
      
      if (doc["authorized"].as<bool>()) {
        // Conceder acceso
        lcd.clear();
        lcd.print("Acceso Concedido");
        lcd.setCursor(0, 1);
        lcd.print("RFID: " + tagID.substring(0, 8) + "...");
        
        pitidoExito();
        digitalWrite(RELAY_PIN, LOW);
        
        // Publicar en MQTT
        String mqttPayload = "{\"authorized\":true,\"cardId\":\"" + tagID + "\"}";
        publishMqttMessage("estado/puerta", "abierta");
        publishMqttMessage("acceso/rfid", mqttPayload.c_str());
        
        delay(5000);
        digitalWrite(RELAY_PIN, HIGH);
        
        // Publicar cierre de puerta en MQTT
        publishMqttMessage("estado/puerta", "cerrada");
        
        intentosFallidos = 0;
      } else {
        // RFID no autorizado
        lcd.clear();
        lcd.print("RFID no");
        lcd.setCursor(0, 1);
        lcd.print("autorizado");
        
        // Publicar en MQTT
        String mqttPayload = "{\"authorized\":false,\"cardId\":\"" + tagID + "\"}";
        publishMqttMessage("acceso/rfid", mqttPayload.c_str());
        
        intentosFallidos++;
        if (intentosFallidos >= 5) {
          pitidoError();
          
          // Publicar alerta en MQTT
          String alertPayload = "{\"count\":" + String(intentosFallidos) + ",\"type\":\"rfid\"}";
          publishMqttMessage("alerta/intentos", alertPayload.c_str());
        }
        delay(2000);
      }
    } else {
      // Error de conexión
      lcd.clear();
      lcd.print("Error de");
      lcd.setCursor(0, 1);
      lcd.print("verificacion");
      
      // Publicar error en MQTT
      String errorPayload = "{\"code\":" + String(httpResponseCode) + ",\"message\":\"Error de verificación RFID\"}";
      publishMqttMessage("error/sistema", errorPayload.c_str());
      
      delay(2000);
    }
    
    http.end();
  } else {
    // Sin conexión WiFi, no podemos verificar
    lcd.clear();
    lcd.print("Sin conexion");
    lcd.setCursor(0, 1);
    lcd.print("al servidor");
    
    // Publicar error en MQTT
    publishMqttMessage("error/sistema", "{\"message\":\"Sin conexión al servidor\"}");
    
    delay(2000);
  }

  // Finalizar correctamente la comunicación con la tarjeta
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  
  // Asegurarnos de que el módulo esté listo para la siguiente lectura
  mfrc522.PCD_Reset();
  mfrc522.PCD_Init();

  // Regresamos al menú principal
  mostrarMenuPrincipal();
}

void ingresarClave(char tecla) {
  pitidoCorto();
  
  if (tecla == 'D' && indiceClave > 0) {
    indiceClave--;
    actualizarClave();
  }
  else if (tecla >= '0' && tecla <= '9' && indiceClave < 4) {
    claveIngresada[indiceClave] = tecla;
    indiceClave++;
    actualizarClave();
    if (indiceClave == 4) {
      claveIngresada[4] = '\0';
      if (strcmp(claveIngresada, claveCorrecta) == 0) {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Acceso");
        lcd.setCursor(0, 1);
        lcd.print("Concedido");
        pitidoExito();
        digitalWrite(RELAY_PIN, LOW);
        
        // Publicar en MQTT
        publishMqttMessage("estado/puerta", "abierta");
        publishMqttMessage("acceso/pin", "{\"authorized\":true}");
        
        delay(5000);
        digitalWrite(RELAY_PIN, HIGH);
        
        // Publicar cierre de puerta en MQTT
        publishMqttMessage("estado/puerta", "cerrada");
        
        // Bloqueamos de nuevo lógicamente
        estaBloqueado = true; 
        intentosFallidos = 0;
        estadoMenu = 0;
        mostrarMenuPrincipal();
      } else {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("PIN");
        lcd.setCursor(0, 1);
        lcd.print("Incorrecto");
        
        // Publicar en MQTT
        publishMqttMessage("acceso/pin", "{\"authorized\":false}");
        
        intentosFallidos++;
        if (intentosFallidos >= 5) {
          pitidoError();
          
          // Publicar alerta en MQTT
          String alertPayload = "{\"count\":" + String(intentosFallidos) + ",\"type\":\"pin\"}";
          publishMqttMessage("alerta/intentos", alertPayload.c_str());
        }
        delay(2000);
        estadoMenu = 0;
        mostrarMenuPrincipal();
      }
      indiceClave = 0;
    }
  }
}

void verificarSensorPIR() {
  if (digitalRead(pinPIR) == HIGH) {
    if (millis() - tiempoUltimaDeteccion >= retrasoDeteccion) {
      contadorDetecciones++;
      tiempoUltimaDeteccion = millis();
      Serial.println("Movimiento detectado");
      Serial.println("Contador " + String(contadorDetecciones));
      
      // Publicar detección en MQTT
      String pirPayload = "{\"detected\":true,\"count\":" + String(contadorDetecciones) + "}";
      publishMqttMessage("sensor/pir", pirPayload.c_str());

      if (contadorDetecciones >= 3 && !estadoLED) {
        digitalWrite(pinLED, HIGH);
        estadoLED = true;
        
        // Publicar alerta en MQTT
        String alertPayload = "{\"level\":\"warning\",\"count\":" + String(contadorDetecciones) + "}";
        publishMqttMessage("alerta/movimiento", alertPayload.c_str());
      }
      if (contadorDetecciones >= 12 && !alarmaActivada) {
        digitalWrite(pinBuzzer, HIGH);
        alarmaActivada = true;
        Serial.println("Alarma activada");
        
        // Publicar alarma en MQTT
        String alertPayload = "{\"level\":\"critical\",\"count\":" + String(contadorDetecciones) + "}";
        publishMqttMessage("alerta/movimiento", alertPayload.c_str());
        
        // Enviar datos al servidor
        if(WiFi.status() == WL_CONNECTED) {
          HTTPClient http;
          
          // URL correcta
          String serverUrl = "http://192.168.8.6:8082/api/registros/add"; //IP DE IPCONFIG
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
            Serial.println("Registro enviado exitosamente");
          } else {
            Serial.println("Error en la petición HTTP. Código: " + String(httpResponseCode));
            Serial.println("Error: " + http.errorToString(httpResponseCode));
          }
          http.end();
        } else {
          Serial.println("Error: No hay conexión WiFi");
        }        
      }
    }
  } else {
    if (alarmaActivada && (millis() - tiempoUltimaDeteccion > 30000)) {
      digitalWrite(pinBuzzer, LOW);
      alarmaActivada = false;
      Serial.println("Alarma desactivada");
      
      // Publicar en MQTT
      publishMqttMessage("alerta/movimiento", "{\"level\":\"normal\",\"status\":\"cleared\"}");
    }
    if (estadoLED && (millis() - tiempoUltimaDeteccion > 30000)) {
      digitalWrite(pinLED, LOW);
      estadoLED = false;
    }
    if (millis() - tiempoUltimaDeteccion > 30000) {
      contadorDetecciones = 0;
      Serial.println("Contador reiniciado");
      
      // Publicar en MQTT
      publishMqttMessage("sensor/pir", "{\"detected\":false,\"count\":0}");
    }
  }
}

void mostrarDatosSensor() {
  verificarSensorPIR();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Detecciones ");
  lcd.print(contadorDetecciones);
  lcd.setCursor(0, 1);
  lcd.print(estadoLED ? "Alerta" : "Normal");
  lcd.print(" D Menu");
  delay(500);
}

void mostrarMensajeHuella(const char* mensaje) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(mensaje);
}

void manejarHuella() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("1 Registrar");
  lcd.setCursor(0, 1);
  lcd.print("2 Verificar D Menu");

  char tecla = teclado.waitForKey();
  if (tecla == '1') {
    int id = capturarHuella();
    if (id > 0) {
      mostrarMensajeHuella("Huella almacenada");
      
      // Publicar en MQTT
      String mqttPayload = "{\"action\":\"registered\",\"id\":" + String(id) + "}";
      publishMqttMessage("evento/huella", mqttPayload.c_str());
      
      delay(2000);
    } else {
      mostrarMensajeHuella("Error al registrar");
      
      // Publicar error en MQTT
      publishMqttMessage("error/huella", "{\"message\":\"Error al registrar huella\"}");
      
      delay(2000);
    }
  } else if (tecla == '2') {
    verificarHuella();
  } else if (tecla == 'D') {
    estadoMenu = 0;
    mostrarMenuPrincipal();
  }
}

int capturarHuella() {
  int p = -1;
  mostrarMensajeHuella("Esperando huella...");

  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) {
      delay(100);
    } else if (p != FINGERPRINT_OK) {
      mostrarMensajeHuella("Error al capturar");
      delay(2000);
      return -1;
    }
  }

  mostrarMensajeHuella("Huella detectada");
  delay(1000);

  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    mostrarMensajeHuella("Error al convertir");
    delay(2000);
    return -1;
  }

  mostrarMensajeHuella("Retira tu dedo");
  delay(2000);

  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    delay(100);
  }

  mostrarMensajeHuella("Coloca de nuevo");
  delay(1000);

  p = -1;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    delay(100);
  }

  mostrarMensajeHuella("Huella detectada");
  delay(1000);

  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    mostrarMensajeHuella("Error en 2da captura");
    delay(2000);
    return -1;
  }

  mostrarMensajeHuella("Creando modelo");
  delay(1000);

  p = finger.createModel();
  if (p != FINGERPRINT_OK) {
    mostrarMensajeHuella("Error al crear");
    delay(2000);
    return -1;
  }

  mostrarMensajeHuella("Ingresa ID (1-127)");
  char idStr[4] = {0};
  int i = 0;
  while (i < 3) {
    char tecla = teclado.waitForKey();
    if (tecla >= '0' && tecla <= '9') {
      idStr[i++] = tecla;
      lcd.setCursor(i + 10, 1);
      lcd.print(tecla);
    } else if (tecla == 'D' && i > 0) {
      idStr[--i] = 0;
      lcd.setCursor(i + 10, 1);
      lcd.print(" ");
    } else if (tecla == '#') {
      break;
    }
  }

  int id = atoi(idStr);
  if (id < 1 || id > 127) {
    mostrarMensajeHuella("ID invalido");
    delay(2000);
    return -1;
  }

  p = finger.storeModel(id);
  if (p == FINGERPRINT_OK) {
    mostrarMensajeHuella("Huella almacenada");
    delay(2000);
    return id;
  } else {
    mostrarMensajeHuella("Error al almacenar");
    delay(2000);
    return -1;
  }
}

void verificarHuella() {
  // Si estamos en registro remoto, no verificar accesos
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
        
        // Publicar en MQTT
        String mqttPayload = "{\"authorized\":true,\"id\":" + String(finger.fingerID) + ",\"confidence\":" + String(finger.confidence) + "}";
        publishMqttMessage("acceso/huella", mqttPayload.c_str());
        publishMqttMessage("estado/puerta", "abierta");
        
        delay(5000);
        digitalWrite(RELAY_PIN, HIGH);
        
        // Publicar cierre de puerta en MQTT
        publishMqttMessage("estado/puerta", "cerrada");
        
        intentosFallidos = 0;
      } else {
        lcd.clear();
        lcd.print("Huella invalida");
        
        // Publicar en MQTT
        publishMqttMessage("acceso/huella", "{\"authorized\":false}");
        
        intentosFallidos++;
        if (intentosFallidos >= 5) {
          pitidoError();
          
          // Publicar alerta en MQTT
          String alertPayload = "{\"count\":" + String(intentosFallidos) + ",\"type\":\"huella\"}";
          publishMqttMessage("alerta/intentos", alertPayload.c_str());
        }
        delay(2000);
      }
      mostrarMenuPrincipal();
    }
  }
}

// Añadir esta función a tu código Arduino
void processFingerprintRegistration() {
  if (!isRegistrationActive) return;
  
  switch (registrationStep) {
    case 1: // Esperando primera captura
      {
        // Mostrar mensaje en LCD periódicamente
        if (millis() % 2000 < 1000) {  // Alternar cada segundo
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
          
          // Publicar en MQTT
          publishMqttMessage("evento/huella", "{\"step\":1,\"status\":\"detected\"}");
          
          p = finger.image2Tz(1);
          if (p == FINGERPRINT_OK) {
            fingerprintStatus = "step2";
            registrationStep = 2;
            
            // Publicar en MQTT
            publishMqttMessage("evento/huella", "{\"step\":1,\"status\":\"completed\"}");
          } else {
            fingerprintStatus = "error";
            lastErrorMessage = "Error al procesar primera imagen";
            isRegistrationActive = false;
            registroRemotoActivo = false;
            
            // Publicar error en MQTT
            publishMqttMessage("error/huella", "{\"step\":1,\"message\":\"Error al procesar primera imagen\"}");
            
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
      
    case 2: // Esperando que retire el dedo
      {
        lcd.setCursor(0, 0);
        lcd.print("Retira tu dedo  ");
        
        if (finger.getImage() == FINGERPRINT_NOFINGER) {
          registrationStep = 3;
          
          // Publicar en MQTT
          publishMqttMessage("evento/huella", "{\"step\":2,\"status\":\"completed\"}");
          
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Ahora coloca");
          lcd.setCursor(0, 1);
          lcd.print("el dedo de nuevo");
        }
      }
      break;
      
    case 3: // Esperando segunda captura
      {
        // Mostrar mensaje en LCD periódicamente
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
          
          // Publicar en MQTT
          publishMqttMessage("evento/huella", "{\"step\":3,\"status\":\"detected\"}");
          
          p = finger.image2Tz(2);
          if (p == FINGERPRINT_OK) {
            p = finger.createModel();
            if (p == FINGERPRINT_OK) {
              lcd.setCursor(0, 0);
              lcd.print("Guardando huella");
              
              // Publicar en MQTT
              publishMqttMessage("evento/huella", "{\"step\":3,\"status\":\"model_created\"}");
              
              p = finger.storeModel(lastFingerprintId);
              if (p == FINGERPRINT_OK) {
                fingerprintStatus = "completed";
                isRegistrationActive = false;
                registroRemotoActivo = false;
                
                // Publicar en MQTT
                String mqttPayload = "{\"action\":\"registered\",\"id\":" + String(lastFingerprintId) + "}";
                publishMqttMessage("evento/huella", mqttPayload.c_str());
                
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
                
                // Publicar error en MQTT
                publishMqttMessage("error/huella", "{\"step\":3,\"message\":\"Error al almacenar modelo\"}");
                
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
              
              // Publicar error en MQTT
              publishMqttMessage("error/huella", "{\"step\":3,\"message\":\"Error al crear modelo\"}");
              
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
            
            // Publicar error en MQTT
            publishMqttMessage("error/huella", "{\"step\":3,\"message\":\"Error al procesar segunda imagen\"}");
            
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

void loop() {
  // Verificar conexión MQTT y reconectar si es necesario
  if (!mqtt.connected()) {
    unsigned long now = millis();
    if (now - lastMqttReconnectAttempt > mqttReconnectInterval) {
      lastMqttReconnectAttempt = now;
      if (reconnectMqtt()) {
        lastMqttReconnectAttempt = 0;
      }
    }
  } else {
    mqtt.loop();
  }
  
  // En cada ciclo, verificar timeout
  if (rfidStatus == "reading" && millis() - rfidOperationStartTime > RFID_TIMEOUT) {
    rfidStatus = "error";
    lastErrorMessage = "Tiempo de espera agotado";
    isRFIDOperationActive = false;
    
    // Publicar error en MQTT
    publishMqttMessage("error/rfid", "{\"message\":\"Tiempo de espera agotado\"}");
  }
  char tecla = teclado.getKey();
  verificarSensorPIR();
  verificarRFID();
  verificarHuella();
  processFingerprintRegistration();
  
  // resto del código del loop...

  // Manejar solicitudes del servidor web
  server.handleClient();
}
// FIN DEL ARCHIVO