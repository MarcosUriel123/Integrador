import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import IPS from '../config/IPS';
import { useTheme } from '../context/ThemeContext';

export default function MenuScreen() {
    const router = useRouter();
    const { isDarkMode, toggleTheme } = useTheme();

    // Estados para control de autenticación y dispositivos
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasDevice, setHasDevice] = useState(false);

    // Función para verificar estado de login y dispositivo
    const checkDeviceAndLoginStatus = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const userHasDevice = await AsyncStorage.getItem('userHasDevice');

            const isLogged = !!token;
            const hasDeviceValue = userHasDevice === 'true';

            console.log('[Menu] Verificando estado:');
            console.log(`- Token presente: ${isLogged}`);
            console.log(`- Tiene dispositivo: ${hasDeviceValue} (valor exacto: "${userHasDevice}")`);

            setIsLoggedIn(isLogged);
            setHasDevice(hasDeviceValue);

            // Verificar con el servidor siempre que esté logueado
            if (isLogged) {
                console.log('[Menu] Verificando con el servidor si hay dispositivos nuevos...');
                await refreshDeviceStatus();
            }
        } catch (error) {
            console.error('[Menu] Error al verificar estado:', error);
        }
    }, []);

    // Función para refrescar el estado del dispositivo desde el servidor
    const refreshDeviceStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            console.log('[Menu] Solicitando estado del dispositivo al servidor...');

            const response = await fetch(`${IPS.SERVER_URL}/api/users/check-device`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Añadir manejo detallado de errores
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Menu] Error al verificar dispositivo:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorText
                });
                return;
            }

            const data = await response.json();
            console.log('[Menu] Respuesta del servidor:', data);

            const hasDeviceValue = String(data.hasDevice);
            await AsyncStorage.setItem('userHasDevice', hasDeviceValue);
            setHasDevice(data.hasDevice);
        } catch (error) {
            console.error('[Menu] Error al refrescar estado del dispositivo:',
                error instanceof Error ? error.message : String(error));
        }
    };

    // Helper para verificar autenticación antes de navegar
    const navigateWithAuthCheck = async (path: string) => {
        try {
            // Lista de rutas públicas que no requieren autenticación
            const publicRoutes = [
                '/CatalogoProductosScreen',
                '/empresa',
                // Agregar otras rutas públicas aquí si es necesario
            ];

            // Si es una ruta pública, navegar directamente sin verificar autenticación
            if (publicRoutes.includes(path)) {
                router.push(path as any);
                return;
            }

            // Para rutas protegidas, verificar autenticación
            const token = await AsyncStorage.getItem('userToken');

            if (token) {
                // Verificar si el usuario intenta acceder a la página del dispositivo IoT
                if (path === '/puerta' && !hasDevice) {
                    console.log('[Menu] Intento de acceso a /puerta sin dispositivo. Redirigiendo a registro...');
                    Alert.alert('Atención', 'Primero debes registrar un dispositivo IoT');
                    router.push('/registroDispositivo');
                } else {
                    // Usuario autenticado, navegar a la ruta solicitada
                    router.push(path as any);
                }
            } else {
                // Usuario no autenticado, guardar la ruta deseada y redirigir al login
                console.log(`[Menu] Usuario no autenticado. Guardando ruta: ${path} y redirigiendo a login`);
                await AsyncStorage.setItem('redirectAfterLogin', path);
                router.push('/Login1');
            }
        } catch (error) {
            console.error('[Menu] Error al verificar autenticación:', error);
            router.push('/Login1');
        }
    };

    // Verificar al montar el componente
    useEffect(() => {
        checkDeviceAndLoginStatus();
    }, [checkDeviceAndLoginStatus]);

    // Verificar cada vez que la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            console.log('[Menu] Pantalla recibió foco, verificando estado...');
            checkDeviceAndLoginStatus();
        }, [checkDeviceAndLoginStatus])
    );

    // Definir los elementos del menú con su lógica condicional
    const getMenuItems = () => {
        const baseItems = [
            {
                title: 'Empresa',
                icon: 'business-outline',
                onPress: () => navigateWithAuthCheck('/empresa'),
            }
        ];

        // Solo mostrar opciones de dispositivos si el usuario está logueado y tiene un dispositivo
        if (isLoggedIn && hasDevice) {
            baseItems.push({
                title: 'Mis Dispositivos',
                icon: 'hardware-chip-outline',
                onPress: () => navigateWithAuthCheck('/devices'),
            });

            baseItems.push({
                title: 'Registros de Acceso',
                icon: 'list-outline',
                onPress: () => navigateWithAuthCheck('/registros'),
            });
        }

        return baseItems;
    };

    const menuItems = getMenuItems();

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: isDarkMode ? '#0d1117' : '#f5f5f5' }
            ]}
        >
            <View style={styles.menuContainer}>
                {/* Botón para cambiar tema */}
                <TouchableOpacity
                    style={[
                        styles.themeToggleButton,
                        { backgroundColor: isDarkMode ? '#161b22' : '#ffffff' }
                    ]}
                    onPress={toggleTheme}
                >
                    <View style={styles.themeButtonContent}>
                        <View style={{ marginRight: 16 }}>
                            <Ionicons
                                name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
                                size={24}
                                color={isDarkMode ? '#58a6ff' : '#0969da'}
                            />
                        </View>
                        <Text style={[
                            styles.menuItemText,
                            { color: isDarkMode ? '#c9d1d9' : '#24292f' }
                        ]}>
                            {isDarkMode ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Opciones de menú */}
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.menuItem,
                            { backgroundColor: isDarkMode ? '#161b22' : '#ffffff' }
                        ]}
                        onPress={item.onPress}
                    >
                        <Ionicons
                            name={item.icon as any}
                            size={24}
                            color={isDarkMode ? '#58a6ff' : '#0969da'}
                        />
                        <Text style={[
                            styles.menuItemText,
                            { color: isDarkMode ? '#c9d1d9' : '#24292f' }
                        ]}>
                            {item.title}
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={isDarkMode ? '#8b949e' : '#57606a'}
                        />
                    </TouchableOpacity>
                ))}

                {/* Mensaje informativo para usuarios no autenticados */}
                {/* {!isLoggedIn && (
                    <View style={[
                        styles.infoBox,
                        {
                            backgroundColor: isDarkMode ? '#21262d' : '#f6f8fa',
                            borderColor: isDarkMode ? '#30363d' : '#d0d7de'
                        }
                    ]}>
                        <Ionicons
                            name="information-circle-outline"
                            size={22}
                            color={isDarkMode ? '#58a6ff' : '#0969da'}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={[
                            styles.infoText,
                            { color: isDarkMode ? '#c9d1d9' : '#24292f' }
                        ]}>
                            Inicia sesión para acceder a todas las funciones
                        </Text>
                    </View>
                )} */}

                {/* Mensaje para usuarios sin dispositivo */}
                {isLoggedIn && !hasDevice && (
                    <View style={[
                        styles.infoBox,
                        {
                            backgroundColor: isDarkMode ? '#21262d' : '#f6f8fa',
                            borderColor: isDarkMode ? '#30363d' : '#d0d7de'
                        }
                    ]}>
                        <Ionicons
                            name="devices-outline"
                            size={22}
                            color={isDarkMode ? '#58a6ff' : '#0969da'}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={[
                            styles.infoText,
                            { color: isDarkMode ? '#c9d1d9' : '#24292f' }
                        ]}>
                            No tienes dispositivos vinculados
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    menuContainer: {
        padding: 16,
        paddingBottom: 80, // Espacio para el TabBar
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 33,
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    themeToggleButton: {
        padding: 20,
        borderRadius: 28,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    themeButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 16,
        flex: 1,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    infoText: {
        fontSize: 14,
        flex: 1,
    },
});