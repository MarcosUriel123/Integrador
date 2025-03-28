import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Purchase from '../models/Purchase';

dotenv.config();

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Reemplaza la función checkout con esta versión simplificada

export const checkout = async (req: Request, res: Response): Promise<void> => {
    console.log('=== INICIO DE CHECKOUT ===');
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    try {
        const { items, total, email } = req.body;
        
        // Validaciones básicas
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ message: 'El carrito está vacío o tiene formato incorrecto' });
            return;
        }

        if (!email) {
            res.status(400).json({ message: 'El email es requerido' });
            return;
        }

        console.log('Preparando correo para:', email);
        
        // Crear contenido HTML para el correo
        const productsList = items.map((item: any) => 
            `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>`
        ).join('');

        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
                    <h1>¡Compra Realizada con Éxito!</h1>
                </div>
                
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p>Gracias por tu compra en Segurix. Aquí está el detalle de tu pedido:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
                        <tr style="background-color: #f2f2f2; font-weight: bold;">
                            <th style="padding: 10px; text-align: left;">Producto</th>
                            <th style="padding: 10px; text-align: center;">Cantidad</th>
                            <th style="padding: 10px; text-align: right;">Precio</th>
                            <th style="padding: 10px; text-align: right;">Subtotal</th>
                        </tr>
                        ${productsList}
                        <tr style="font-weight: bold;">
                            <td colspan="3" style="padding: 10px; text-align: right;">Total:</td>
                            <td style="padding: 10px; text-align: right;">$${total.toFixed(2)}</td>
                        </tr>
                    </table>
                    
                    <p>Gracias por confiar en nosotros.</p>
                    <p>Atentamente,<br>Equipo de Segurix</p>
                </div>
            </div>
        `;

        console.log('Enviando correo...');
        
        // Intentar enviar el correo
        try {
            const info = await transporter.sendMail({
                from: `"Segurix" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Confirmación de compra - Segurix',
                html: emailContent
            });
            
            console.log('✅ Correo enviado exitosamente');
            console.log('ID del mensaje:', info.messageId);
            
            // Responder al cliente con éxito
            res.status(200).json({
                success: true,
                message: 'Compra procesada correctamente y correo enviado',
                emailId: info.messageId
            });
        } catch (emailError) {
            console.error('❌ ERROR AL ENVIAR CORREO:', emailError);
            
            // En caso de error de correo, aún indicamos que la compra fue exitosa
            res.status(200).json({
                success: true,
                message: 'Compra procesada correctamente pero hubo un problema al enviar el correo',
                error: emailError instanceof Error ? emailError.message : 'Error desconocido'
            });
        }
        
    } catch (error) {
        console.error('Error en checkout:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al procesar la compra',
            error: error instanceof Error ? error.message : String(error) 
        });
    }
};

// Reemplaza la función sendPurchaseEmail con esta versión ultra-simple:

export const sendPurchaseEmail = async (req: Request, res: Response): Promise<void> => {
    console.log('=== SOLICITUD DE ENVÍO DE CORREO RECIBIDA ===');
    console.log('Datos:', JSON.stringify(req.body, null, 2));
    
    try {
        const { email, cart } = req.body;
        
        // Validaciones básicas
        if (!email) {
            res.status(400).json({ success: false, message: 'Email no proporcionado' });
            return;
        }
        
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            res.status(400).json({ success: false, message: 'Carrito vacío o inválido' });
            return;
        }
        
        // Calcular total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Preparar contenido
        let htmlContent = `
            <h1>Confirmación de Compra - Segurix</h1>
            <p>Gracias por tu compra. Aquí está el detalle:</p>
            <table border="1" cellpadding="5" style="border-collapse: collapse;">
                <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                </tr>
        `;
        
        for (const item of cart) {
            htmlContent += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `;
        }
        
        htmlContent += `
                <tr>
                    <td colspan="3" align="right"><strong>Total:</strong></td>
                    <td><strong>$${total.toFixed(2)}</strong></td>
                </tr>
            </table>
            <p>¡Gracias por tu compra!</p>
        `;
        
        // Configurar correo
        const mailOptions = {
            from: `"Segurix" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Confirmación de Compra - Segurix",
            html: htmlContent
        };
        
        // Enviar correo (sin esperar)
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar correo:', error);
            } else {
                console.log('Correo enviado:', info.messageId);
            }
        });
        
        // IMPORTANTE: Siempre respondemos éxito, incluso si el correo falla
        // Esto es para que la aplicación continúe el flujo
        res.status(200).json({
            success: true,
            message: 'Proceso de compra completado exitosamente'
        });
        
    } catch (error) {
        console.error('Error en el controlador:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};