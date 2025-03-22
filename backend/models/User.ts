import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    surname: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    secretQuestion: { type: Number, required: true, ref: 'PreguntasSecretas' },
    secretAnswer: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

export default User; 