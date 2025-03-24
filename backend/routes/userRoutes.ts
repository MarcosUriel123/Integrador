import express, { Router, RequestHandler } from 'express';
import {
    registerUser,
    getUserById,
    updateUser,
    verifyRecovery,
    resetPassword
} from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware'; // Importar middleware de autenticación
import { loginUser, logoutUser } from '../controllers/loginController';

const router: Router = express.Router();

// Rutas actualizadas con casting explícito para resolver el problema de tipos
router.post('/register', registerUser as RequestHandler);
router.get('/:id', getUserById as RequestHandler);
router.put('/update/:id', updateUser as RequestHandler);
router.post('/verify-recovery', verifyRecovery as RequestHandler);
router.post('/reset-password', resetPassword as RequestHandler);

// Nueva ruta para verificar la validez del token
router.post('/verify-token', protect as RequestHandler, (req, res) => {
    // Si llega aquí, es porque el middleware protect ha verificado exitosamente el token
    // y ha añadido la información del usuario a req.user
    res.status(200).json({
        valid: true,
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email
            // No incluir información sensible
        }
    });
});

// Añadir esta ruta junto con las demás rutas existentes
// router.post('/logout', protect, logoutUser as express.RequestHandler);
export default router; 