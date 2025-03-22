import { Request, Response, NextFunction } from 'express';
import PreguntasFrecuentes from '../models/preguntasFrecuentesModel';

// Enfoque 1: Usar tipos explícitos y evitar retornar el objeto response
export const getAllFAQs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const faqs = await PreguntasFrecuentes.find();
        res.status(200).json(faqs);
    } catch (error: any) {
        console.error('Error al obtener FAQs:', error);
        res.status(500).json({ message: 'Error al obtener las preguntas frecuentes', error: error.message });
    }
};

export const createFAQ = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { pregunta, respuesta } = req.body;

        if (!pregunta || !respuesta) {
            res.status(400).json({ message: 'La pregunta y la respuesta son obligatorias' });
            return; // Return sin devolver nada
        }

        const newFAQ = new PreguntasFrecuentes({
            pregunta,
            respuesta
        });

        await newFAQ.save();
        res.status(201).json({ message: 'Pregunta frecuente creada exitosamente', faq: newFAQ });
    } catch (error: any) {
        console.error('Error al crear FAQ:', error);
        res.status(500).json({ message: 'Error al crear la pregunta frecuente', error: error.message });
    }
};