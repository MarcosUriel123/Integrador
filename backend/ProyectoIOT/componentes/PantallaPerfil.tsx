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
    Dimensions,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from './Header';
import Footer from './Footer';
import BotonVolver from './BotonVolver';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

// Tipo para los datos del usuario
interface UserData {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    createdAt: string;
}

interface PantallaPerfilProps {
    userId?: string;
}

export default function PantallaPerfil({ userId }: PantallaPerfilProps) {
    const router = useRouter();
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
                ? `http://192.168.1.133:8082/api/users/${userId}`
                : 'http://192.168.1.133:8082/api/users/me';

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
                phoneNumber: data.phoneNumber || '',
                address: data.address || ''
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
                ? `http://192.168.1.133:8082/api/users/${userId}`
                : 'http://192.168.1.133:8082/api/users/me';

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
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Mi Perfil" />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/" />
                    </View>

                    <Animated.View
                        style={[
                            styles.profileSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3182CE" />
                                <Text style={styles.loadingText}>Cargando datos del perfil...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={48} color="#FC8181" />
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={fetchUserData}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.retryButtonText}>Reintentar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {/* Cabecera del perfil */}
                                <View style={styles.profileHeader}>
                                    <View style={styles.avatarContainer}>
                                        <View style={styles.avatar}>
                                            <FontAwesome5 name="user-alt" size={40} color="#3182CE" />
                                        </View>
                                    </View>
                                    <Text style={styles.userName}>{userData?.name}</Text>
                                    <Text style={styles.userEmail}>{userData?.email}</Text>

                                    <View style={styles.memberSinceContainer}>
                                        <Text style={styles.memberSinceText}>
                                            Miembro desde: {userData?.createdAt
                                                ? new Date(userData.createdAt).toLocaleDateString()
                                                : 'Fecha no disponible'
                                            }
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* Información del perfil */}
                                <View style={styles.profileInfo}>
                                    <Text style={styles.sectionTitle}>Información Personal</Text>

                                    {!editMode ? (
                                        <>
                                            <View style={styles.infoItem}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="person" size={18} color="#3182CE" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>Nombre</Text>
                                                    <Text style={styles.infoValue}>{userData?.name}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.infoItem}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="mail" size={18} color="#3182CE" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>Correo electrónico</Text>
                                                    <Text style={styles.infoValue}>{userData?.email}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.infoItem}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="call" size={18} color="#3182CE" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>Teléfono</Text>
                                                    <Text style={styles.infoValue}>
                                                        {userData?.phoneNumber || 'No especificado'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.infoItem}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="location" size={18} color="#3182CE" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>Dirección</Text>
                                                    <Text style={styles.infoValue}>
                                                        {userData?.address || 'No especificada'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            <View style={styles.editField}>
                                                <Text style={styles.editLabel}>Nombre</Text>
                                                <TextInput
                                                    style={styles.editInput}
                                                    value={editedData.name}
                                                    onChangeText={(text) => setEditedData({ ...editedData, name: text })}
                                                    placeholder="Tu nombre"
                                                />
                                            </View>

                                            <View style={styles.editField}>
                                                <Text style={styles.editLabel}>Correo electrónico</Text>
                                                <TextInput
                                                    style={styles.editInput}
                                                    value={editedData.email}
                                                    onChangeText={(text) => setEditedData({ ...editedData, email: text })}
                                                    placeholder="Tu correo electrónico"
                                                    keyboardType="email-address"
                                                />
                                            </View>

                                            <View style={styles.editField}>
                                                <Text style={styles.editLabel}>Teléfono</Text>
                                                <TextInput
                                                    style={styles.editInput}
                                                    value={editedData.phoneNumber}
                                                    onChangeText={(text) => setEditedData({ ...editedData, phoneNumber: text })}
                                                    placeholder="Tu número de teléfono"
                                                    keyboardType="phone-pad"
                                                />
                                            </View>

                                            <View style={styles.editField}>
                                                <Text style={styles.editLabel}>Dirección</Text>
                                                <TextInput
                                                    style={styles.editInput}
                                                    value={editedData.address}
                                                    onChangeText={(text) => setEditedData({ ...editedData, address: text })}
                                                    placeholder="Tu dirección"
                                                />
                                            </View>
                                        </>
                                    )}
                                </View>

                                {/* Botones de acción */}
                                <View style={styles.actionButtonsContainer}>
                                    {!editMode ? (
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => setEditMode(true)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                            <Text style={styles.editButtonText}>Editar Perfil</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.editModeButtons}>
                                            <TouchableOpacity
                                                style={styles.cancelButton}
                                                onPress={() => {
                                                    setEditMode(false);
                                                    // Restaurar datos originales
                                                    if (userData) {
                                                        setEditedData({
                                                            name: userData.name,
                                                            email: userData.email,
                                                            phoneNumber: userData.phoneNumber || '',
                                                            address: userData.address || ''
                                                        });
                                                    }
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.saveButton}
                                                onPress={handleSaveChanges}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.saveButtonText}>Guardar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={styles.logoutButton}
                                        onPress={handleLogout}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="log-out-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </Animated.View>

                    <Footer />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    cardContainer: {
        padding: 20,
    },
    buttonBackContainer: {
        marginBottom: 15,
        marginTop: 5,
    },
    profileSection: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 22,
        shadowColor: "rgba(0,0,0,0.2)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        marginBottom: 25,
        marginTop: 15,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        marginVertical: 10,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#4A5568',
        fontWeight: '500',
    },
    errorContainer: {
        padding: 22,
        backgroundColor: '#FFF5F5',
        borderRadius: 16,
        borderLeftWidth: 5,
        borderLeftColor: '#FC8181',
        marginVertical: 10,
        alignItems: 'center',
    },
    errorText: {
        color: '#C53030',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.3,
        marginVertical: 10,
    },
    retryButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 10,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EBF8FF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "rgba(66,153,225,0.2)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 3,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#4A5568',
        marginBottom: 12,
    },
    memberSinceContainer: {
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    memberSinceText: {
        color: '#3182CE',
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 20,
    },
    profileInfo: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    infoIconContainer: {
        backgroundColor: '#EBF8FF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#2D3748',
    },
    editField: {
        marginBottom: 16,
    },
    editLabel: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 4,
    },
    editInput: {
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    actionButtonsContainer: {
        marginTop: 10,
    },
    editButton: {
        backgroundColor: '#3182CE',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    editButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    editModeButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    cancelButton: {
        backgroundColor: '#F7FAFC',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flex: 0.48,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#4A5568',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#38A169',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        flex: 0.48,
        alignItems: 'center',
        shadowColor: "rgba(56,161,105,0.4)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#FC8181',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: "rgba(252,129,129,0.4)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});