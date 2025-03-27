import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import fingerprintRoutes from './routes/fingerprintRoutes';
import passwordRoutes from './routes/passwordRoutes';
import userRoutes from './routes/userRoutes';
import huellaRoutes from './routes/huellaRoutes';
import doorRoutes from './routes/doorRoutes';  
import productRoutes from './routes/productRoutes'; // Import product routes
import empresaRoutes from './routes/empresaRoutes';

const app = express();
const PORT = process.env.PORT || 8082;

// Configuración de CORS
app.use(cors({
  origin: '*', // Permite cualquier origen (ajusta en producción)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
  credentials: true, // Permite credenciales (cookies, headers de autenticación)
}));

// Agregar manejo explícito de CORS para todas las rutas
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Agregar middleware para preflight
app.options('*', cors());

// Conectar a MongoDB (si lo estás usando)
connectDB();

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/fingerprints', fingerprintRoutes); // Rutas para huellas dactilares
app.use('/api/passwords', passwordRoutes); // Rutas para contraseñas
app.use('/api/users', userRoutes); // Rutas para usuarios
app.use('/api/door', doorRoutes);  // Rutas para el control de la puerta
app.use('/api/huella', huellaRoutes);  // Rutas para el control de huellas
app.use('/api/products', productRoutes); // Rutas para el control de productos
app.use('/api', empresaRoutes); // Rutas para el control de los datos de la empresa

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
