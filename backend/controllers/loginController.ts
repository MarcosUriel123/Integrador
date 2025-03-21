import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Asegúrate de importar jwt

// Función para generar el token JWT
const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your_default_secret', {
        expiresIn: '30d'
    });
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        // Buscar al usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Comparar la contraseña ingresada con la contraseña encriptada almacenada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        // Generar token JWT
        const token = generateToken(user._id.toString());

        // Convertir a objeto para eliminar el campo de la contraseña antes de enviar la respuesta
        const userResponse: { password?: string } = user.toObject();
        delete userResponse.password;

        // Devolver el usuario y el token
        return res.status(200).json({
            ...userResponse,
            token
        });
    } catch (error) {
        next(error);
    }
};