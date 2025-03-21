import 'express';

declare global {
    namespace Express {
        interface Request {
            user?: any; // O bien define una interfaz concreta para el payload del token
        }
    }
}