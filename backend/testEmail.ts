// testEmail.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Mostrar la ruta del archivo .env que se está cargando
console.log('Cargando .env desde:', path.resolve('.env'));
dotenv.config();

// Verificar si las variables de entorno se están cargando
console.log('Variables de entorno:');
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);

async function testEmail() {
  console.log('Iniciando prueba de envío de correo...');
  
  try {
    console.log('Configurando transportador de nodemailer...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      debug: true // Habilitar modo debug para ver más información
    });

    console.log('Verificando conexión con el servidor SMTP...');
    await transporter.verify();
    console.log('Conexión con el servidor SMTP verificada correctamente');

    console.log('Preparando correo de prueba...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "delfireyesdev@gmail.com", // Cambia esto a tu email real
      subject: "Test Email desde Segurix",
      text: "Si ves este mensaje, la configuración de correo funciona correctamente.",
      html: "<h1>Test de Correo</h1><p>Si ves este mensaje, la configuración de correo funciona correctamente.</p>"
    });
    
    console.log("✅ Email enviado exitosamente");
    console.log("ID del mensaje:", info.messageId);
  } catch (error) {
    console.error("❌ Error al enviar email:");
    if (error instanceof Error) {
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error(error);
    }
  }

  console.log('Prueba de correo finalizada');
}

// Ejecutar la función y manejar la promesa correctamente
(async () => {
  console.log("=== INICIO DE PRUEBA DE EMAIL ===");
  try {
    await testEmail();
    console.log("=== FIN DE PRUEBA DE EMAIL ===");
  } catch (error) {
    console.error("Error no controlado:", error);
  }
})();