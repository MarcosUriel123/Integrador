// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PantallaPrincipal from '@/componentes/PantallaPrincipal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);

    useEffect(() => {
        // Verificar si hay un token guardado (solo para referencia)
        const checkToken = async () => {
            setIsCheckingAuth(true);
            try {
                const token = await AsyncStorage.getItem('userToken');
                console.log('Token encontrado:', token ? 'Sí' : 'No');
                // No redirigimos a ningún lado, solo registramos si hay un token
            } catch (error) {
                console.error('Error al verificar token:', error);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkToken();
    }, []);

    // Siempre mostraremos la pantalla principal, sin importar si hay sesión
    return (
        <View style={styles.container}>
            <PantallaPrincipal />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    }
});
