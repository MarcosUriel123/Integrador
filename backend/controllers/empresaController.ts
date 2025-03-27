import { Request, Response } from 'express';
import { Empresa, Pregunta, Mision, Vision, Valor, Politica } from '../models/empresaModel';

// Obtener datos de la empresa
export const getEmpresa = async (req: Request, res: Response) => {
    try {
        const empresa = await Empresa.findOne();
        res.json(empresa || {});
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo datos de empresa' });
    }
};

// Obtener preguntas
export const getPreguntas = async (req: Request, res: Response) => {
    try {
        const preguntas = await Pregunta.find();
        res.json(preguntas);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo preguntas' });
    }
};

// Obtener misiones
export const getMisiones = async (req: Request, res: Response) => {
    try {
        const misiones = await Mision.find();
        res.json(misiones);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo misiones' });
    }
};

// Obtener visiones
export const getVisiones = async (req: Request, res: Response) => {
    try {
        const visiones = await Vision.find();
        res.json(visiones);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo visiones' });
    }
};

// Obtener valores
export const getValores = async (req: Request, res: Response) => {
    try {
        const valores = await Valor.find();
        res.json(valores);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo valores' });
    }
};

// Obtener políticas
export const getPoliticas = async (req: Request, res: Response) => {
    try {
        const politicas = await Politica.find();
        res.json(politicas);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo políticas' });
    }
};


// Controlador para actualizar datos de la empresa
export const updateEmpresa = async (req: Request, res: Response) => {
    try {
        const { ubicacion, telefono } = req.body;

        const empresa = await Empresa.findOneAndUpdate(
            {},
            { ubicacion, telefono },
            { new: true, upsert: true }
        );

        res.status(200).json(empresa);
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando empresa', error });
    }
};

// Factory function para crear elementos
const createElementHandler = (Model: any) => async (req: Request, res: Response) => {
    try {
        const newElement = new Model(req.body);
        await newElement.save();
        res.status(201).json(newElement);
    } catch (error) {
        res.status(500).json({ message: `Error creando ${Model.modelName}`, error });
    }
};


export const addPregunta = createElementHandler(Pregunta);
export const addMision = createElementHandler(Mision);
export const addVision = createElementHandler(Vision);
export const addValor = createElementHandler(Valor);
export const addPolitica = createElementHandler(Politica);

