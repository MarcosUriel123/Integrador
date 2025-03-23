import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';

// Tipado explícito para las funciones del controlador
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

export const updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updates,
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        next(error);
    }
};

// userController.ts
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

// userController.ts
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