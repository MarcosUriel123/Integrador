import mongoose, { Schema, Document } from 'mongoose';

export interface IFAQ extends Document {
    pregunta: string;
    respuesta: string;
}

const FAQSchema: Schema = new Schema({
    pregunta: {
        type: String,
        required: true
    },
    respuesta: {
        type: String,
        required: true
    }
});

export default mongoose.model<IFAQ>('preguntas', FAQSchema);