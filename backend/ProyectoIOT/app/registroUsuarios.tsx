import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import PantallaRegUsr from '@/componentes/PantallaRegistroUsuarios';

export default function PerfilScreen() {
    const { userId } = useLocalSearchParams();
    return <PantallaRegUsr />;
}