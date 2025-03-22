import { Request, Response } from 'express';
import SecretQuestion from '../models/SecretQuestion';

export const getSecretQuestions = async (_req: Request, res: Response) => {
    try {
        const questions = await SecretQuestion.find().sort({ _id: 1 });
        res.status(200).json(questions);
    } catch (error: any) {
        console.error('Error al obtener preguntas secretas:', error);
        res.status(500).json({
            message: 'Error al obtener preguntas secretas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};