import express, { Request, Response } from 'express';
import { registerDevice, getDevices, getDevicePin } from '../controllers/deviceController';
import { protect } from '../middlewares/authMiddleware';
import Device from '../models/Device';
import User from '../models/User';

// Define la interfaz para peticiones autenticadas
interface AuthRequest extends Request {
    user?: {
        id: string;
        [key: string]: any;
    };
}

const router = express.Router();

// Rutas que requieren autenticación
router.post('/register', protect, registerDevice as express.RequestHandler);
router.get('/', protect, getDevices as express.RequestHandler);

// Ruta pública para que el ESP32 pueda obtener el PIN
router.post('/get-pin', getDevicePin as express.RequestHandler);

// Ruta para obtener información del dispositivo del usuario
router.get('/info', protect, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            return;
        }

        // Buscar el dispositivo asociado al usuario
        const device = await Device.findOne({ userId });

        if (!device) {
            res.status(404).json({ success: false, message: 'No se encontró dispositivo para este usuario' });
            return;
        }

        res.json(device);
    } catch (error) {
        console.error('Error obteniendo info del dispositivo:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Ruta para actualizar el PIN del dispositivo
router.post('/update-pin', protect, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const { devicePin } = req.body;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            return;
        }

        // Validar el PIN
        if (!devicePin || devicePin.length !== 4 || !/^\d+$/.test(devicePin)) {
            res.status(400).json({ success: false, message: 'El PIN debe tener exactamente 4 dígitos' });
            return;
        }

        // Actualizar el PIN en el documento del usuario
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { devicePin },
            { new: true }
        );

        if (!updatedUser) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }

        res.json({ success: true, message: 'PIN actualizado correctamente' });
    } catch (error) {
        console.error('Error actualizando PIN:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

export default router;