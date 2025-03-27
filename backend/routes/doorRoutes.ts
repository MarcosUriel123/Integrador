import express from 'express';
import axios from 'axios';

const router = express.Router();

const ESP32_IP = 'http://192.168.8.8';  // Cambia la IP de tu ESP32

// Ruta para abrir la puerta
router.get('/abrir', async (req, res) => {
    try {
        // Realiza una solicitud al ESP32 con la acción "abrir"
        const response = await axios.get(`${ESP32_IP}/controlPuerta?action=abrir`);
        res.send(response.data);  // Responde con el mensaje de la ESP32
    } catch (error) {
        console.error("Error al abrir la puerta:", error);
        res.status(500).send('Error al abrir la puerta');
    }
});

// Ruta para cerrar la puerta
router.get('/cerrar', async (req, res) => {
    try {
        // Realiza una solicitud al ESP32 con la acción "cerrar"
        const response = await axios.get(`${ESP32_IP}/controlPuerta?action=cerrar`);
        res.send(response.data);  // Responde con el mensaje de la ESP32
    } catch (error) {
        console.error("Error al cerrar la puerta:", error);
        res.status(500).send('Error al cerrar la puerta');
    }
});

export default router;
