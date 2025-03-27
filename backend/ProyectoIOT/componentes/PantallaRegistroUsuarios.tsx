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
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('success');
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
            const response = await axios.get<SubUsersResponse>('http://192.168.8.6:8082/api/subusers', {
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
                'http://192.168.8.6:8082/api/subusers/register',
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

    const handleDeleteUser = (id: string, userName: string, accessMethod: 'fingerprint' | 'rfid', accessId: string) => {
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
                            setIsLoading(true);
                            const token = await AsyncStorage.getItem('userToken');

                            if (!token) {
                                setMessage('No se encontró el token de autenticación');
                                setMessageType('error');
                                return;
                            }

                            // Si es RFID, eliminar de la colección rfids primero
                            if (accessMethod === 'rfid') {
                                try {
                                    await axios.delete(
                                        `http://192.168.8.6:8082/api/rfids/${accessId}`,
                                        { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    console.log('RFID eliminado de la colección');
                                } catch (rfidError) {
                                    console.warn('Error al eliminar RFID de colección:', rfidError);
                                    // Continuamos aunque falle
                                }
                            }

                            // 1. Eliminar de la base de datos
                            const deleteResponse = await axios.delete(
                                `http://192.168.8.6:8082/api/subusers/${id}`,
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            // 2. Si se elimina correctamente, eliminar del dispositivo físico
                            if (deleteResponse.status === 200) {
                                // El resto del código se mantiene igual
                                if (accessMethod === 'fingerprint') {
                                    try {
                                        await axios.delete(
                                            `http://192.168.8.6/api/arduino/fingerprint/${accessId}`,
                                            { timeout: 5000 }
                                        );
                                        console.log('Huella eliminada del sensor');
                                    } catch (error) {
                                        console.warn('No se pudo eliminar la huella del sensor:', error);
                                    }
                                } else if (accessMethod === 'rfid') {
                                    try {
                                        await axios.delete(
                                            `http://192.168.8.6/api/arduino/rfid/${accessId}`,
                                            { timeout: 5000 }
                                        );
                                        console.log('RFID eliminado del sistema');
                                    } catch (error) {
                                        console.warn('No se pudo eliminar el RFID del sistema:', error);
                                    }
                                }

                                await loadSubUsers();
                                setMessage(`${userName} ha sido eliminado correctamente`);
                                setMessageType('success');
                            }
                        } catch (error) {
                            console.error('Error al eliminar usuario:', error);
                            setMessage('Error al eliminar el usuario');
                            setMessageType('error');
                        } finally {
                            setIsLoading(false);
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
            const userId = await AsyncStorage.getItem('userId'); // Asegurarse de tener esto almacenado

            if (!token) {
                setMessage('No se encontró el token de autenticación');
                setMessageType('error');
                setIsLoading(false);
                return;
            }

            // Si es RFID, guardarlo en la colección rfids
            if (accessMethod === 'rfid') {
                try {
                    // Verificar si el RFID ya existe
                    const checkResponse = await axios.post(
                        'http://192.168.8.6:8082/api/rfids/check',
                        { rfidValue: capturedId },  // Usar rfidValue consistentemente
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    const data = checkResponse.data as { exists: boolean };
                    if (data.exists) {
                        setMessage('Este RFID ya está registrado');
                        setMessageType('error');
                        setIsLoading(false);
                        return;
                    }

                    // Registrar el RFID
                    await axios.post(
                        'http://192.168.8.6:8082/api/rfids/register',
                        {
                            rfidValue: capturedId, // Usar el nombre de campo esperado por el backend
                            userId, // Incluir el ID del usuario
                            userName: name
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } catch (rfidError: any) {
                    if (rfidError.response?.status === 400) {
                        setMessage('Este RFID ya está registrado');
                        setMessageType('error');
                        setIsLoading(false);
                        return;
                    }
                    console.warn('Error al registrar RFID en colección:', rfidError);
                }
            }

            // Crear el subusuario con el método de acceso
            const response = await axios.post<SubUserResponse>(
                'http://192.168.8.6:8082/api/subusers/register',
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
                loadSubUsers();
            }
        } catch (error: any) {
            console.error('Error al registrar usuario:', error);
            setMessage(error.response?.data?.message || 'Error al registrar el usuario');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    // Función para iniciar el proceso de registro de RFID
    const handleRegisterRFID = async () => {
        try {
            setIsLoading(true);

            // 1. Validar que haya un nombre
            if (!name.trim()) {
                setMessage('El nombre es requerido');
                setMessageType('error');
                return;
            }

            // 2. Iniciar la lectura de RFID en el Arduino
            const arduinoResponse = await axios.post(
                'http://192.168.8.6/api/arduino/rfid/read',
                { mode: 'register', userName: name },
                { timeout: 5000 }
            );

            if (arduinoResponse.status === 200) {
                setMessage('Acerca la tarjeta RFID al lector...');
                setMessageType('info');

                // 3. Iniciar polling para verificar cuando se complete la lectura
                const intervalId = setInterval(async () => {
                    try {
                        const statusResponse = await axios.get(
                            'http://192.168.8.6/api/arduino/rfid/status',
                            { timeout: 3000 }
                        );

                        const data = statusResponse.data as { status: string; cardId?: string; message?: string };
                        if (data.status === 'completed' && data.cardId) {
                            clearInterval(intervalId);

                            // 4. RFID leído exitosamente, guardar en la base de datos
                            const rfidValue = (statusResponse.data as { cardId: string }).cardId;

                            // Primero verificar que no exista ya
                            const token = await AsyncStorage.getItem('userToken');
                            const checkResponse = await axios.post(
                                'http://192.168.8.6:8082/api/rfids/check',
                                { rfid: rfidValue },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            const data = checkResponse.data as { exists: boolean };
                            if (data.exists) {
                                setMessage('Esta tarjeta RFID ya está registrada');
                                setMessageType('error');
                                setIsLoading(false);
                                return;
                            }

                            // 5. Guardar RFID en la colección rfids
                            const saveRfidResponse = await axios.post(
                                'http://192.168.8.6:8082/api/rfids/register',
                                { rfidValue: rfidValue },  // Usar rfidValue consistentemente
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            // 6. Crear el subusuario con el RFID como método de acceso
                            const registerResponse = await axios.post(
                                'http://192.168.8.6:8082/api/subusers/register',
                                {
                                    name: name,
                                    accessMethod: 'rfid',
                                    accessId: rfidValue
                                },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            setMessage(`Usuario ${name} registrado con RFID exitosamente`);
                            setMessageType('success');
                            setName('');
                            loadSubUsers(); // Recargar la lista
                        } else if (data.status === 'error') {
                            clearInterval(intervalId);
                            setMessage('Error al leer tarjeta: ' + data.message);
                            setMessageType('error');
                        } else if ((statusResponse.data as { status: string }).status === 'timeout') {
                            clearInterval(intervalId);
                            setMessage('Tiempo de espera agotado');
                            setMessageType('error');
                        }
                        // Si sigue en 'reading', continuamos el polling
                    } catch (error) {
                        clearInterval(intervalId);
                        console.error('Error al verificar estado:', error);
                        setMessage('Error al comunicarse con el lector');
                        setMessageType('error');
                    }
                }, 1000); // Consultar cada segundo

                // Establecer un timeout general por si algo falla
                setTimeout(() => {
                    clearInterval(intervalId);
                    if (isLoading) {
                        setIsLoading(false);
                        setMessage('Tiempo de espera agotado');
                        setMessageType('error');
                    }
                }, 30000); // 30 segundos máximo
            }
        } catch (error) {
            console.error('Error al registrar RFID:', error);
            setMessage('Error al iniciar registro de RFID');
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
                                subUsers.map((user) => (
                                    <View key={user._id} style={styles.userItem}>
                                        <Text style={styles.userName}>{user.name}</Text>
                                        <Text>Método: {user.accessMethod === 'fingerprint' ? 'Huella' : 'RFID'}</Text>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteUser(user._id, user.name, user.accessMethod, user.accessId)}
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
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 12,
    },
});