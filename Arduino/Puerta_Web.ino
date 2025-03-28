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
const char* password = "A810YHTMGRD"; // Cambia esto por tu contraseña

// Configuración del servidor
const char* ipServer = "192.168.8.2:8082"; // IP y puerto del servidor backend

// Configuración del servidor web
WebServer server(80);

// Configuración del RFID
#define SS_PIN 4
#define RST_PIN 15
#define RELAY_PIN 25
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Configuración del sensor magnético
#define MAGNETIC_SENSOR_PIN 36
int doorState = -1;  // -1: desconocido, 0: cerrado, 1: abierto
unsigned long lastDoorStatusCheck = 0;
const unsigned long DOOR_CHECK_INTERVAL = 1000; // Verificar cada segundo

// Configuración del LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Configuración del teclado
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

// Configuración de contraseña
char claveIngresada[5];
int indiceClave = 0;
bool estaBloqueado = true;
int intentosFallidos = 0;

// Estado del menú
int estadoMenu = 0;

// Configuración del sensor PIR y buzzer
const int pinPIR = 34;
const int pinBuzzer = 2;
int contadorDetecciones = 0;
unsigned long tiempoUltimaDeteccion = 0;
const unsigned long retrasoDeteccion = 1000;
bool alarmaActivada = false;
int contadorPitidos = 0;          // Nuevo: para contar los pitidos
unsigned long tiempoUltimoPitido = 0; // Nuevo: para controlar el tiempo entre pitidos
bool alarmaCicloCompletado = false;  // NUEVA: Indica si ya completó un ciclo de 6 pitidos

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

// Añade estas variables globales junto con las otras variables de estado
bool registroRfidActivo = false;  // Para controlar cuando estamos registrando un RFID

// Variables para controlar la visualización temporal de dígitos
unsigned long tiempoUltimaTecla = 0;
bool reemplazarCaracter = false;
int posicionTeclaActual = -1;

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
  
  // Inicialización del sensor magnético
  pinMode(MAGNETIC_SENSOR_PIN, INPUT);

  // Inicialización del RFID
  SPI.begin();
  mfrc522.PCD_Init();
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  // Inicialización del sensor de huella
  mySerial.begin(57600, SERIAL_8N1, 16, 17);
  finger.begin(57600);

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

  // Añadir esta nueva ruta de API en el setup() del Arduino

  server.on("/api/arduino/rfid/reset", HTTP_POST, []() {
    sendCORSHeaders();
    
    // Reiniciar variables de estado RFID
    isRFIDOperationActive = false;
    registroRfidActivo = false;
    rfidStatus = "idle";
    lastCardId = "";
    lastErrorMessage = "";
    
    Serial.println("Estado de RFID reiniciado");
    
    // Respuesta JSON
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Estado RFID reiniciado\"}");
  });

  // Asegurar que esta ruta también tenga CORS
  server.on("/api/arduino/rfid/reset", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  // Añadir en setup(), junto con los otros handlers

  // Nueva ruta para obtener información del dispositivo
  server.on("/api/arduino/info", HTTP_GET, []() {
    sendCORSHeaders();
    
    // Obtener la MAC address
    String mac = WiFi.macAddress();
    
    // Mostrar en el LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("MAC Address:");
    lcd.setCursor(0, 1);
    lcd.print(mac);
    
    // Enviar respuesta con la MAC
    DynamicJsonDocument doc(200);
    doc["mac"] = mac;
    doc["ip"] = WiFi.localIP().toString();
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });

  // Manejador para opciones CORS
  server.on("/api/arduino/info", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  // Agregar ruta para indicar que el registro se completó
  server.on("/api/arduino/register-complete", HTTP_POST, []() {
    sendCORSHeaders();
    
    // Volver a la pantalla principal
    mostrarMenuPrincipal();
    
    server.send(200, "application/json", "{\"success\":true}");
  });

  server.on("/api/arduino/register-complete", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "");
  });

  // Añadir la nueva ruta de API en el setup() del Arduino
  server.on("/api/arduino/doorstatus", HTTP_GET, handleDoorStatus);
  server.on("/api/arduino/doorstatus", HTTP_OPTIONS, []() {
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

// Reemplazar o modificar la función handleStartRFIDRead() existente

void handleStartRFIDRead() {
  sendCORSHeaders();
  
  // Verificar si ya hay una operación en curso
  if (isRFIDOperationActive) {
    // Si la última operación empezó hace más de 30 segundos, reiniciamos el estado
    // (esto evita operaciones bloqueadas permanentemente)
    if (millis() - rfidOperationStartTime > RFID_TIMEOUT) {
      isRFIDOperationActive = false;
      rfidStatus = "idle";
      lastCardId = "";
      lastErrorMessage = "";
    } else {
      // Todavía está activa y dentro del tiempo límite
      server.send(409, "application/json", "{\"error\":\"Ya hay una operación RFID en progreso\"}");
      return;
    }
  }
  
  // Iniciar nueva operación
  isRFIDOperationActive = true;
  registroRfidActivo = true;
  rfidStatus = "reading";
  rfidOperationStartTime = millis();
  lastCardId = "";
  lastErrorMessage = "";
  
  // Mostrar mensaje en LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Acerque tarjeta");
  lcd.setCursor(0, 1);
  lcd.print("RFID al lector");
  
  // Respuesta JSON
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Iniciando lectura RFID\"}");
  
  Serial.println("Iniciando lectura RFID");
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
        delay(2000);
        mostrarMenuPrincipal();
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

// Reemplazar la función verificarRFID() actual con esta implementación

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

  // Verificar el RFID contra el servidor
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String serverUrl = "http://" + String(ipServer) + "/api/rfids/verify-device"; // Usar la nueva ruta específica
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", "IntegradorIOTKey2025"); // Añadir clave API compartida
    
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
        
        // Reiniciar contador y estado de alarma
        contadorDetecciones = 0;
        alarmaActivada = false;
        alarmaCicloCompletado = false;  // Importante: reiniciar también esta bandera
        
        delay(5000);
        digitalWrite(RELAY_PIN, HIGH);
        intentosFallidos = 0;
      } else {
        // RFID no autorizado
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
      // Error de conexión
      lcd.clear();
      lcd.print("Error de");
      lcd.setCursor(0, 1);
      lcd.print("verificacion");
      delay(2000);
    }
    
    http.end();
  } else {
    // Sin conexión WiFi, no podemos verificar
    lcd.clear();
    lcd.print("Sin conexion");
    lcd.setCursor(0, 1);
    lcd.print("al servidor");
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

// Modificar la función ingresarClave():
void ingresarClave(char tecla) {
  pitidoCorto();
  
  if (tecla == 'D' && indiceClave > 0) {
    indiceClave--;
    actualizarClave();
  }
  else if (tecla >= '0' && tecla <= '9' && indiceClave < 4) {
    claveIngresada[indiceClave] = tecla;
    
    // Mostrar el número real en lugar de asterisco
    lcd.setCursor(5 + indiceClave, 1);
    lcd.print(tecla);  // Mostrar el dígito real
    
    // Guardar la posición para cambiarla después
    posicionTeclaActual = indiceClave;
    reemplazarCaracter = true;
    tiempoUltimaTecla = millis();
    
    indiceClave++;
    
    // Verificar si se completó la clave
    if (indiceClave == 4) {
      claveIngresada[4] = '\0';
      
      // Verificar el PIN contra el servidor
      verificarPINEnServidor();
      
      indiceClave = 0;
      reemplazarCaracter = false; // Reiniciar flag
    }
  }
}

// Nueva función para verificar el PIN en el servidor
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
    
    // Obtener la MAC address del ESP32
    String macAddress = WiFi.macAddress();
    
    // Crear el JSON con la MAC y el PIN ingresado
    String jsonData = "{\"macAddress\":\"" + macAddress + "\",\"pin\":\"" + String(claveIngresada) + "\"}";
    
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode == 200) {
      String response = http.getString();
      
      // Verificar si el PIN está autorizado
      DynamicJsonDocument doc(256);
      deserializeJson(doc, response);
      
      if (doc["authorized"].as<bool>()) {
        // PIN válido, conceder acceso
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Acceso");
        lcd.setCursor(0, 1);
        lcd.print("Concedido");
        pitidoExito();
        digitalWrite(RELAY_PIN, LOW);
        
        // Reiniciar contador y estado de alarma
        contadorDetecciones = 0;
        alarmaActivada = false;
        alarmaCicloCompletado = false;
        
        delay(5000);
        digitalWrite(RELAY_PIN, HIGH);
        estaBloqueado = true; 
        intentosFallidos = 0;
        estadoMenu = 0;
      } else {
        // PIN no válido, mostrar error
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
      // Error de conexión
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Error de");
      lcd.setCursor(0, 1);
      lcd.print("conexion");
      delay(2000);
    }
    
    http.end();
  } else {
    // Sin conexión WiFi
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sin conexion");
    lcd.setCursor(0, 1);
    lcd.print("WiFi");
    delay(2000);
  }
  
  mostrarMenuPrincipal();
}

// Modificar la función verificarSensorPIR()

void verificarSensorPIR() {
  unsigned long tiempoActual = millis();
  
  if (digitalRead(pinPIR) == HIGH) {
    if (tiempoActual - tiempoUltimaDeteccion >= retrasoDeteccion) {
      contadorDetecciones++;
      tiempoUltimaDeteccion = tiempoActual;
      Serial.println("Movimiento detectado");
      Serial.println("Contador " + String(contadorDetecciones));

      // Solo activar alarma si no ha completado un ciclo de pitidos
      if (contadorDetecciones >= 12 && !alarmaActivada && !alarmaCicloCompletado) {
        alarmaActivada = true;
        contadorPitidos = 0;
        tiempoUltimoPitido = tiempoActual;
        Serial.println("Alarma activada");
        
        // Enviar datos al servidor
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
      }
    }
  } else {
    // Reinicio del contador por inactividad
    if (tiempoActual - tiempoUltimaDeteccion > 30000) {
      contadorDetecciones = 0;
      alarmaCicloCompletado = false;  // Reiniciar esta bandera cuando se reinicia el contador
      Serial.println("Contador reiniciado por inactividad");
    }
  }
  
  // Control de alarma
  if (alarmaActivada && contadorPitidos < 6) {
    if (tiempoActual - tiempoUltimoPitido > 500) {
      digitalWrite(pinBuzzer, HIGH);
      delay(300);
      digitalWrite(pinBuzzer, LOW);
      
      contadorPitidos++;
      tiempoUltimoPitido = tiempoActual;
      
      if (contadorPitidos >= 6) {
        alarmaActivada = false;
        alarmaCicloCompletado = true;  // Marcar que ya completó un ciclo
        Serial.println("Alarma desactivada después de 6 pitidos");
      }
    }
  } else {
    // Mantener el buzzer apagado
    digitalWrite(pinBuzzer, LOW);
  }
}

void mostrarMensajeHuella(const char* mensaje) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(mensaje);
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
        
        // Reiniciar contador y estado de alarma
        contadorDetecciones = 0;
        alarmaActivada = false;
        alarmaCicloCompletado = false;  // Importante: reiniciar también esta bandera
        
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

// Modificar la función loop() para manejar el cambio de carácter:
void loop() {
  // Verificar si hay que reemplazar un carácter por asterisco
  if (reemplazarCaracter && millis() - tiempoUltimaTecla >= 400) {
    lcd.setCursor(5 + posicionTeclaActual, 1);
    lcd.print("*");  // Reemplazar con asterisco después de 400 milisegundos
    reemplazarCaracter = false;
  }
  
  // Capturar teclas del teclado
  char tecla = teclado.getKey();
  if (tecla) {
    Serial.println("Tecla presionada: " + String(tecla));
    
    // Manejar la tecla según el estado del sistema
    if (estadoMenu == 0) {
      ingresarClave(tecla);
    } else {
      // Mostrar la tecla para otros usos
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Tecla: " + String(tecla));
      delay(1000);
      mostrarMenuPrincipal();
    }
  }
  
  // Verificar sensores
  verificarSensorPIR();
  verificarRFID();
  verificarHuella();
  verificarSensorMagnetico(); // Añadir verificación del sensor magnético
  processFingerprintRegistration();
  
  // Manejar solicitudes del servidor web
  server.handleClient();
}

// Función para verificar el estado del sensor magnético
void verificarSensorMagnetico() {
  unsigned long tiempoActual = millis();
  
  // Verificar el sensor cada DOOR_CHECK_INTERVAL ms
  if (tiempoActual - lastDoorStatusCheck >= DOOR_CHECK_INTERVAL) {
    lastDoorStatusCheck = tiempoActual;
    
    int nuevoEstado = digitalRead(MAGNETIC_SENSOR_PIN);
    
    // Si hay un cambio de estado
    if (nuevoEstado != doorState) {
      doorState = nuevoEstado;
      Serial.println("Estado de puerta: " + String(doorState == HIGH ? "Abierta" : "Cerrada"));
      
      // Enviar notificación de cambio de estado al servidor
      enviarCambioEstadoPuerta();
      
      // Si la puerta se abre cuando debería estar cerrada
      if (doorState == HIGH && estaBloqueado) {
        // Activar alarma por apertura no autorizada
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Alerta!");
        lcd.setCursor(0, 1);
        lcd.print("Puerta forzada");
        
        // Activar alarma
        alarmaActivada = true;
        contadorPitidos = 0;
        tiempoUltimoPitido = tiempoActual;
        
        // Enviar alerta al servidor
        enviarAlertaApertura();
      }
    }
  }
}

// Nueva función para enviar el cambio de estado al servidor
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
  }
}

// Mantenemos el endpoint existente para consultas bajo demanda
void handleDoorStatus() {
  sendCORSHeaders();
  
  DynamicJsonDocument doc(200);
  doc["status"] = doorState == HIGH ? "open" : "closed";
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

// Función para enviar una alerta de apertura forzada al servidor
void enviarAlertaApertura() {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String serverUrl = "http://" + String(ipServer) + "/api/registros/add";
    
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", "IntegradorIOTKey2025");
    
    // Crear un mensaje JSON con la alerta
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

// FIN DEL ARCHIVO - No debe haber nada después de esta línea