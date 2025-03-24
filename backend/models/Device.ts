import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
    userId: mongoose.Types.ObjectId;
    macAddress: string;
    name: string;
    devicePin: string;
    location?: string;
    isOnline?: boolean;
    lastConnection?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const DeviceSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    macAddress: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    devicePin: {
        type: String,
        required: true,
        maxlength: 4,
        minlength: 4,
        validate: {
            validator: function (v: string) {
                return /^\d{4}$/.test(v);
            },
            message: 'El PIN debe ser de exactamente 4 dígitos numéricos'
        }
    },
    location: {
        type: String,
        default: 'Casa',
        trim: true
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastConnection: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Índice para acelerar búsquedas por usuario
DeviceSchema.index({ userId: 1 });

export default mongoose.model<IDevice>('Device', DeviceSchema);