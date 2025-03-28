import express from 'express';
import axios from 'axios';

const router = express.Router();
const ESP32_IP = "http://192.168.8.4"; // Cambia por la IP real de tu ESP32

// Ruta para registrar huella
router.get('/registrar', async (req, res) => {
    try {
        // Agregamos los headers CORS explícitamente
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        // Realizamos la petición al ESP32
        const response = await axios.get(`${ESP32_IP}/registrarHuella`);

        // Enviamos la respuesta al cliente
        res.send(response.data);
    } catch (error) {
        console.error("Error al registrar huella:", error);
        res.status(500).send('Error al registrar huella');
    }
});

export default router;