import express from 'express';
import { registerSubUser, getSubUsers, deleteSubUser } from '../controllers/subUserController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas para gestionar subusuarios
router.post('/register', registerSubUser as express.RequestHandler);
router.get('/', getSubUsers as express.RequestHandler);
router.delete('/:id', deleteSubUser as express.RequestHandler);

export default router;