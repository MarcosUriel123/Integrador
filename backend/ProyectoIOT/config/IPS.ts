// Server configuration
export const SERVER = {
    PORT: process.env.PORT || 8082,
    LOCAL_IP: process.env.LOCAL_IP || '192.168.1.68',
    get URL() {
        return `http://${this.LOCAL_IP}:${this.PORT}`;
    }
};

// ESP32 configuration
export const ESP32 = {
    IP: process.env.ESP32_IP || '192.168.1.77',
    PORT: process.env.ESP32_PORT || 80,
    get URL() {
        return `http://${this.IP}:${this.PORT}`;
    }
};

// API endpoint base URLs
export const API = {
    BASE_URL: '/api',
    FINGERPRINT_URL: '/api/fingerprints',
    PASSWORD_URL: '/api/passwords',
    USER_URL: '/api/users',
    DOOR_URL: '/api/door',
    HUELLA_URL: '/api/huella',
    PRODUCT_URL: '/api/products',
    EMPRESA_URL: '/api',
    DEVICE_URL: '/api/devices',
    REGISTRO_URL: '/api/registros',
    LOGIN_URL: '/api/users',
    SECRET_QUESTION_URL: '/api/secretQuestions',
    SUBUSER_URL: '/api/subusers',
    PREGUNTAS_FRECUENTES_URL: '/api/preguntasFrecuentes',
    RFID_URL: '/api/rfids',
    PURCHASE_URL: '/api/purchase',
    PIN_URL: '/api/pins'
};

// Exportación por defecto con todas las configuraciones
const IPS = {
    SERVER_URL: SERVER.URL,
    ESP32_URL: ESP32.URL,
    API
};

export default IPS;