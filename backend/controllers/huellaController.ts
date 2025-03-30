import { Request, Response } from 'express';
import axios from 'axios';
import IPS from '../ProyectoIOT/config/IPS'; // Importamos la configuración centralizada

export const registrarHuella = async (req: Request, res: Response) => {
    try {
        // Usamos la URL del ESP32 desde la configuración centralizada
        const arduinoUrl = `${IPS.ESP32_URL}/registrar-huella`;

        // Enviar solicitud a Arduino
        const response = await axios.get(arduinoUrl);

        if (response.status === 200) {
            return res.status(200).json({ message: "Huella registrada con éxito" });
        } else {
            return res.status(500).json({ error: "Error en Arduino" });
        }
    } catch (error) {
        console.error("Error de conexión con Arduino:", error);
        return res.status(500).json({ error: "Error de conexión con Arduino" });
    }
};
