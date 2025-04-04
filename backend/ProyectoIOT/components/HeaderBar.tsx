import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { usePathname } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function HeaderBar() {
    const pathname = usePathname();
    // Usar el contexto de tema en lugar de useColorScheme
    const { isDarkMode } = useTheme();

    const getTitle = () => {
        switch (pathname) {
            case '/':
            case '/index':
            case '/(tabs)':
            case '/(tabs)/index':
                return 'Tienda';
            case '/carrito':
            case '/(tabs)/carrito':
                return 'Carrito';
            case '/Datosperfil':
            case '/(tabs)/Datosperfil':
                return 'Mi Perfil';
            case '/menu':
            case '/(tabs)/menu':
                return 'Menú';
            case '/puerta':
                return 'Dispositivo IoT';
            case '/empresa':
                return 'Empresa';
            case '/login':
            case '/Login1':
                return 'Iniciar Sesión';
            case '/registro':
            case '/registro1':
                return 'Registro';
            case '/ActualizarPerfil':
                return 'Editar Perfil';
            case '/registroDispositivo':
                return 'Registro de Dispositivo';
            case '/seleccionDispositivo':
                return 'Seleccionar Dispositivo';
            case '/registroUsuarios':
                return 'Usuarios';
            case '/registros':
                return 'Historial de Accesos';
            default:
                return 'Segurix';
        }
    };

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
                borderBottomColor: isDarkMode ? '#30363d' : '#d0d7de',
            }
        ]}>
            <Text style={[
                styles.title,
                { color: isDarkMode ? '#c9d1d9' : '#24292f' }
            ]}>
                {getTitle()}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        // borderBottomWidth: 1,
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
    },
});