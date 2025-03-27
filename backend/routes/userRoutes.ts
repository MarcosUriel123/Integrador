import express, { Router, RequestHandler } from 'express';
import {
    registerUser,
    getUserById,
    updateUser,
    verifyRecovery,
    resetPassword,
    checkUserDevice
} from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';
import { loginUser, logoutUser } from '../controllers/loginController';

const router: Router = express.Router();

// Rutas de autenticación
router.post('/register', registerUser as RequestHandler);
router.post('/login', loginUser as RequestHandler);
router.post('/logout', protect as RequestHandler, logoutUser as RequestHandler);

// Ruta para verificar token
router.post('/verify-token', protect as RequestHandler, (req, res) => {
    res.status(200).json({
        valid: true,
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email
        }
    });
});

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas dinámicas (con parámetros)
// Esta ruta debe estar ANTES de router.get('/:id', ...)
router.get('/check-device', protect as RequestHandler, checkUserDevice as RequestHandler);

// Rutas con parámetros dinámicos deben ir AL FINAL
router.get('/:id', getUserById as RequestHandler);
router.put('/update/:id', updateUser as RequestHandler);
router.post('/verify-recovery', verifyRecovery as RequestHandler);
router.post('/reset-password', resetPassword as RequestHandler);

export default router;


