const express = require('express');
const router = express.Router();
const Rfid = require('../models/Rfid');
const { protect: auth } = require('../middlewares/authMiddleware');
import { Request, Response } from 'express';

// Interfaz para request con autenticación
interface AuthRequest extends Request {
    user?: {
        id: string;
        [key: string]: any; // Para cualquier otra propiedad que pueda tener user
    };
}

// Registrar un nuevo RFID
router.post('/register', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { rfid, rfidValue, userId, userName } = req.body;

        // Usar rfid o rfidValue (el que esté proporcionado)
        const rfidToSave = rfid || rfidValue;

        if (!rfidToSave) {
            return res.status(400).json({
                success: false,
                message: 'Valor RFID requerido'
            });
        }

        // Verificar si el RFID ya existe
        const existingRfid = await Rfid.findOne({ rfidValue: rfidToSave });
        if (existingRfid) {
            return res.status(400).json({
                success: false,
                message: 'Este RFID ya está registrado'
            });
        }

        // Usar el ID del usuario del token si no se proporciona
        const userIdToUse = userId || req.user?.id;

        // Crear nuevo registro de RFID
        const rfidRecord = new Rfid({
            rfidValue: rfidToSave,
            userId: userIdToUse,
            userName
        });

        await rfidRecord.save();

        res.status(201).json({
            success: true,
            message: 'RFID registrado correctamente',
            rfid: rfidRecord
        });
    } catch (error) {
        console.error('Error al registrar RFID:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar RFID'
        });
    }
});

// Verificar un RFID
router.post('/verify', async (req: Request, res: Response) => {
    try {
        const { rfid } = req.body;

        // Buscar el RFID en la base de datos
        const rfidFound = await Rfid.findOne({ rfidValue: rfid });

        if (rfidFound) {
            res.json({
                authorized: true,
                userName: rfidFound.userName
            });
        } else {
            res.json({
                authorized: false
            });
        }
    } catch (error) {
        console.error('Error al verificar RFID:', error);
        res.status(500).json({
            error: 'Error al verificar RFID'
        });
    }
});

// Verificar si un RFID ya existe
router.post('/check', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { rfid } = req.body;

        // Buscar el RFID en la base de datos
        const existingRfid = await Rfid.findOne({ rfidValue: rfid });

        res.json({
            exists: !!existingRfid,
            rfid: existingRfid
        });
    } catch (error) {
        console.error('Error al verificar RFID:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar RFID'
        });
    }
});

// Obtener todos los RFIDs
router.get('/', auth, async (req: AuthRequest, res: Response) => {
    try {
        const rfids = await Rfid.find();
        res.json({ rfids });
    } catch (error) {
        console.error('Error al obtener RFIDs:', error);
        res.status(500).json({ message: 'Error al obtener RFIDs' });
    }
});

// Eliminar un RFID
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
    try {
        const rfid = await Rfid.findByIdAndDelete(req.params.id);

        if (!rfid) {
            return res.status(404).json({ message: 'RFID no encontrado' });
        }

        res.json({ message: 'RFID eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar RFID:', error);
        res.status(500).json({ message: 'Error al eliminar RFID' });
    }
});

module.exports = router;