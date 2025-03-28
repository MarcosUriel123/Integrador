// Ruta: Integrador/backend/routes/productRoutes.ts
import express, { Router, RequestHandler } from 'express';
import { addProduct, getProducts } from '../controllers/productController';

const router: Router = express.Router();

router.post('/add', addProduct as RequestHandler);
router.get('/get', getProducts as RequestHandler);

export default router;