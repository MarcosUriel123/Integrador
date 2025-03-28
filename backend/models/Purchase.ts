import mongoose, { Schema, Document } from 'mongoose';

// Definición de la interfaz para los elementos del carrito
interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

// Interfaz para el documento de Purchase
export interface IPurchase extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    items: CartItem[];
    total: number;
    paymentMethod: string;
    date: Date;
    status: string;
    email: string;
}

// Esquema para los elementos del carrito
const CartItemSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
});

// Esquema principal de Purchase
const PurchaseSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    items: [CartItemSchema],
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'pendiente',
        enum: ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado']
    },
    email: {
        type: String,
        required: true
    }
});

// Crear y exportar el modelo
const Purchase = mongoose.model<IPurchase>('Purchase', PurchaseSchema);
export default Purchase;