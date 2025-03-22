import express, { Router, RequestHandler } from 'express';
import {
    registerUser,
    getUserById,
    updateUser,
    verifyRecovery,
    resetPassword,
    verifyDevicePin // Añadir este import
} from '../controllers/userController';

const router: Router = express.Router();

// Rutas actualizadas con casting explícito para resolver el problema de tipos
router.post('/register', registerUser as RequestHandler);
router.get('/:id', getUserById as RequestHandler);
router.put('/update/:id', updateUser as RequestHandler);
router.post('/verify-recovery', verifyRecovery as RequestHandler);
router.post('/reset-password', resetPassword as RequestHandler);
// Nueva ruta para verificar el PIN
router.post('/verify-pin', verifyDevicePin as RequestHandler);

export default router;