import express, { Request, Response, NextFunction } from 'express';
import Device from '../models/Device';
import User from '../models/User';

const router = express.Router();

// Middleware para verificar clave API del ESP32
const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey === 'IntegradorIOTKey2025') {
        next();
    } else {
        res.status(401).json({
            authorized: false,
            message: 'Acceso no autorizado'
        });
    }
};

// Endpoint para verificar PIN desde el ESP32
router.post('/verify', verifyApiKey, (req: Request, res: Response, next: NextFunction) => {
    (async () => {
        try {
            const { macAddress, pin } = req.body;

            if (!macAddress || !pin) {
                return res.status(400).json({
                    authorized: false,
                    message: 'Se requiere dirección MAC y PIN'
                });
            }

            // 1. Buscar el dispositivo por MAC
            const device = await Device.findOne({ macAddress });

            if (!device) {
                return res.json({
                    authorized: false,
                    message: 'Dispositivo no registrado'
                });
            }

            // 2. Buscar el usuario asociado al dispositivo
            const user = await User.findById(device.userId);

            if (!user) {
                return res.json({
                    authorized: false,
                    message: 'Usuario no encontrado'
                });
            }

            // 3. Verificar si el PIN coincide
            if (user.devicePin === pin) {
                return res.json({
                    authorized: true,
                    userName: `${user.name} ${user.lastName}`
                });
            } else {
                return res.json({
                    authorized: false,
                    message: 'PIN incorrecto'
                });
            }
        } catch (error) {
            console.error('Error al verificar PIN:', error);
            return res.status(500).json({
                authorized: false,
                message: 'Error del servidor al verificar PIN'
            });
        }
    })().catch(next);
});

export default router;