import express, { Router, RequestHandler } from 'express';
import { sendPurchaseEmail } from '../controllers/purchaseController';

const router: Router = express.Router();

router.post('/send-purchase-email', sendPurchaseEmail as RequestHandler);

export default router;