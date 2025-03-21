import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
    userId: mongoose.Types.ObjectId;
    macAddress: string;
    name: string;
    location: string;
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
    location: {
        type: String,
        required: true,
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
}, {
    timestamps: true
});

export default mongoose.model<IDevice>('Device', DeviceSchema);