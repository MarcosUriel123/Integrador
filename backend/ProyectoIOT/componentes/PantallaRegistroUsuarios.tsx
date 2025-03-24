import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons'; // Importamos FontAwesome5 para el ícono de volver
import Header from './Header';
import Footer from './Footer';
import RFIDControlModal from './RFIDControlModal';
import FingerprintRegistrationModal from './FingerprintRegistrationModal';

interface SubUser {
    _id: string;
    name: string;
    accessMethod: 'fingerprint' | 'rfid';
    accessId: string;
    isActive: boolean;
}

// Define la estructura de la respuesta esperada
interface SubUsersResponse {
    subUsers: SubUser[];
}

interface SubUserResponse {
    message: string;
    subUser: SubUser;
}

interface MessageResponse {
    message: string;
}

export default function PantallaRegistroUsuarios() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [accessMethod, setAccessMethod] = useState<'fingerprint' | 'rfid'>('fingerprint');
    const [accessId, setAccessId] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [isLoading, setIsLoading] = useState(false);
    const [subUsers, setSubUsers] = useState<SubUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Estado para controlar el modal
    const [isModalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        loadSubUsers();
    }, []);

    // Función para manejar el botón volver
    const handleVolver = () => {
        router.back(); // Navega hacia atrás en el historial
    };

    const loadSubUsers = async () => {
        try {
            setIsLoadingUsers(true);
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                setMessage('No se encontró el token de autenticación');
                setMessageType('error');
                return;
            }

            // Usar tipo genérico para la respuesta
            const response = await axios.get<SubUsersResponse>('http://192.168.8.3:8082/api/subusers', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                setSubUsers(response.data.subUsers);
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            setMessage('Error al cargar la lista de usuarios');
            setMessageType('error');
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleRegisterUser = async () => {
        // Validaciones
        if (!name.trim()) {
            setMessage('El nombre es requerido');
            setMessageType('error');
            return;
        }

        if (!accessId.trim()) {
            setMessage('El ID de acceso es requerido');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                setMessage('No se encontró el token de autenticación');
                setMessageType('error');
                setIsLoading(false);
                return;
            }

            // Usar tipo genérico para la respuesta
            const response = await axios.post<SubUserResponse>(
                'http://192.168.8.3:8082/api/subusers/register',
                {
                    name,
                    accessMethod,
                    accessId
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 201) {
                setMessage('Usuario registrado exitosamente');
                setMessageType('success');
                setName('');
                setAccessId('');
                loadSubUsers(); // Recargar la lista
            }
        } catch (error: any) {
            console.error('Error al registrar usuario:', error);
            if (error.response && error.response.data && error.response.data.message) {
                setMessage(error.response.data.message);
            } else {
                setMessage('Error al registrar el usuario');
            }
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = (id: string, userName: string) => {
        Alert.alert(
            "Eliminar usuario",
            `¿Estás seguro que deseas eliminar a ${userName}?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');

                            if (!token) {
                                setMessage('No se encontró el token de autenticación');
                                setMessageType('error');
                                return;
                            }

                            // Usar tipo genérico para la respuesta
                            const response = await axios.delete<MessageResponse>(`http://192.168.8.3:8082/api/subusers/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            if (response.status === 200) {
                                setMessage('Usuario eliminado exitosamente');
                                setMessageType('success');
                                loadSubUsers();
                            }
                        } catch (error) {
                            console.error('Error al eliminar usuario:', error);
                            setMessage('Error al eliminar el usuario');
                            setMessageType('error');
                        }
                    }
                }
            ]
        );
    };

    const toggleAccessMethod = () => {
        setAccessMethod(prev => prev === 'fingerprint' ? 'rfid' : 'fingerprint');
        setAccessId(''); // Limpiar el ID al cambiar el método
    };

    // Función para iniciar el proceso de registro
    const startRegistration = () => {
        // Validar que el nombre exista
        if (!name.trim()) {
            setMessage('El nombre es requerido');
            setMessageType('error');
            return;
        }

        // Mostrar modal según el método seleccionado
        setModalVisible(true);
    };

    // Función que se llamará cuando se complete el registro en el modal
    const handleAccessIdCapture = (capturedId: string) => {
        setAccessId(capturedId);
        setModalVisible(false); // Cerrar el modal

        // Proceder con el registro usando el ID capturado
        registerUserWithAccessId(capturedId);
    };

    // Función modificada para registrar usuario con el ID capturado
    const registerUserWithAccessId = async (capturedId: string) => {
        setIsLoading(true);
        setMessage('');

        try {
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                setMessage('No se encontró el token de autenticación');
                setMessageType('error');
                setIsLoading(false);
                return;
            }

            // Usar tipo genérico para la respuesta
            const response = await axios.post<SubUserResponse>(
                'http://192.168.8.3:8082/api/subusers/register',
                {
                    name,
                    accessMethod,
                    accessId: capturedId
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 201) {
                setMessage('Usuario registrado exitosamente');
                setMessageType('success');
                setName('');
                setAccessId('');
                loadSubUsers(); // Recargar la lista
            }
        } catch (error: any) {
            console.error('Error al registrar usuario:', error);
            if (error.response && error.response.data && error.response.data.message) {
                setMessage(error.response.data.message);
            } else {
                setMessage('Error al registrar el usuario');
            }
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    {/* Botón Volver - similar al de PantallaLogin1 */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleVolver}
                    >
                        <FontAwesome5 name="arrow-left" size={20} color="#007BFF" />
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Registro de Usuarios</Text>
                    <Text style={styles.subtitle}>Agregue usuarios que pueden acceder a su puerta</Text>

                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Nombre del usuario</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Juan Pérez"
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Método de acceso</Text>
                        <TouchableOpacity
                            style={styles.methodSelector}
                            onPress={toggleAccessMethod}
                        >
                            <View style={[styles.methodOption, accessMethod === 'fingerprint' && styles.methodSelected]}>
                                <Text style={[styles.methodText, accessMethod === 'fingerprint' && styles.methodTextSelected]}>
                                    Huella Dactilar
                                </Text>
                            </View>
                            <View style={[styles.methodOption, accessMethod === 'rfid' && styles.methodSelected]}>
                                <Text style={[styles.methodText, accessMethod === 'rfid' && styles.methodTextSelected]}>
                                    Tarjeta RFID
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Botón para iniciar el registro */}
                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={startRegistration}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Procesando...' : accessMethod === 'fingerprint' ? 'Registrar Huella' : 'Registrar Tarjeta RFID'}
                            </Text>
                        </TouchableOpacity>

                        {message ? (
                            <Text style={[
                                styles.message,
                                messageType === 'success' ? styles.successMessage : styles.errorMessage
                            ]}>
                                {message}
                            </Text>
                        ) : null}
                    </View>

                    {/* Modal para registro de RFID o Huella */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={isModalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                {accessMethod === 'rfid' ? (
                                    <RFIDControlModal
                                        onCaptureComplete={handleAccessIdCapture}
                                        onCancel={() => setModalVisible(false)}
                                    />
                                ) : (
                                    <FingerprintRegistrationModal
                                        onCaptureComplete={handleAccessIdCapture}
                                        onCancel={() => setModalVisible(false)}
                                        userName={name}
                                    />
                                )}
                            </View>
                        </View>
                    </Modal>

                    <View style={styles.usersListContainer}>
                        <Text style={styles.listTitle}>Usuarios Registrados</Text>

                        {isLoadingUsers ? (
                            <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
                        ) : (
                            subUsers.length > 0 ? (
                                subUsers.map(user => (
                                    <View style={styles.userCard} key={user._id}>
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{user.name}</Text>
                                            <Text style={styles.userDetail}>
                                                {user.accessMethod === 'fingerprint' ? '👆 Huella' : '🔖 RFID'}
                                                • ID: {user.accessId}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteUser(user._id, user.name)}
                                        >
                                            <Text style={styles.deleteButtonText}>Eliminar</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyList}>
                                    No hay usuarios registrados
                                </Text>
                            )
                        )}

                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={loadSubUsers}
                        >
                            <Text style={styles.refreshButtonText}>Actualizar Lista</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Extender los estilos existentes con los nuevos necesarios para el modal
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
    },
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    topBar: {
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007bff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    formContainer: {
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    methodSelector: {
        flexDirection: 'row',
        marginBottom: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
    },
    methodOption: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    methodSelected: {
        backgroundColor: '#007bff',
    },
    methodText: {
        fontWeight: '500',
    },
    methodTextSelected: {
        color: 'white',
    },
    button: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        backgroundColor: '#b3d7ff',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    message: {
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        textAlign: 'center',
    },
    successMessage: {
        backgroundColor: '#d4edda',
        color: '#155724',
    },
    errorMessage: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
    },
    usersListContainer: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 20,
    },
    listTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    loader: {
        marginVertical: 20,
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    userDetail: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyList: {
        textAlign: 'center',
        padding: 20,
        fontStyle: 'italic',
        color: '#666',
    },
    refreshButton: {
        backgroundColor: '#6c757d',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    refreshButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    // Estilos para el botón Volver
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        color: '#007BFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});