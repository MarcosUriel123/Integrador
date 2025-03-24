// app/registro1.tsx
import React, { useState } from 'react';
import PantallaRegistro1 from '@/componentes/PantallaRegistro1';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginResponse {
    token: string;
    [key: string]: any; // Para cualquier otra propiedad que pueda tener
}

export default function Registro1Screen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleNext = async (email: string, password: string) => {
        try {
            setIsLoading(true);

            // Paso 1: Registro exitoso (asumimos que ya se completó en PantallaRegistro1)

            // Paso 2: Iniciar sesión automáticamente
            const loginResponse = await axios.post<LoginResponse>('http://192.168.8.3:8082/api/users/login', {
                email,
                password
            });

            // Paso 3: Si el login es exitoso, guardar el token
            if (loginResponse.data && loginResponse.data.token) {
                await AsyncStorage.setItem('userToken', loginResponse.data.token);
                console.log('Sesión iniciada automáticamente después del registro');

                // Paso 4: Redirigir a la pantalla principal
                router.push('/Principal');
            } else {
                console.error('No se recibió un token en la respuesta de login automático');
                // Si algo falla, redirigir al login como fallback
                router.push('/Login1');
            }
        } catch (error) {
            console.error('Error al iniciar sesión automáticamente:', error);
            // En caso de error, redirigir al login para que lo intente manualmente
            router.push('/Login1');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PantallaRegistro1 onNext={handleNext} isLoading={isLoading} />
    );
}
