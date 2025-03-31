import { Request, Response } from 'express';
import Registro from '../models/registroModel';

export const getRegistros = async (req: Request, res: Response) => {
    try {
        const registros = await Registro.find({}).sort({ fecha: -1 });
        console.log(`Recuperados ${registros.length} registros`);

        // Verificar que los campos de método de acceso están presentes
        registros.forEach((reg, idx) => {
            if (idx < 5) { // Solo mostrar los primeros 5 para no saturar la consola
                console.log(`Registro #${idx + 1}: método=${reg.metodoAcceso}, valor=${reg.valorMetodo}`);
            }
        });

        res.status(200).json(registros);
    } catch (error) {
        console.error("Error al obtener registros:", error);
        res.status(500).json({ message: 'Error al obtener los registros', error });
    }
};

export const addRegistro = async (req: Request, res: Response) => {
    try {
        const { mensaje, descripcion, metodoAcceso, valorMetodo } = req.body;
        console.log("=== NUEVO REGISTRO ===");
        console.log("Mensaje:", mensaje);
        console.log("Descripción:", descripcion);
        console.log("Método de acceso:", metodoAcceso);
        console.log("Valor del método:", valorMetodo);

        const newRegistro = new Registro({
            mensaje,
            descripcion,
            metodoAcceso: metodoAcceso || 'desconocido',
            valorMetodo: valorMetodo || ''
        });

        await newRegistro.save();
        console.log("Registro guardado correctamente con ID:", newRegistro._id);

        res.status(201).json(newRegistro);
    } catch (error) {
        console.error("Error al agregar registro:", error);
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