import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PantallaPerfil from '@/componentes/PantallaPerfil'; // Cambia esta línea

export default function PerfilScreen() {
    const { userId: paramUserId } = useLocalSearchParams();
    const [userId, setUserId] = useState<string | undefined>(
        paramUserId as string | undefined
    );
    const [loading, setLoading] = useState(!userId);

    // Si no hay userId en los parámetros, intentar obtenerlo de AsyncStorage
    useEffect(() => {
        const getUserIdFromStorage = async () => {
            if (!userId) {
                try {
                    const storedUserId = await AsyncStorage.getItem('userId');
                    if (storedUserId) {
                        console.log('UserId obtenido de AsyncStorage:', storedUserId);
                        setUserId(storedUserId);
                    } else {
                        console.warn('No se encontró userId en AsyncStorage');
                    }
                } catch (error) {
                    console.error('Error al recuperar userId de AsyncStorage:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        getUserIdFromStorage();
    }, [userId]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={{ marginTop: 10 }}>Cargando perfil...</Text>
            </View>
        );
    }

    return <PantallaPerfil userId={userId} />;
}