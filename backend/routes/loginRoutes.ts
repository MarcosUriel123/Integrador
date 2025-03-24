import express, { Router, RequestHandler } from 'express';
import { loginUser } from '../controllers/loginController';

const router: Router = express.Router();

// Ruta para iniciar sesión
router.post('/login', loginUser as RequestHandler);

export default router;