import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import IPS from '../config/IPS';
import { useAppTheme } from '../hooks/useAppTheme'; // Importamos nuestro hook personalizado


// Tipo para los datos del usuario - Corrige la interfaz
interface UserData {
    _id: string;
    name: string;
    lastName: string;
    surname: string;
    phone: string;
    email: string;
    secretQuestion?: number;
    secretAnswer?: string;
    createdAt?: string;
    devicePin?: string;
    // Elimina phoneNumber y address que no existen en tu BD
}

interface PantallaPerfilProps {
    userId?: string;
}

export default function PantallaPerfil({ userId }: PantallaPerfilProps) {
    const router = useRouter();
    const { colors, styles: baseStyles } = useAppTheme(); // Obtenemos colores y estilos base
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState<Partial<UserData>>({});

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // Cargar datos del usuario
    useEffect(() => {
        // Animación de entrada
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();

        fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                router.push('/Login1');
                return;
            }

            // Si no tenemos userId, intentamos obtener el perfil del usuario actual
            const endpoint = userId
                ? `${IPS.SERVER_URL}/api/users/${userId}`
                : `${IPS.SERVER_URL}/api/users/me`;

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setUserData(data);
            // Inicializar datos editables con los valores actuales
            setEditedData({
                name: data.name,
                email: data.email,
                phone: data.phone || ''
            });
            setError('');
        } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            setError('No se pudieron cargar los datos del perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Cerrar sesión",
            "¿Estás seguro de que deseas cerrar sesión?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Cerrar sesión",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('userToken');
                            await AsyncStorage.removeItem('userId');
                            router.push('/');
                        } catch (error) {
                            console.error('Error al cerrar sesión:', error);
                            Alert.alert('Error', 'No se pudo cerrar sesión');
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleSaveChanges = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                router.push('/Login1');
                return;
            }

            const endpoint = userId
                ? `${IPS.SERVER_URL}/api/users/${userId}`
                : `${IPS.SERVER_URL}/api/users/me`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editedData)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const updatedData = await response.json();
            setUserData(updatedData);
            setEditMode(false);
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={baseStyles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <Animated.View
                    style={[
                        baseStyles.contentContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        }
                    ]}
                >
                    {loading ? (
                        <View style={baseStyles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[baseStyles.normalText, { marginTop: 15 }]}>
                                Cargando datos del perfil...
                            </Text>
                        </View>
                    ) : error ? (
                        <View style={baseStyles.errorContainer}>
                            <Ionicons name="alert-circle" size={48} color={colors.error} />
                            <Text style={[baseStyles.normalText, { color: colors.error }]}>{error}</Text>
                            <TouchableOpacity
                                style={baseStyles.primaryButton}
                                onPress={fetchUserData}
                                activeOpacity={0.7}
                            >
                                <Text style={baseStyles.primaryButtonText}>Reintentar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* Cabecera del perfil */}
                            <View style={baseStyles.sectionWithBorder}>
                                <View style={localStyles.avatarContainer}>
                                    <View style={[localStyles.avatar, { backgroundColor: colors.primaryLight }]}>
                                        <FontAwesome5 name="user-alt" size={40} color={colors.primary} />
                                    </View>
                                </View>
                                <Text style={baseStyles.title}>{userData?.name}</Text>
                                <Text style={baseStyles.secondaryText}>{userData?.email}</Text>
                            </View>

                            {/* Información del perfil */}
                            <View style={baseStyles.section}>
                                <Text style={baseStyles.subtitle}>Información Personal</Text>

                                {!editMode ? (
                                    <>
                                        <View style={baseStyles.listItem}>
                                            <View style={baseStyles.listItemIcon}>
                                                <Ionicons name="person" size={18} color={colors.primary} />
                                            </View>
                                            <View style={baseStyles.listItemContent}>
                                                <Text style={baseStyles.secondaryText}>Nombre</Text>
                                                <Text style={baseStyles.normalText}>{userData?.name}</Text>
                                            </View>
                                        </View>

                                        <View style={baseStyles.listItem}>
                                            <View style={baseStyles.listItemIcon}>
                                                <Ionicons name="people" size={18} color={colors.primary} />
                                            </View>
                                            <View style={baseStyles.listItemContent}>
                                                <Text style={baseStyles.secondaryText}>Apellido Paterno</Text>
                                                <Text style={baseStyles.normalText}>
                                                    {userData?.lastName || 'No especificado'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={baseStyles.listItem}>
                                            <View style={baseStyles.listItemIcon}>
                                                <Ionicons name="people-outline" size={18} color={colors.primary} />
                                            </View>
                                            <View style={baseStyles.listItemContent}>
                                                <Text style={baseStyles.secondaryText}>Apellido Materno</Text>
                                                <Text style={baseStyles.normalText}>
                                                    {userData?.surname || 'No especificado'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={baseStyles.listItem}>
                                            <View style={baseStyles.listItemIcon}>
                                                <Ionicons name="call" size={18} color={colors.primary} />
                                            </View>
                                            <View style={baseStyles.listItemContent}>
                                                <Text style={baseStyles.secondaryText}>Teléfono</Text>
                                                <Text style={baseStyles.normalText}>
                                                    {userData?.phone || 'No especificado'}
                                                </Text>
                                            </View>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <View style={baseStyles.editField}>
                                            <Text style={baseStyles.editLabel}>Nombre</Text>
                                            <TextInput
                                                style={[baseStyles.editInput, {
                                                    backgroundColor: colors.input,
                                                    borderColor: colors.border,
                                                    color: colors.text
                                                }]}
                                                value={editedData.name}
                                                onChangeText={(text) => setEditedData({ ...editedData, name: text })}
                                                placeholder="Tu nombre"
                                                placeholderTextColor={colors.secondaryText}
                                            />
                                        </View>

                                        <View style={baseStyles.editField}>
                                            <Text style={baseStyles.editLabel}>Teléfono</Text>
                                            <TextInput
                                                style={[baseStyles.editInput, {
                                                    backgroundColor: colors.input,
                                                    borderColor: colors.border,
                                                    color: colors.text
                                                }]}
                                                value={editedData.phone}
                                                onChangeText={(text) => setEditedData({ ...editedData, phone: text })}
                                                placeholder="Tu número de teléfono"
                                                placeholderTextColor={colors.secondaryText}
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    </>
                                )}
                            </View>

                            {/* Botones de acción */}
                            <View style={[baseStyles.section, { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 20 }]}>
                                <TouchableOpacity
                                    style={baseStyles.dangerButton}
                                    onPress={handleLogout}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="log-out-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={baseStyles.dangerButtonText}>Cerrar Sesión</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos específicos que no son parte del sistema de temas
const localStyles = StyleSheet.create({
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 2,
    },
    // Otros estilos específicos de este componente
});