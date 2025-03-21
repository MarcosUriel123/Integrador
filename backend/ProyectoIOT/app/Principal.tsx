import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import PantallaPrincipal from '@/componentes/PantallaPrincipal';

export default function PerfilScreen() {
    const { userId } = useLocalSearchParams();
    return <PantallaPrincipal />;
}