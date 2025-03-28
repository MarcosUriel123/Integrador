import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
    Dimensions,
    TouchableWithoutFeedback
} from 'react-native';
import { Entypo, Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from './CartContext';
import { useFocusEffect } from '@react-navigation/native';

// Obtener dimensiones de pantalla
const { width, height } = Dimensions.get('window');

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

    // Animaciones
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(width)).current;

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

            // MODIFICADO: Verificar con el servidor siempre que esté logueado
            // para tener información actualizada sobre dispositivos
            if (isLogged) {
                console.log('[Header] Verificando con el servidor si hay dispositivos nuevos...');
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

            const response = await fetch('http://192.168.1.133:8082/api/users/check-device', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Añadir manejo detallado de errores
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Header] Error al verificar dispositivo:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorText
                });
                return;
            }

            const data = await response.json();
            console.log('[Header] Respuesta del servidor:', data);

            const hasDeviceValue = String(data.hasDevice);
            await AsyncStorage.setItem('userHasDevice', hasDeviceValue);
            setHasDevice(data.hasDevice);
        } catch (error) {
            console.error('[Header] Error al refrescar estado del dispositivo:',
                error instanceof Error ? error.message : String(error));
        }
    };

    // Verificar al montar el componente
    useEffect(() => {
        checkDeviceAndLoginStatus();
    }, [checkDeviceAndLoginStatus]);

    // Gestionar animaciones del menú
    useEffect(() => {
        if (menuVisible) {
            checkDeviceAndLoginStatus();

            // Animar apertura del menú
            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: width * 0.3,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            // Animar cierre del menú
            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: width,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [menuVisible, checkDeviceAndLoginStatus, backdropAnim, slideAnim]);

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

    // Cerrar el menú al tocar el fondo
    const closeMenu = () => {
        setMenuVisible(false);
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

                    {/* Botón de menú */}
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

            {/* Menú Lateral (reemplaza el Modal) */}
            {showMenu && (
                <>
                    {/* Fondo oscuro con efecto fade */}
                    <Animated.View
                        style={[
                            styles.backdrop,
                            {
                                opacity: backdropAnim,
                                display: menuVisible ? 'flex' : 'none'
                            }
                        ]}
                    >
                        <TouchableWithoutFeedback onPress={closeMenu}>
                            <View style={{ width: '100%', height: '100%' }} />
                        </TouchableWithoutFeedback>
                    </Animated.View>

                    {/* Panel lateral deslizante */}
                    <Animated.View
                        style={[
                            styles.sideMenu,
                            { transform: [{ translateX: slideAnim }] }
                        ]}
                    >
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Menú</Text>
                            <TouchableOpacity onPress={closeMenu} style={styles.closeIcon}>
                                <Ionicons name="close" size={24} color="#1E1E1E" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.menuDivider} />

                        <View style={styles.menuItems}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigateWithAuthCheck('/empresa')}
                            >
                                <Ionicons name="business-outline" size={22} color="#1E1E1E" style={styles.menuItemIcon} />
                                <Text style={styles.menuItemText}>Empresa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigateWithAuthCheck('/CatalogoProductosScreen')}
                            >
                                <Ionicons name="grid-outline" size={22} color="#1E1E1E" style={styles.menuItemIcon} />
                                <Text style={styles.menuItemText}>Productos</Text>
                            </TouchableOpacity>

                            {/* Mostrar opción Dispositivo IoT solo si el usuario tiene un dispositivo y está logueado */}
                            {isLoggedIn && hasDevice && (
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => navigateWithAuthCheck('/devices')}
                                >
                                    <Ionicons name="hardware-chip-outline" size={22} color="#1E1E1E" style={styles.menuItemIcon} />
                                    <Text style={styles.menuItemText}>Control IoT</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={closeMenu}
                        >
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </>
            )}
        </>
    );
};

const styles = StyleSheet.create({
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
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
    },
    sideMenu: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '70%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        zIndex: 11,
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: -2,
            height: 0
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    menuTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E1E1E',
    },
    closeIcon: {
        padding: 5,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginBottom: 20,
    },
    menuItems: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemIcon: {
        marginRight: 15,
    },
    menuItemText: {
        fontSize: 18,
        color: '#1E1E1E',
    },
    closeButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default Header;