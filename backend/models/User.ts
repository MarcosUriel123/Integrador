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
    
    // Nuevo campo para el PIN del dispositivo
    devicePin: { 
        type: String,
        minlength: 4,
        maxlength: 6,
        validate: {
            validator: function(v: string) {
                return /^\d{4,6}$/.test(v);
            },
            message: (props: any) => `${props.value} no es un PIN válido. Debe ser numérico y tener entre 4 y 6 dígitos.`
        }
    }
});

const User = mongoose.model('User', userSchema);

export default User;