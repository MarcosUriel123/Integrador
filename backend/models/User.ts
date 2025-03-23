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
    devicePin: {
        type: String,
        maxlength: 4,
        validate: {
            validator: function (v: string) {
                return /^\d{4}$/.test(v);
            },
            message: 'El PIN debe ser de exactamente 4 dígitos'
        }
    },
});

const User = mongoose.model('User', userSchema);

export default User; 