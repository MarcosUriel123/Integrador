// Ruta: Integrador/backend/controllers/deviceController.ts

/// <reference path="../ProyectoIOT/src/express/index.d.ts" />

import { Request, Response } from 'express';
import Device from '../models/Device';
import User from '../models/User'; // Importamos el modelo de Usuario

/**
 * Registrar un nuevo dispositivo IoT asociado al usuario autenticado
 */
export const registerDevice = async (req: Request, res: Response) => {
    try {
        const { macAddress, name, devicePin } = req.body;

        // Validación para campos requeridos
        if (!macAddress || !name) {
            return res.status(400).json({ message: 'La dirección MAC y el nombre son requeridos' });
        }

        // Validación para el PIN
        if (!devicePin || devicePin.length !== 4 || !/^\d{4}$/.test(devicePin)) {
            return res.status(400).json({ message: 'El PIN debe ser de exactamente 4 dígitos' });
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
            devicePin // No guardaremos el PIN en el dispositivo, solo el usuario
        });

        // Crear el nuevo dispositivo
        const device = await Device.create({
            userId: req.user._id,
            macAddress,
            name
        });

        console.log('Dispositivo creado:', device);

        // Actualizar el PIN en el documento del usuario
        await User.findByIdAndUpdate(req.user._id, { devicePin });
        console.log(`PIN actualizado para el usuario ${req.user._id}`);

        // Responder con éxito
        res.status(201).json({
            message: 'Dispositivo registrado exitosamente y PIN configurado',
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
    } catch (error: any) {
        res.status(500).json({ error: 'Error al obtener dispositivos', details: error.message });
    }
};

/**
 * Obtener el PIN asociado a un dispositivo (para el ESP32)
 */
export const getDevicePin = async (req: Request, res: Response) => {
    try {
        const { macAddress } = req.body;

        if (!macAddress) {
            return res.status(400).json({ message: 'Se requiere la dirección MAC' });
        }

        // Buscar el dispositivo por su MAC
        const device = await Device.findOne({ macAddress });

        if (!device) {
            return res.status(404).json({ message: 'Dispositivo no encontrado' });
        }

        // Buscar al usuario propietario del dispositivo
        const user = await User.findById(device.userId);

        if (!user || !user.devicePin) {
            return res.status(404).json({ message: 'PIN no configurado para este dispositivo' });
        }

        // Devolver el PIN
        res.status(200).json({
            message: 'PIN obtenido correctamente',
            devicePin: user.devicePin
        });
    } catch (error: any) {
        console.error('Error al obtener PIN:', error);
        res.status(500).json({
            message: 'Error al obtener PIN',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};