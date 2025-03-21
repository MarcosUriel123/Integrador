import { Request, Response } from 'express';
import SubUser from '../models/SubUser';

// Registrar un nuevo subusuario
export const registerSubUser = async (req: Request, res: Response) => {
    try {
        const { name, accessMethod, accessId } = req.body;

        // Validaciones
        if (!name || !accessMethod || !accessId) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        // Verificar que el método de acceso sea válido
        if (accessMethod !== 'fingerprint' && accessMethod !== 'rfid') {
            return res.status(400).json({ message: 'Método de acceso no válido. Use "fingerprint" o "rfid".' });
        }

        // Obtener el ID del usuario administrador desde el token
        const adminId = req.user?._id;
        if (!adminId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        // Verificar si ya existe un subusuario con el mismo método de acceso e ID
        const existingSubUser = await SubUser.findOne({
            adminId,
            accessMethod,
            accessId
        });

        if (existingSubUser) {
            return res.status(400).json({
                message: `Ya existe un usuario con este ID de ${accessMethod === 'fingerprint' ? 'huella' : 'RFID'}.`
            });
        }

        // Crear el nuevo subusuario
        const subUser = await SubUser.create({
            adminId,
            name,
            accessMethod,
            accessId,
            isActive: true
        });

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            subUser
        });
    } catch (error: any) {
        console.error('Error al registrar subusuario:', error);
        res.status(500).json({
            message: 'Error al registrar usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener todos los subusuarios del administrador
export const getSubUsers = async (req: Request, res: Response) => {
    try {
        const adminId = req.user?._id;

        if (!adminId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const subUsers = await SubUser.find({ adminId });
        res.status(200).json({ subUsers });
    } catch (error: any) {
        console.error('Error al obtener subusuarios:', error);
        res.status(500).json({
            message: 'Error al obtener usuarios',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar un subusuario
export const deleteSubUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user?._id;

        if (!adminId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        // Verificar que el subusuario exista y pertenezca al administrador
        const subUser = await SubUser.findOne({ _id: id, adminId });

        if (!subUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        await SubUser.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al eliminar subusuario:', error);
        res.status(500).json({
            message: 'Error al eliminar usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};