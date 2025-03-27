import { Request, Response } from 'express';
import { Empresa, Pregunta, Mision, Vision, Valor, Politica } from '../models/empresaModel';

// Controlador para actualizar todos los datos de la empresa
export const updateEmpresaData = async (req: Request, res: Response) => {
    try {
        const {
            ubicacion,
            telefono,
            mision,
            vision,
            valores,
            politicas
        } = req.body;

        const empresa = await Empresa.findOneAndUpdate(
            {},
            { ubicacion, telefono },
            { new: true, upsert: true }
        );

        await Mision.findOneAndUpdate({}, { contenido: mision }, { new: true });
        await Vision.findOneAndUpdate({}, { contenido: vision }, { new: true });
        await Valor.findOneAndUpdate({}, { contenido: valores }, { new: true });
        await Politica.findOneAndUpdate({}, { contenido: politicas }, { new: true });

        res.status(200).json({ message: 'Datos de la empresa actualizados correctamente', empresa });
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando los datos de la empresa', error });
    }
};

// Controlador para agregar una pregunta
export const addPregunta = async (req: Request, res: Response) => {
    try {
        const { pregunta, respuesta } = req.body;
        const nuevaPregunta = new Pregunta({ pregunta, respuesta });
        await nuevaPregunta.save();
        res.status(201).json(nuevaPregunta);
    } catch (error) {
        res.status(500).json({ message: 'Error agregando la pregunta', error });
    }
};

// Controlador para agregar una misión
export const addMision = async (req: Request, res: Response) => {
    try {
        const { contenido } = req.body;
        const nuevaMision = new Mision({ contenido });
        await nuevaMision.save();
        res.status(201).json(nuevaMision);
    } catch (error) {
        res.status(500).json({ message: 'Error agregando la misión', error });
    }
};

// Controlador para agregar una visión
export const addVision = async (req: Request, res: Response) => {
    try {
        const { contenido } = req.body;
        const nuevaVision = new Vision({ contenido });
        await nuevaVision.save();
        res.status(201).json(nuevaVision);
    } catch (error) {
        res.status(500).json({ message: 'Error agregando la visión', error });
    }
};

// Controlador para agregar un valor
export const addValor = async (req: Request, res: Response) => {
    try {
        const { contenido } = req.body;
        const nuevoValor = new Valor({ contenido });
        await nuevoValor.save();
        res.status(201).json(nuevoValor);
    } catch (error) {
        res.status(500).json({ message: 'Error agregando el valor', error });
    }
};

// Controlador para agregar una política
export const addPolitica = async (req: Request, res: Response) => {
    try {
        const { descripcion } = req.body;
        const nuevaPolitica = new Politica({ descripcion });
        await nuevaPolitica.save();
        res.status(201).json(nuevaPolitica);
    } catch (error) {
        res.status(500).json({ message: 'Error agregando la política', error });
    }
};

// Controlador para obtener los datos de la empresa
export const getEmpresa = async (req: Request, res: Response) => {
    try {
        const empresa = await Empresa.findOne({});
        res.status(200).json(empresa);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo los datos de la empresa', error });
    }
};

// Controlador para obtener las preguntas
export const getPreguntas = async (req: Request, res: Response) => {
    try {
        const preguntas = await Pregunta.find({});
        res.status(200).json(preguntas);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo las preguntas', error });
    }
};

// Controlador para obtener las misiones
export const getMisions = async (req: Request, res: Response) => {
    try {
        const misions = await Mision.find({});
        res.status(200).json(misions);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo las misiones', error });
    }
};

// Controlador para obtener las visiones
export const getVisions = async (req: Request, res: Response) => {
    try {
        const visions = await Vision.find({});
        res.status(200).json(visions);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo las visiones', error });
    }
};

// Controlador para obtener los valores
export const getValors = async (req: Request, res: Response) => {
    try {
        const valors = await Valor.find({});
        res.status(200).json(valors);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo los valores', error });
    }
};

// Controlador para obtener las políticas
export const getPoliticas = async (req: Request, res: Response) => {
    try {
        const politicas = await Politica.find({});
        res.status(200).json(politicas);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo las políticas', error });
    }
};