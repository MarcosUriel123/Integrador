import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const sendPurchaseEmail = async (req: Request, res: Response) => {
  const { email, cart } = req.body;

  console.log('Datos recibidos en el backend:', { email, cart });

  try {
    // Configurar el transporte de Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('Transporte de correo configurado correctamente.');

    // Generar el contenido del correo
    const itemsList = cart
      .map(
        (item: any) =>
          `<li>${item.product.name} - Cantidad: ${item.quantity} - Precio: $${item.product.price}</li>`
      )
      .join('');
    const totalPrice = cart.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity,
      0
    );

    console.log('Contenido del correo generado correctamente.');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Gracias por tu compra',
      html: `
        <h1>¡Gracias por tu compra!</h1>
        <p>Estos son los productos que adquiriste:</p>
        <ul>${itemsList}</ul>
        <p><strong>Total: $${totalPrice.toFixed(2)}</strong></p>
        <p>Esperamos que disfrutes tus productos. ¡Gracias por confiar en nosotros!</p>
      `,
    };

    console.log('Opciones del correo:', mailOptions);

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    console.log('Correo enviado con éxito a:', email);
    res.status(200).json({ message: 'Correo enviado con éxito' });
  } catch (error) {
    console.error('Error al enviar el correo de confirmación:', error);
    res.status(500).json({ message: 'Error al enviar el correo', error });
  }
};