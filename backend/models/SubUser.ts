import mongoose, { Schema, Document } from 'mongoose';

export interface ISubUser extends Document {
    adminId: mongoose.Types.ObjectId;  // ID del usuario administrador
    name: string;                      // Nombre del subusuario
    accessMethod: 'fingerprint' | 'rfid'; // Método de acceso
    accessId: string;                  // ID de la huella o tarjeta RFID
    isActive: boolean;                 // Si el acceso está activo
    createdAt: Date;
    updatedAt: Date;
}

const SubUserSchema: Schema = new Schema({
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    accessMethod: {
        type: String,
        required: true,
        enum: ['fingerprint', 'rfid']
    },
    accessId: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índice compuesto para evitar duplicados
SubUserSchema.index({ adminId: 1, accessMethod: 1, accessId: 1 }, { unique: true });

export default mongoose.model<ISubUser>('SubUser', SubUserSchema);