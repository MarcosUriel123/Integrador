import express, { Router } from 'express';
import { getAllFAQs, createFAQ } from '../controllers/preguntasFrecuentesController';

const router: Router = express.Router();

router.get('/', getAllFAQs);
router.post('/', createFAQ);

export default router;
