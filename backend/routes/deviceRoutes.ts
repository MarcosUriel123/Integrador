import express from 'express';
import { registerDevice, getDevices, getDevicePin } from '../controllers/deviceController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Rutas que requieren autenticación
router.post('/register', protect, registerDevice as express.RequestHandler);
router.get('/', protect, getDevices as express.RequestHandler);

// Ruta pública para que el ESP32 pueda obtener el PIN
// No usamos el middleware protect aquí para permitir el acceso al ESP32
router.post('/get-pin', getDevicePin as express.RequestHandler);

export default router;