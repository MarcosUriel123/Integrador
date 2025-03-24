import express, { Router } from 'express';
import { loginUser, logoutUser, checkUserDevice } from '../controllers/loginController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Rutas de autenticación
router.post('/login', (req, res, next) => loginUser(req, res, next));
router.post('/logout', (req, res) => logoutUser(req, res));

// Ruta para verificar dispositivo (protegida con middleware de autenticación)
// Envolvemos el controlador en una función anónima que no retorna nada
router.get('/check-device', authMiddleware, (req, res) => {
    checkUserDevice(req, res);
});

export default router;