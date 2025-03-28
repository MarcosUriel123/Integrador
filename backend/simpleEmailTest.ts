require('dotenv').config();
console.log("Iniciando prueba simple...");
console.log("Email:", process.env.EMAIL_USER);
console.log("Password (length):", process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: "delfireyesdev@gmail.com", // Usa tu correo real
  subject: "Test Simple",
  text: "Correo de prueba simple"
}, (error, info) => {
  if (error) {
    console.log("ERROR:", error);
  } else {
    console.log("Email enviado:", info.response);
  }
});

console.log("Prueba iniciada, espera resultado...");