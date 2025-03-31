import express, { Router, RequestHandler } from 'express';
import { addRegistro, getRegistros, deleteAllRegistros } from '../controllers/registroController';

const router: Router = express.Router();
router.post('/add', addRegistro as RequestHandler);
router.get('/get', getRegistros as RequestHandler);
router.delete('/deleteAll', deleteAllRegistros as RequestHandler);

export default router;