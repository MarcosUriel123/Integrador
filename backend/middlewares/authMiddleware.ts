import { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
    interface Request {
        user?: any;
    }
}
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { isTokenBlacklisted } from '../ProyectoIOT/utils/tokenBlacklist';

interface JwtPayload {
    id: string;
}

// Middleware para proteger rutas
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener el token del header
            token = req.headers.authorization.split(' ')[1];

            // Verificar si el token está en la lista negra
            if (isTokenBlacklisted(token)) {
                res.status(401).json({ message: 'No autorizado, sesión cerrada' });
                return;
            }

            // IMPORTANTE: Usar exactamente el mismo secreto que en loginController.ts
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret') as JwtPayload;

            // Buscar el usuario y añadirlo a la request
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
                return;
            }

            // Añadir el usuario a la request para uso posterior
            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'No autorizado, token inválido' });
            return;
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token' });
        return;
    }
};