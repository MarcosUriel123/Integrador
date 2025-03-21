// app/index.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import PantallaLogin from '@/componentes/PantallaLogin1';
import PantallaPrincipal from '@/componentes/PantallaPrincipal';

export default function HomeScreen() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
    };

    return (
        <View style={styles.container}>
            {isLoggedIn ? (
                <View style={styles.container}>
                    <PantallaPrincipal />
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <PantallaLogin />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF', // O #CFE2FF, si lo prefieres
    },
    logoutButton: {
        backgroundColor: '#007BFF',
        padding: 10,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#FFF',
        fontSize: 16,
    },
});
