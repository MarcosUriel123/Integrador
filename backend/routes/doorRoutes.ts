import express from 'express';
import axios from 'axios';
import IPS from '../ProyectoIOT/config/IPS'; // Importamos la configuración centralizada

const router = express.Router();

// Eliminamos la variable hardcodeada ESP32_IP y usamos la configuración centralizada

// Ruta para abrir la puerta
router.get('/abrir', async (req, res) => {
    try {
        // Realiza una solicitud al ESP32 con la acción "abrir"
        const response = await axios.get(`${IPS.ESP32_URL}/controlPuerta?action=abrir`);
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
        const response = await axios.get(`${IPS.ESP32_URL}/controlPuerta?action=cerrar`);
        res.send(response.data);  // Responde con el mensaje de la ESP32
    } catch (error) {
        console.error("Error al cerrar la puerta:", error);
        res.status(500).send('Error al cerrar la puerta');
    }
});

export default router;
