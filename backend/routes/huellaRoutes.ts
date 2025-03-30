import express from 'express';
import axios from 'axios';
import IPS from '../ProyectoIOT/config/IPS'; // Importamos la configuración centralizada

const router = express.Router();

// Ruta para registrar huella
router.get('/registrar', async (req, res) => {
    try {
        // Agregamos los headers CORS explícitamente
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        // Realizamos la petición al ESP32 usando la configuración centralizada
        const response = await axios.get(`${IPS.ESP32_URL}/registrarHuella`);

        // Enviamos la respuesta al cliente
        res.send(response.data);
    } catch (error) {
        console.error("Error al registrar huella:", error);
        res.status(500).send('Error al registrar huella');
    }
});

export default router;