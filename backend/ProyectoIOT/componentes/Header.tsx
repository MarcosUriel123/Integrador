import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Entypo, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HeaderProps = {
    title?: string; // Permite personalizar el título
    showMenu?: boolean; // Opcional: permite ocultar el menú si es necesario
    showProfileIcon?: boolean; // Opcional: permite ocultar el icono de perfil
};

const Header = ({
    title = 'Segurix',
    showMenu = true,
    showProfileIcon = true
}: HeaderProps) => {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);

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
                // Usuario autenticado, navegar a la ruta solicitada
                router.push(path as any);
            } else {
                // Usuario no autenticado, guardar la ruta deseada y redirigir al login
                await AsyncStorage.setItem('redirectAfterLogin', path);
                router.push('/Login1');
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
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
                router.push('/Login1');
                // Opcional: guardar la ruta de retorno para después del login
                await AsyncStorage.setItem('redirectAfterLogin', '/Datosperfil');
            }
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            router.push('/Login1');
        }
    };

    return (
        <>
            {/* Barra Superior */}
            <View style={styles.topBar}>
                <Text style={styles.logo}>{title}</Text>

                <View style={styles.iconsContainer}>
                    {/* INVERTIDO: Primero el botón de menú */}
                    {showMenu && (
                        <TouchableOpacity
                            onPress={() => setMenuVisible(true)}
                            style={styles.iconButton}
                        >
                            <Entypo name="menu" size={28} color="#1E1E1E" />
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

                            {/* Opciones del menú */}
                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/empresa')}>
                                <Text style={styles.modalText}>Empresa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/CatalogoProductosScreen')}>
                                <Text style={styles.modalText}>Productos</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/huella')}>
                                <Text style={styles.modalText}>Huella</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/puerta')}>
                                <Text style={styles.modalText}>Dispositivo IoT</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/rfidControl')}>
                                <Text style={styles.modalText}>RFID</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/Datosperfil')}>
                                <Text style={styles.modalText}>Perfil</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/registroUsuarios')}>
                                <Text style={styles.modalText}>Gestión de Usuarios</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/Aggprod')}>
                                <Text style={styles.modalText}>Admin (agg prod)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/AggDatosEmp')}>
                                <Text style={styles.modalText}>Admin (datos empresa)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigateWithAuthCheck('/registroDispositivo')}>
                                <Text style={styles.modalText}>Alta del dispositivo</Text>
                            </TouchableOpacity>

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
    },
    iconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 6,
        marginLeft: 15,
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