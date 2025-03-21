import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your_default_secret', {
        expiresIn: '30d',
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