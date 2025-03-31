import { Request, Response } from 'express';
import Registro from '../models/registroModel';

export const getRegistros = async (req: Request, res: Response) => {
    try {
        const registros = await Registro.find({}).sort({ fecha: -1 });
        res.status(200).json(registros);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los registros', error });
    }
};

export const addRegistro = async (req: Request, res: Response) => {
    try {
        const { mensaje, descripcion } = req.body;
        const newRegistro = new Registro({ mensaje, descripcion });
        await newRegistro.save();
        res.status(201).json(newRegistro);
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar el registro', error });
    }
};

export const deleteAllRegistros = async (req: Request, res: Response) => {
    try {
        await Registro.deleteMany({});
        res.status(200).json({ message: 'Todos los registros han sido eliminados' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar los registros', error });
    }
};