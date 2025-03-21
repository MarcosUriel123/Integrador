import express from 'express';
import { registerDevice, getDevices } from '../controllers/deviceController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Protege todas las rutas con el middleware de autenticación
router.use(protect);

// Ruta para registrar un dispositivo
router.post('/register', registerDevice as express.RequestHandler);

// Ruta para obtener los dispositivos del usuario
router.get('/', getDevices as express.RequestHandler);

export default router;