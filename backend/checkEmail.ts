import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

console.log('=== DIAGNÓSTICO DE CONFIGURACIÓN DE CORREO ===');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD existe:', !!process.env.EMAIL_PASSWORD);
console.log('Ruta .env:', path.resolve('.env'));

async function testEmail() {
  console.log('\nIniciando prueba de envío...');
  
  try {
    // Crear transportador con más detalles de depuración
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      debug: true,
      logger: true
    });

    console.log('\nVerificando conexión con el servidor SMTP...');
    await transporter.verify();
    console.log('✅ Conexión con el servidor SMTP verificada correctamente');

    console.log('\nEnviando correo de prueba...');
    const info = await transporter.sendMail({
      from: `"Sistema Segurix" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Enviamos a nosotros mismos para prueba
      subject: "Prueba de correo desde sistema Segurix",
      text: "Este es un correo de prueba para verificar la configuración.",
      html: "<h1>Prueba de correo</h1><p>Si puedes ver este mensaje, la configuración funciona correctamente.</p>"
    });
    
    console.log('✅ Correo enviado exitosamente');
    console.log('ID del mensaje:', info.messageId);
  } catch (error) {
    console.error('❌ ERROR AL ENVIAR CORREO:');
    if (error instanceof Error) {
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error(error);
    }
    
    if (error instanceof Error && error.message.includes('Invalid login')) {
      console.log('\n⚠️ PROBLEMA DE AUTENTICACIÓN');
      console.log('Las credenciales parecen ser incorrectas o Google bloqueó el inicio de sesión.');
      console.log('Recomendaciones:');
      console.log('1. Verifica que el correo y la contraseña sean correctos');
      console.log('2. Para Gmail, necesitas usar una contraseña de aplicación:');
      console.log('   a. Activa la verificación en 2 pasos en tu cuenta Google');
      console.log('   b. Ve a https://myaccount.google.com/apppasswords');
      console.log('   c. Genera una nueva contraseña para esta aplicación');
      console.log('   d. Usa esa contraseña en el archivo .env');
    }
  }
}

testEmail();