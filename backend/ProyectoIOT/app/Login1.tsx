import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import PantallaLogin from '@/componentes/PantallaLogin1';

export default function PerfilScreen() {
    const { userId } = useLocalSearchParams();
    console.log('User ID:', userId);
    return <PantallaLogin />;
}