import express from 'express';
import { getSecretQuestions } from '../controllers/secretQuestionController';

const router = express.Router();

router.get('/', getSecretQuestions as express.RequestHandler);

export default router;