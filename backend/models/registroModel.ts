import mongoose from 'mongoose';

const registroSchema = new mongoose.Schema({
    mensaje: { type: String, required: true },
    descripcion: { type: String, required: true },
    // Nuevos campos para método de acceso
    metodoAcceso: { type: String, default: 'desconocido' }, // PIN, RFID, HUELLA, API, etc.
    valorMetodo: { type: String, default: '' },              // El valor específico del método
    fecha: { type: Date, default: Date.now }
});

const Registro = mongoose.model('Registro', registroSchema);
export default Registro;