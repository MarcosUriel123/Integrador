import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Device from '../models/Device';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { blacklistToken } from '../ProyectoIOT/utils/tokenBlacklist'; // Ajusta esta ruta según tu estructura

// Función para generar el token JWT
const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your_default_secret', {
        expiresIn: '1d',
    });
};

// Función de login
export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validación básica
        if (!email || !password) {
            res.status(400).json({ error: "Email y contraseña son requeridos" });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ error: "Credenciales incorrectas" });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: "Credenciales incorrectas" });
            return;
        }

        // Verificar si el usuario tiene dispositivos asociados
        // Usar el campo correcto según tu modelo de datos (user o userId)
        const userDevice = await Device.findOne({ user: user._id });
        const hasDevice = !!userDevice;

        console.log(`Usuario ${user.email} tiene dispositivo: ${hasDevice}`);

        // Generar token JWT con el ID del usuario
        const token = generateToken(user._id.toString());

        // Crear objeto de respuesta sin incluir datos sensibles
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            // Otros campos no sensibles que quieras incluir
        };

        // Enviar respuesta
        res.status(200).json({
            user: userResponse,
            id: user._id.toString(),  // Añadir ID en nivel superior como string
            userId: user._id.toString(), // Otra forma común de accederlo
            token,
            hasDevice,
            message: "Inicio de sesión exitoso"
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// Función de logout
export const logoutUser = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
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

// Función para verificar si un usuario tiene dispositivos
export const checkUserDevice = async (req: Request, res: Response): Promise<void> => {
    try {
        // Obtener el ID del usuario del token
        const userId = req.user?.id || '';

        if (!userId) {
            res.status(401).json({ error: "Usuario no autenticado" });
            return;
        }

        // Verificar si hay dispositivos asociados a este usuario
        const userDevice = await Device.findOne({ user: userId });
        const hasDevice = !!userDevice;

        res.status(200).json({
            hasDevice,
            deviceInfo: hasDevice ? {
                id: userDevice?._id,
                name: userDevice?.name,
            } : null
        });
        return;
    } catch (error) {
        console.error("Error al verificar dispositivos:", error);
        res.status(500).json({ error: "Error en el servidor" });
        return;
    }
};