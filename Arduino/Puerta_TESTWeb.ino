#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Key.h>
#include <Keypad.h>
#include <HardwareSerial.h>
#include <Adafruit_Fingerprint.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h> // Biblioteca para WiFi
#include <WebServer.h> // Biblioteca para el servidor web
#include <HTTPClient.h>
#include <ArduinoJson.h>  // Añadir esta biblioteca

// Configuración del WiFi
const char* ssid = "Telcel-A2C3"; // Cambia esto por tu SSID
const char* password = "A810YHTMGRD"; // Cambia esto por tu contraseña

// Configuración del servidor web
WebServer server(80);

// Configuración del RFID
#define SS_PIN 4
#define RST_PIN 15
#define RELAY_PIN 25
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Configuración del LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Configuración del teclado
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

// Configuración de contraseña
const char claveCorrecta[5] = "1750";
char claveIngresada[5];
int indiceClave = 0;
bool estaBloqueado = true;
int intentosFallidos = 0;

// Estado del menú
int estadoMenu = 0;

// Configuración del sensor PIR, LED y buzzer
const int pinPIR = 34;
const int pinLED = 5;
const int pinBuzzer = 2;
int contadorDetecciones = 0;
unsigned long tiempoUltimaDeteccion = 0;
const unsigned long retrasoDeteccion = 1000;
const unsigned long umbralAlarma = 60000;
bool estadoLED = false;
bool alarmaActivada = false;

// Configuración del sensor de huella
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
  pinMode(pinLED, OUTPUT);
  pinMode(pinBuzzer, OUTPUT);
  digitalWrite(pinLED, LOW);
  digitalWrite(pinBuzzer, LOW);

  // Inicialización del RFID
  SPI.begin();
  mfrc522.PCD_Init();
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  // Inicialización del sensor de huella
  mySerial.begin(57600, SERIAL_8N1, 16, 17);
  finger.begin(57600);

  // if (finger.verifyPassword()) {
  //   Serial.println("Sensor encontrado correctamente.");
  // } else {
  //   Serial.println("Error al encontrar el sensor de huellas.");
  //   while (1);
  // }

  // Conectar a WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando a WiFi...");
  }
  Serial.println("Conectado a WiFi");
  Serial.println(WiFi.localIP());

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
      delay(5000); // Mantener la puerta abierta por 5 segundos
      digitalWrite(RELAY_PIN, HIGH); // Cerrar la puerta
    } else if (action == "cerrar") {
      digitalWrite(RELAY_PIN, HIGH); // Cerrar la puerta
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
  if (isRFIDOperationActive) {
    // Retornar error de operación en progreso
    DynamicJsonDocument errorDoc(128);
    errorDoc["success"] = false;
    errorDoc["message"] = "Operación RFID en progreso";
    
    String errorResponse;
    serializeJson(errorDoc, errorResponse);
    sendCORSHeaders();
    server.send(409, "application/json", errorResponse);
    return;
  }
  
  isRFIDOperationActive = true;
  rfidStatus = "reading";
  lastCardId = "";
  rfidOperationStartTime = millis();
  
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
      
      lastCardId = tagID;
      rfidStatus = "completed";
      
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
    }
  }
  
  DynamicJsonDocument doc(200);
  doc["status"] = rfidStatus;
  
  if (rfidStatus == "completed") {
    doc["cardId"] = lastCardId;
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

  Serial.print("UID de la tarjeta: ");
  String tagID = "";
  // Leer el UID de la tarjeta (con ceros a la izquierda)
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
    tagID += String(mfrc522.uid.uidByte[i], HEX);
  }
  Serial.println();

  // Convertir a mayúsculas para consistencia
  tagID.toUpperCase();

  // Conceder acceso si se detecta una tarjeta válida
  lcd.clear();
  lcd.print("Acceso Concedido");
  pitidoExito();
  digitalWrite(RELAY_PIN, LOW);
  delay(5000);
  digitalWrite(RELAY_PIN, HIGH);

  // Volvemos a "bloquear" lógicamente
  estaBloqueado = true;
  intentosFallidos = 0;

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
        delay(5000);
        digitalWrite(RELAY_PIN, HIGH);
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
        intentosFallidos++;
        if (intentosFallidos >= 5) {
          pitidoError();
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

      if (contadorDetecciones >= 3 && !estadoLED) {
        digitalWrite(pinLED, HIGH);
        estadoLED = true;
      }
      if (contadorDetecciones >= 12 && !alarmaActivada) {
        digitalWrite(pinBuzzer, HIGH);
        alarmaActivada = true;
        Serial.println("Alarma activada");
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
    }
    if (estadoLED && (millis() - tiempoUltimaDeteccion > 30000)) {
      digitalWrite(pinLED, LOW);
      estadoLED = false;
    }
    if (millis() - tiempoUltimaDeteccion > 30000) {
      contadorDetecciones = 0;
      Serial.println("Contador reiniciado");
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
      delay(2000);
    } else {
      mostrarMensajeHuella("Error al registrar");
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
      
    case 2: // Esperando que retire el dedo
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

void loop() {
  // En cada ciclo, verificar timeout
  if (rfidStatus == "reading" && millis() - rfidOperationStartTime > RFID_TIMEOUT) {
    rfidStatus = "error";
    lastErrorMessage = "Tiempo de espera agotado";
    isRFIDOperationActive = false;
  }
  char tecla = teclado.getKey();
  verificarSensorPIR();
  verificarRFID();
  verificarHuella();
  processFingerprintRegistration();
  
  if (tecla) {
    Serial.println(tecla);
    switch (estadoMenu) {
      case 0:
        if (tecla == '1') {
          if (estaBloqueado) {
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Ingrese PIN");
            lcd.setCursor(0, 1);
            lcd.print("PIN ");
            indiceClave = 0;
            estadoMenu = 1;
          } else {
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Ya esta");
            lcd.setCursor(0, 1);
            lcd.print("desbloqueado");
            delay(2000);
            mostrarMenuPrincipal();
          }
        }
        else if (tecla == '2') {
          estadoMenu = 2;
        }
        else if (tecla == '3') {
          estadoMenu = 3;
        }
        break;
      case 1:
        ingresarClave(tecla);
        break;
      case 2:
        if (tecla == 'D') {
          estadoMenu = 0;
          mostrarMenuPrincipal();
        }
        else {
          mostrarDatosSensor();
        }
        break;
      case 3:
        if (tecla == 'D') {
          estadoMenu = 0;
          mostrarMenuPrincipal();
        }
        else {
          manejarHuella();
        }
        break;
    }
  }
  if (estadoMenu == 2) {
    mostrarDatosSensor();
  }

  // Manejar solicitudes del servidor web
  server.handleClient();
}
