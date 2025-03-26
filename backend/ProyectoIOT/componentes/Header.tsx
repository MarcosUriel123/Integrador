import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Entypo, Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from './CartContext';
import { useFocusEffect } from '@react-navigation/native';

type HeaderProps = {
    title?: string;
    showMenu?: boolean;
    showProfileIcon?: boolean;
    showCartIcon?: boolean;
};

const Header = ({
    title = 'Segurix',
    showMenu = true,
    showProfileIcon = true,
    showCartIcon = true
}: HeaderProps) => {
    const router = useRouter();
    const { totalItems } = useCart();
    const [menuVisible, setMenuVisible] = useState(false);
    const [hasDevice, setHasDevice] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Función para verificar estado de login y dispositivo
    const checkDeviceAndLoginStatus = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const userHasDevice = await AsyncStorage.getItem('userHasDevice');

            const isLogged = !!token;
            const hasDeviceValue = userHasDevice === 'true';

            console.log('[Header] Verificando estado:');
            console.log(`- Token presente: ${isLogged}`);
            console.log(`- Tiene dispositivo: ${hasDeviceValue} (valor exacto: "${userHasDevice}")`);

            setIsLoggedIn(isLogged);
            setHasDevice(hasDeviceValue);

            // Si está logueado pero no tenemos información del dispositivo, verificar con el servidor
            if (isLogged && userHasDevice === null) {
                console.log('[Header] No hay información sobre dispositivo. Verificando con el servidor...');
                await refreshDeviceStatus();
            }
        } catch (error) {
            console.error('[Header] Error al verificar estado:', error);
        }
    }, []);

    // Función para refrescar el estado del dispositivo desde el servidor
    const refreshDeviceStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            console.log('[Header] Solicitando estado del dispositivo al servidor...');

            // Aquí debes implementar la llamada a tu endpoint para verificar dispositivos
            const response = await fetch('http://192.168.8.6:8082/api/users/check-device', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[Header] Respuesta del servidor:', data);

                const hasDeviceValue = String(data.hasDevice);
                await AsyncStorage.setItem('userHasDevice', hasDeviceValue);
                setHasDevice(data.hasDevice);

                console.log(`[Header] Estado de dispositivo actualizado a: ${hasDeviceValue}`);
            } else {
                console.error('[Header] Error al verificar dispositivo:', response.status);
            }
        } catch (error) {
            console.error('[Header] Error al refrescar estado del dispositivo:', error);
        }
    };

    // Verificar al montar el componente
    useEffect(() => {
        checkDeviceAndLoginStatus();
    }, [checkDeviceAndLoginStatus]);

    // Verificar cada vez que el menú se abre
    useEffect(() => {
        if (menuVisible) {
            checkDeviceAndLoginStatus();
        }
    }, [menuVisible, checkDeviceAndLoginStatus]);

    // Verificar cada vez que la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            console.log('[Header] Pantalla recibió foco, verificando estado...');
            checkDeviceAndLoginStatus();
        }, [checkDeviceAndLoginStatus])
    );

    // Función para navegar a inicio al hacer clic en el logo
    const handleLogoPress = () => {
        router.push('/');
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
                setMenuVisible(false);
                return;
            }

            // Para rutas protegidas, verificar autenticación
            const token = await AsyncStorage.getItem('userToken');

            if (token) {
                // Verificar si el usuario intenta acceder a la página del dispositivo IoT
                if (path === '/puerta' && !hasDevice) {
                    console.log('[Header] Intento de acceso a /puerta sin dispositivo. Redirigiendo a registro...');
                    alert('Primero debes registrar un dispositivo IoT');
                    router.push('/registroDispositivo');
                } else {
                    // Usuario autenticado, navegar a la ruta solicitada
                    router.push(path as any);
                }
            } else {
                // Usuario no autenticado, guardar la ruta deseada y redirigir al login
                console.log(`[Header] Usuario no autenticado. Guardando ruta: ${path} y redirigiendo a login`);
                await AsyncStorage.setItem('redirectAfterLogin', path);
                router.push('/Login1');
            }
        } catch (error) {
            console.error('[Header] Error al verificar autenticación:', error);
            router.push('/Login1');
        } finally {
            // Cerrar el menú
            setMenuVisible(false);
        }
    };

    // Función para manejar el botón de perfil
    const handleProfilePress = async () => {
        try {
            // Verificar si hay una sesión activa
            const token = await AsyncStorage.getItem('userToken');

            if (token) {
                // Si hay sesión activa, navegar al perfil
                router.push('/Datosperfil');
            } else {
                // Si no hay sesión activa, redirigir al login
                console.log('[Header] Usuario no autenticado para perfil. Redirigiendo a login');
                await AsyncStorage.setItem('redirectAfterLogin', '/Datosperfil');
                router.push('/Login1');
            }
        } catch (error) {
            console.error('[Header] Error al verificar sesión para perfil:', error);
            router.push('/Login1');
        }
    };

    // Función para manejar el botón de carrito
    const handleCartPress = () => {
        router.push('/carrito');
    };

    return (
        <>
            {/* Barra Superior */}
            <View style={styles.topBar}>
                {/* Logo convertido en botón */}
                <TouchableOpacity onPress={handleLogoPress}>
                    <Text style={styles.logo}>Segurix</Text>
                </TouchableOpacity>

                <View style={styles.iconsContainer}>
                    {/* Icono de carrito */}
                    {showCartIcon && (
                        <TouchableOpacity
                            onPress={handleCartPress}
                            style={styles.iconButton}
                        >
                            <Ionicons name="cart-outline" size={24} color="#1E1E1E" />
                            {totalItems > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{totalItems}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Luego el botón de perfil */}
                    {showProfileIcon && (
                        <TouchableOpacity
                            onPress={handleProfilePress}
                            style={styles.iconButton}
                        >
                            <Feather name="user" size={24} color="#1E1E1E" />
                        </TouchableOpacity>
                    )}
                    {/* INVERTIDO: Primero el botón de menú */}
                    {showMenu && (
                        <TouchableOpacity
                            onPress={() => setMenuVisible(true)}
                            style={styles.iconButton}
                        >
                            <Entypo name="menu" size={28} color="#1E1E1E" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Modal para el Menú */}
            {showMenu && (
                <Modal
                    visible={menuVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setMenuVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Opciones</Text>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/empresa')}>
                                <Text style={styles.modalText}>Empresa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/CatalogoProductosScreen')}>
                                <Text style={styles.modalText}>Productos</Text>
                            </TouchableOpacity>

                            {/* Mostrar opción Dispositivo IoT solo si el usuario tiene un dispositivo y está logueado */}
                            {isLoggedIn && hasDevice && (
                                <TouchableOpacity onPress={() => navigateWithAuthCheck('/puerta')}>
                                    <Text style={styles.modalText}>
                                        Control de mi dispositivo IoT
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Mostrar opción para Registrar Dispositivo si está logueado pero no tiene dispositivo
                            {isLoggedIn && !hasDevice && (
                                <TouchableOpacity onPress={() => navigateWithAuthCheck('/registroDispositivo')}>
                                    <Text style={styles.modalText}>Registrar Dispositivo</Text>
                                </TouchableOpacity>
                            )} */}

                            {/* Admin options
                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/Aggprod')}>
                                <Text style={styles.modalText}>Admin (agg prod)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/AggDatosEmp')}>
                                <Text style={styles.modalText}>Admin (datos empresa)</Text>
                            </TouchableOpacity> */}

                            {/* Opción para depuración - Solo visible en desarrollo
                            {__DEV__ && (
                                <TouchableOpacity onPress={() => navigateWithAuthCheck('/debug')}>
                                    <Text style={styles.modalText}>Debug Info</Text>
                                </TouchableOpacity>
                            )} */}

                            {/* Botón de cerrar */}
                            <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
                                <Text style={styles.closeButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    // Estilos existentes...
    badge: {
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: '#dc3545',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 10,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E1E1E',
        paddingVertical: 5,
    },
    iconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 6,
        marginLeft: 15,
        position: 'relative',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 18,
        paddingVertical: 10,
    },
    statusIndicator: {
        color: 'green',
        marginLeft: 5,
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: 15,
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#FFF',
        fontSize: 16,
    },
});

export default Header;