import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define la interfaz para el objeto Usuario
interface User {
    _id: string;
    name: string;
    lastName: string;
    surname?: string;
    phone?: string;
    email: string;
    // Otros campos que pueda tener tu usuario
}

type Props = {
    userId?: string;
};

export default function PantallaPerfil({ userId }: Props) {
    const router = useRouter();
    const [userData, setUserData] = useState<User | null>(null);
    const [localUserId, setLocalUserId] = useState<string | null>(userId || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Obtener el userId desde AsyncStorage si no se proporcionó como prop
    useEffect(() => {
        const getUserIdFromStorage = async () => {
            try {
                if (!localUserId) {
                    const storedUserId = await AsyncStorage.getItem('userId');
                    if (storedUserId) {
                        setLocalUserId(storedUserId);
                    } else {
                        setError('No se pudo encontrar el ID de usuario');
                    }
                }
            } catch (err) {
                console.error('Error al obtener userId de AsyncStorage:', err);
                setError('Error al cargar datos de usuario');
            } finally {
                setLoading(false);
            }
        };

        getUserIdFromStorage();
    }, []);

    // Cargar datos del usuario cuando tengamos un userId válido
    useEffect(() => {
        if (localUserId) {
            fetchUserData();
        }
    }, [localUserId]);

    const fetchUserData = async () => {
        if (!localUserId) {
            console.error('No hay userId disponible para obtener datos');
            setError('No se puede cargar el perfil sin ID de usuario');
            return;
        }

        try {
            setLoading(true);
            console.log(`Intentando obtener datos para userId: ${localUserId}`);
            const response = await axios.get<User>(`http://localhost:8082/api/users/${localUserId}`);
            setUserData(response.data);
            setError('');
        } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            setError('Error al cargar los datos del perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = () => {
        // Navegar a la pantalla de actualización pasando el userId
        router.push({
            pathname: '/actualizar-perfil',
            params: { userId: localUserId }
        });
    };

    if (loading) {
        return (
            <View style={[styles.screen, styles.centeredContainer]}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.screen, styles.centeredContainer]}>
                <Feather name="alert-circle" size={50} color="red" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.button} onPress={() => fetchUserData()}>
                    <Text style={styles.buttonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!userData) {
        return (
            <View style={[styles.screen, styles.centeredContainer]}>
                <Text style={styles.errorText}>No se encontraron datos del usuario</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Mi Perfil</Text>
                    </View>

                    <View style={styles.contentContainer}>
                        <View style={styles.profileImageContainer}>
                            <Feather name="user" size={80} color="#007bff" />
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.userName}>{userData.name} {userData.lastName} {userData.surname || ''}</Text>
                            <Text style={styles.userEmail}>{userData.email}</Text>
                        </View>

                        <View style={styles.detailsContainer}>
                            <View style={styles.detailItem}>
                                <Feather name="user" size={20} color="#555" />
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Nombre completo</Text>
                                    <Text style={styles.detailValue}>
                                        {userData.name} {userData.lastName} {userData.surname || ''}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailItem}>
                                <Feather name="mail" size={20} color="#555" />
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Correo electrónico</Text>
                                    <Text style={styles.detailValue}>{userData.email}</Text>
                                </View>
                            </View>

                            <View style={styles.detailItem}>
                                <Feather name="phone" size={20} color="#555" />
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Teléfono</Text>
                                    <Text style={styles.detailValue}>{userData.phone || 'No especificado'}</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile}>
                            <Feather name="edit" size={18} color="#fff" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Actualizar Perfil</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
    },
    centeredContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    topBar: {
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007bff',
    },
    contentContainer: {
        padding: 20,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#f0f8ff',
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignSelf: 'center',
    },
    infoSection: {
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    detailsContainer: {
        marginBottom: 25,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
    },
    detailTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 3,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
    },
    updateButton: {
        backgroundColor: '#007bff',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        paddingVertical: 14,
        width: '100%',
        marginTop: 10,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        marginTop: 10,
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 15,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        backgroundColor: '#007bff',
        borderRadius: 8,
    },
});