import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { isTokenBlacklisted } from '../ProyectoIOT/utils/tokenBlacklist';

// Modificamos la interfaz para hacerla más flexible
declare global {
    namespace Express {
        // Hacemos la interfaz más general para evitar problemas de tipo
        interface Request {
            user?: any;
        }
    }
}

interface JwtPayload {
    id: string;
}

// Añadimos void como tipo de retorno explícito para satisfacer a TypeScript
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Verificar si hay token en los headers
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'No autorizado, token no proporcionado' });
            return; // En lugar de return res...
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');

            // Añadir información del usuario a la request
            req.user = await User.findById((decoded as any).id).select('-password');

            if (!req.user) {
                res.status(404).json({ message: 'Usuario no encontrado' });
                return; // En lugar de return res...
            }

            // Todo está bien, continuar
            next();

        } catch (error) {
            res.status(401).json({ message: 'No autorizado, token inválido' });
            return; // En lugar de return res...
        }
    } catch (error) {
        console.error('Error en el middleware de autenticación:', error);
        res.status(500).json({ message: 'Error del servidor' });
        return; // En lugar de return res...
    }
};

// Exportar también como protect para mantener compatibilidad
export const protect = authMiddleware;