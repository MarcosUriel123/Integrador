import mongoose, { Schema, Document } from 'mongoose';

export interface ISecretQuestion extends Document {
    _id: number;
    pregunta: string;
}

const SecretQuestionSchema: Schema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    pregunta: {
        type: String,
        required: true
    }
});

export default mongoose.model<ISecretQuestion>('PreguntasSecretas', SecretQuestionSchema);