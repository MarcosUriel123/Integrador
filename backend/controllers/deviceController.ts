/// <reference path="../ProyectoIOT/src/express/index.d.ts" />

import { Request, Response } from 'express';
import Device from '../models/Device';

/**
 * Registrar un nuevo dispositivo IoT asociado al usuario autenticado
 */
export const registerDevice = async (req: Request, res: Response) => {
    try {
        const { macAddress, name, location } = req.body;

        // Validación más explícita
        if (!macAddress || !name || !location) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        // Verificar si el dispositivo ya existe
        const deviceExists = await Device.findOne({ macAddress });
        if (deviceExists) {
            return res.status(400).json({ message: 'Este dispositivo ya está registrado' });
        }

        // Asegúrate de que req.user exista y tenga _id
        if (!req.user || !req.user._id) {
            console.error('Usuario no disponible en el request:', req.user);
            return res.status(401).json({ message: 'Usuario no identificado' });
        }

        // Imprime información para depurar
        console.log('Datos para crear dispositivo:', {
            userId: req.user._id,
            macAddress,
            name,
            location
        });

        // Crear el nuevo dispositivo con manejo explícito de errores
        const device = await Device.create({
            userId: req.user._id,
            macAddress,
            name,
            location
        });

        console.log('Dispositivo creado:', device);

        // Responder con éxito
        res.status(201).json({
            message: 'Dispositivo registrado exitosamente',
            device
        });
    } catch (error: any) { // Usar any o Error para poder acceder a error.message
        // Mejorar el logging de errores
        console.error('Error al registrar dispositivo:', error);

        // Respuesta más detallada en desarrollo
        res.status(500).json({
            message: 'Error al registrar dispositivo',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener todos los dispositivos IoT
 */
export const getDevices = async (req: Request, res: Response): Promise<void> => {
    try {
        const devices = await Device.find().populate('user', 'email name'); // Ejemplo: muestra email y name del usuario asociado
        res.status(200).json(devices);
    } catch (error: any) { // También hay que corregir aquí
        res.status(500).json({ error: 'Error al obtener dispositivos', details: error.message });
    }
};