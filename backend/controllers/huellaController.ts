import { Request, Response } from 'express';
import axios from 'axios';

export const registrarHuella = async (req: Request, res: Response) => {
    try {
        const arduinoUrl = "http://192.168.8.8/registrar-huella"; // IP del ESP32

        // Enviar solicitud a Arduino
        const response = await axios.get(arduinoUrl);

        if (response.status === 200) {
            return res.status(200).json({ message: "Huella registrada con éxito" });
        } else {
            return res.status(500).json({ error: "Error en Arduino" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Error de conexión con Arduino" });
    }
};
