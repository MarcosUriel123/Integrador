import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { blacklistToken } from '../ProyectoIOT/utils/tokenBlacklist';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your_default_secret', {
        expiresIn: '1h',
    });
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const token = generateToken(user._id.toString());

        const userResponse: { password?: string } = user.toObject();
        delete userResponse.password;

        return res.status(200).json({
            ...userResponse,
            token,
            name: user.name, // Devuelve el nombre del usuario
        });
    } catch (error) {
        next(error);
    }
};

export const logoutUser = async (req: Request, res: Response) => {
    try {
        // Obtener el token del encabezado
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            // Añadir token a la lista negra
            blacklistToken(token);
            res.status(200).json({ message: 'Sesión cerrada correctamente' });
        } else {
            res.status(400).json({ message: 'No se proporcionó token' });
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ message: 'Error al cerrar sesión' });
    }
};