// filepath: c:\Users\delfi\Documents\GitHub\Integrador\backend\routes\newPurchaseRoutes.ts
import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import { checkout, sendPurchaseEmail } from '../controllers/purchaseController';

const router = express.Router();

// Ruta para procesar compra (requiere autenticación) - DESACTIVADA TEMPORALMENTE
// router.post('/checkout', protect, checkout);

// Ruta para enviar correo de confirmación - SIN PROTECCIÓN TEMPORAL
router.post('/send-email', sendPurchaseEmail);

export default router;