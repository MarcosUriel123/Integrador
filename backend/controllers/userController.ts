import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';

// Función de registro sin cambios
export const registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            name, lastName, surname, phone, email, password,
            secretQuestion, secretAnswer  // Nuevos campos
        } = req.body;

        // Validar campos obligatorios
        if (!name || !lastName || !email || !password || !secretQuestion || !secretAnswer) {
            return res.status(400).json({ error: "Todos los campos son requeridos" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            lastName,
            surname,
            phone,
            email,
            password: hashedPassword,
            secretQuestion,
            secretAnswer
        });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

// Actualizada para validar el PIN del dispositivo
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, lastName, surname, phone, email, password, devicePin } = req.body;

        // Si se proporciona devicePin, inclúyelo en la actualización
        const updateData: any = {};
        if (devicePin) updateData.devicePin = devicePin;

        // Validar el PIN del dispositivo si está presente
        if (updateData.devicePin) {
            // Verificar que sea numérico y tenga entre 4-6 dígitos
            if (!/^\d{4,6}$/.test(updateData.devicePin)) {
                return res.status(400).json({
                    error: 'El PIN debe ser numérico y tener entre 4 y 6 dígitos'
                });
            }
        }

        // Cifrar contraseña si se está actualizando
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        // Manejo de errores
    }
};

// Nueva función para verificar el PIN del dispositivo
export const verifyDevicePin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId, devicePin } = req.body;

        // Validar campos obligatorios
        if (!userId || !devicePin) {
            return res.status(400).json({ error: 'Se requiere userId y devicePin' });
        }

        // Buscar al usuario
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar si el usuario tiene un PIN configurado
        if (!user.devicePin) {
            return res.status(400).json({ error: 'Este usuario no tiene un PIN configurado' });
        }

        // Verificar el PIN
        if (user.devicePin !== devicePin) {
            return res.status(401).json({ error: 'PIN incorrecto' });
        }

        // Si el PIN es correcto
        return res.status(200).json({ message: 'PIN verificado correctamente' });
    } catch (error) {
        next(error);
    }
};

// Funciones de recuperación de contraseña existentes
export const verifyRecovery = async (req: Request, res: Response) => {
    try {
        const { email, secretQuestion, secretAnswer } = req.body;

        // Validar campos obligatorios
        if (!email || !secretQuestion || !secretAnswer) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        // Buscar al usuario
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar la pregunta y respuesta
        if (user.secretQuestion !== secretQuestion || user.secretAnswer !== secretAnswer) {
            return res.status(401).json({ message: 'La pregunta secreta o respuesta no son correctas' });
        }

        // Si todo está correcto
        res.status(200).json({ message: 'Verificación exitosa' });
    } catch (error: any) {
        console.error('Error en la verificación de recuperación:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, secretQuestion, secretAnswer, newPassword } = req.body;

        // Validar campos obligatorios
        if (!email || !secretQuestion || !secretAnswer || !newPassword) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        // Buscar al usuario
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar la pregunta y respuesta
        if (user.secretQuestion !== secretQuestion || user.secretAnswer !== secretAnswer) {
            return res.status(401).json({ message: 'La pregunta secreta o respuesta no son correctas' });
        }

        // Actualizar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error: any) {
        console.error('Error al reiniciar la contraseña:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};