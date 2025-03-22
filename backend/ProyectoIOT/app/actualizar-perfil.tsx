import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import PantallaActualizarPerfil from '@/componentes/PantallaActualizarPerfil';

export default function ActualizarPerfilScreen() {
    const { userId } = useLocalSearchParams();

    return <PantallaActualizarPerfil userId={userId as string} />;
}