import React, { useState, useEffect, useRef } from 'react';
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
    Modal,
    Animated,
    Dimensions,
    StatusBar
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RFIDControlModal from './RFIDControlModal';
import FingerprintRegistrationModal from './FingerprintRegistrationModal';
import IPS from '../config/IPS';
import { useAppTheme } from '../hooks/useAppTheme'; // Importar hook de tema

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

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
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Obtener colores y estilos del tema

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

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Animación modal
    const modalScaleAnim = useRef(new Animated.Value(0.8)).current;
    const modalOpacityAnim = useRef(new Animated.Value(0)).current;

    // Animar la entrada del contenido cuando carga la pantalla
    useEffect(() => {
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
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 700,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

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
            const response = await axios.get<SubUsersResponse>(`${IPS.SERVER_URL}/api/subusers`, {
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
                `${IPS.SERVER_URL}/api/subusers/register`,
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

                            // 1. Primero intentamos eliminar del dispositivo físico
                            let deviceDeletionSuccess = false;

                            try {
                                if (accessMethod === 'fingerprint') {
                                    // Eliminar huella del sensor
                                    const deleteFingerprintResponse = await axios.delete(
                                        `${IPS.ESP32_URL}/api/arduino/fingerprint/${accessId}`,
                                        { timeout: 8000 }
                                    );

                                    if (deleteFingerprintResponse.status === 200) {
                                        deviceDeletionSuccess = true;
                                        console.log('Huella eliminada del sensor correctamente');
                                    }
                                } else if (accessMethod === 'rfid') {
                                    // Eliminar RFID del sistema
                                    const deleteRfidResponse = await axios.delete(
                                        `${IPS.ESP32_URL}/api/arduino/rfid/${accessId}`,
                                        { timeout: 8000 }
                                    );

                                    if (deleteRfidResponse.status === 200) {
                                        deviceDeletionSuccess = true;
                                        console.log('RFID eliminado del sistema correctamente');
                                    }
                                }
                            } catch (deviceError) {
                                console.warn(`Error al eliminar del dispositivo físico: ${accessMethod}`, deviceError);
                                // Continuamos con el proceso aunque falle la eliminación del dispositivo
                            }

                            // 2. Si es RFID, eliminar de la colección rfids
                            if (accessMethod === 'rfid') {
                                try {
                                    await axios.delete(
                                        `${IPS.SERVER_URL}/api/rfids/${accessId}`,
                                        { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    console.log('RFID eliminado de la colección correctamente');
                                } catch (rfidError) {
                                    console.warn('Error al eliminar RFID de colección:', rfidError);
                                    // Continuamos aunque falle esta eliminación
                                }
                            }

                            // 3. Eliminar el subusuario de la base de datos
                            const deleteResponse = await axios.delete(
                                `${IPS.SERVER_URL}/api/subusers/${id}`,
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            if (deleteResponse.status === 200) {
                                // Actualizar la lista de usuarios
                                await loadSubUsers();

                                // Mostrar mensaje adecuado según si se eliminó también del dispositivo
                                if (deviceDeletionSuccess) {
                                    setMessage(`${userName} ha sido eliminado completamente del sistema`);
                                } else {
                                    setMessage(`${userName} ha sido eliminado de la base de datos`);
                                }
                                setMessageType('success'); // Aseguramos que el tipo sea 'success' para que aparezca en verde
                            }
                        } catch (error: any) {
                            console.error('Error al eliminar usuario:', error);
                            setMessage(error.response?.data?.message || 'Error al eliminar el usuario');
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
        openModal();
    };

    // Función para abrir el modal con animación
    const openModal = () => {
        setModalVisible(true);
        // Animar la entrada del modal
        Animated.parallel([
            Animated.timing(modalScaleAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(modalOpacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
    };

    // Función para cerrar el modal con animación
    const closeModal = () => {
        // Animar la salida del modal
        Animated.parallel([
            Animated.timing(modalScaleAnim, {
                toValue: 0.8,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(modalOpacityAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            })
        ]).start(() => {
            setModalVisible(false);
        });
    };

    // Función que se llamará cuando se complete el registro en el modal
    const handleAccessIdCapture = (capturedId: string) => {
        setAccessId(capturedId);
        closeModal(); // Cerrar el modal con animación

        // Proceder con el registro usando el ID capturado
        registerUserWithAccessId(capturedId);
    };

    // Función modificada para registrar usuario con el ID capturado
    const registerUserWithAccessId = async (capturedId: string) => {
        setIsLoading(true);
        setMessage('');

        try {
            const token = await AsyncStorage.getItem('userToken');
            const userId = await AsyncStorage.getItem('userId');

            if (!token) {
                setMessage('No se encontró el token de autenticación');
                setMessageType('error');
                setIsLoading(false);
                return;
            }

            // Si es RFID, guardarlo en la colección rfids
            if (accessMethod === 'rfid') {
                try {
                    // Verificar si el RFID ya existe - Corregir parámetro
                    const checkResponse = await axios.post(
                        `${IPS.SERVER_URL}/api/rfids/check`,
                        { rfid: capturedId },  // ← Corregido para usar consistentemente rfid
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    const data = checkResponse.data as { exists: boolean };
                    if (data.exists) {
                        setMessage('Este RFID ya está registrado');
                        setMessageType('error');
                        setIsLoading(false);
                        return;
                    }

                    // Registrar el RFID con parámetros consistentes
                    await axios.post(
                        `${IPS.SERVER_URL}/api/rfids/register`,
                        {
                            rfid: capturedId,  // ← Corregido para usar consistentemente rfid
                            userId,
                            userName: name
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } catch (rfidError: any) {
                    // Si es error 400 de duplicado, continuamos con el registro del subuser
                    // ya que puede ser que el RFID ya esté registrado pero no como subuser
                    if (rfidError.response?.status === 400 &&
                        rfidError.response?.data?.message?.includes('ya está registrado')) {
                        console.warn('RFID ya registrado en colección, continuando con registro de usuario');
                        // Continuamos con el registro del usuario
                    } else {
                        // Para otros errores, detenemos el proceso
                        console.error('Error al registrar RFID:', rfidError);
                        setMessage(rfidError.response?.data?.message || 'Error al registrar RFID');
                        setMessageType('error');
                        setIsLoading(false);
                        return;
                    }
                }
            }

            // Crear el subusuario con el método de acceso
            try {
                const response = await axios.post(
                    `${IPS.SERVER_URL}/api/subusers/register`,
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
            } catch (subUserError: any) {
                // Si ya existe el subuser pero el registro del RFID fue exitoso,
                // mostramos un mensaje específico para este caso
                if (subUserError.response?.status === 400 &&
                    subUserError.response?.data?.message?.includes('Ya existe un usuario')) {
                } else {
                    setMessage(subUserError.response?.data?.message || 'Error al registrar el usuario');
                }
                setMessageType('error');
            }
        } catch (error: any) {
            console.error('Error al registrar usuario:', error);
            setMessage(error.response?.data?.message || 'Error al registrar el usuario');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    // Obtener colores del gradiente para los botones según el tema
    const getButtonGradientColors = (isSecondary = false) => {
        if (isSecondary) {
            return isDarkMode
                ? ['#718096', '#4A5568'] as const // Gris oscuro para tema oscuro
                : ['#718096', '#4A5568'] as const; // Gris para tema claro
        } else {
            return isDarkMode
                ? [colors.primary, '#1e3a8a'] as const // Primario a azul oscuro para tema oscuro
                : [colors.primary, '#2C5282'] as const; // Primario a azul medio para tema claro
        }
    };

    const getDeleteButtonGradientColors = () => {
        return isDarkMode
            ? ['#F56565', '#C53030'] as const // Rojo para tema oscuro
            : ['#F56565', '#C53030'] as const; // Rojo para tema claro
    };

    // Función para renderizar el icono según el método de acceso
    const renderMethodIcon = (method: 'fingerprint' | 'rfid') => {
        if (method === 'fingerprint') {
            return (
                <View style={[localStyles.userMethodIcon, {
                    backgroundColor: isDarkMode
                        ? 'rgba(104, 211, 145, 0.2)'
                        : '#C6F6D5'
                }]}>
                    <Ionicons
                        name="finger-print"
                        size={18}
                        color={isDarkMode ? '#68D391' : '#38A169'}
                    />
                </View>
            );
        } else {
            return (
                <View style={[localStyles.userMethodIcon, {
                    backgroundColor: isDarkMode
                        ? 'rgba(99, 179, 237, 0.2)'
                        : '#BEE3F8'
                }]}>
                    <MaterialCommunityIcons
                        name="card-account-details"
                        size={18}
                        color={isDarkMode ? '#63B3ED' : '#3182CE'}
                    />
                </View>
            );
        }
    };

    return (
        <SafeAreaView style={baseStyles.screen}>
            <StatusBar
                backgroundColor={isDarkMode ? colors.background : '#FFFFFF'}
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            />
            <ScrollView style={{ flex: 1 }}>
                <View style={baseStyles.contentContainer}>
                    <Animated.View
                        style={[
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <TouchableOpacity
                            style={localStyles.backButton}
                            onPress={handleVolver}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color={colors.primary}
                            />
                            <Text style={[localStyles.backButtonText, { color: colors.primary }]}>
                                Volver
                            </Text>
                        </TouchableOpacity>

                        <Text style={[localStyles.sectionTitle, {
                            color: colors.text,
                            borderBottomColor: colors.primary
                        }]}>Gestión de Usuarios</Text>
                        <Text style={[localStyles.subtitle, { color: colors.secondaryText }]}>
                            Administre los usuarios que pueden acceder a su sistema
                        </Text>

                        <View style={localStyles.formSection}>
                            <Text style={[localStyles.formSectionTitle, { color: colors.text }]}>
                                Registrar Nuevo Usuario
                            </Text>

                            <View style={localStyles.inputGroup}>
                                <Text style={[localStyles.label, { color: colors.secondaryText }]}>
                                    Nombre del usuario
                                </Text>
                                <View style={localStyles.inputContainer}>
                                    <View style={[localStyles.inputIconContainer, {
                                        backgroundColor: isDarkMode
                                            ? colors.primaryLight + '40'
                                            : colors.primaryLight
                                    }]}>
                                        <Ionicons name="person-outline" size={18} color={colors.primary} />
                                    </View>
                                    <TextInput
                                        style={[localStyles.input, {
                                            backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                            borderColor: colors.border,
                                            color: colors.text
                                        }]}
                                        placeholder="Ej: Juan Pérez"
                                        placeholderTextColor={isDarkMode ? '#718096' : '#A0AEC0'}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>

                            <Text style={[localStyles.label, { color: colors.secondaryText }]}>
                                Método de acceso
                            </Text>
                            <View style={[localStyles.methodSelector, {
                                borderColor: colors.border,
                                backgroundColor: isDarkMode ? colors.card : '#F7FAFC'
                            }]}>
                                <TouchableOpacity
                                    style={[
                                        localStyles.methodOption,
                                        accessMethod === 'fingerprint' && [
                                            localStyles.methodSelected,
                                            { backgroundColor: colors.primary }
                                        ]
                                    ]}
                                    onPress={() => setAccessMethod('fingerprint')}
                                >
                                    <Ionicons
                                        name="finger-print"
                                        size={20}
                                        color={accessMethod === 'fingerprint' ? '#FFFFFF' : colors.secondaryText}
                                    />
                                    <Text style={[
                                        localStyles.methodText,
                                        { color: accessMethod === 'fingerprint' ? '#FFFFFF' : colors.secondaryText }
                                    ]}>
                                        Huella Dactilar
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        localStyles.methodOption,
                                        accessMethod === 'rfid' && [
                                            localStyles.methodSelected,
                                            { backgroundColor: colors.primary }
                                        ]
                                    ]}
                                    onPress={() => setAccessMethod('rfid')}
                                >
                                    <MaterialCommunityIcons
                                        name="card-account-details"
                                        size={20}
                                        color={accessMethod === 'rfid' ? '#FFFFFF' : colors.secondaryText}
                                    />
                                    <Text style={[
                                        localStyles.methodText,
                                        { color: accessMethod === 'rfid' ? '#FFFFFF' : colors.secondaryText }
                                    ]}>
                                        Tarjeta RFID
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[
                                    localStyles.buttonContainer,
                                    {
                                        shadowOpacity: isDarkMode ? 0.2 : 0.15,
                                        elevation: isDarkMode ? 3 : 2
                                    }
                                ]}
                                onPress={startRegistration}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={getButtonGradientColors()}
                                    style={localStyles.button}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <>
                                            <ActivityIndicator size="small" color="#FFFFFF" style={localStyles.buttonIcon} />
                                            <Text style={localStyles.buttonText}>Procesando...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={accessMethod === 'fingerprint' ? "finger-print" : "card-outline"}
                                                size={20}
                                                color="#FFFFFF"
                                                style={localStyles.buttonIcon}
                                            />
                                            <Text style={localStyles.buttonText}>
                                                {accessMethod === 'fingerprint' ? 'Registrar Huella' : 'Registrar Tarjeta RFID'}
                                            </Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {message ? (
                                <View style={[
                                    localStyles.messageContainer,
                                    messageType === 'success'
                                        ? {
                                            backgroundColor: isDarkMode ? 'rgba(56, 161, 105, 0.1)' : '#F0FFF4',
                                            borderColor: isDarkMode ? 'rgba(104, 211, 145, 0.5)' : '#C6F6D5'
                                        }
                                        : messageType === 'error'
                                            ? {
                                                backgroundColor: isDarkMode ? 'rgba(229, 62, 62, 0.1)' : '#FFF5F5',
                                                borderColor: isDarkMode ? 'rgba(252, 129, 129, 0.5)' : '#FED7D7'
                                            }
                                            : {
                                                backgroundColor: isDarkMode ? 'rgba(66, 153, 225, 0.1)' : '#EBF8FF',
                                                borderColor: isDarkMode ? 'rgba(99, 179, 237, 0.5)' : '#BEE3F8'
                                            }
                                ]}>
                                    <Feather
                                        name={
                                            messageType === 'success'
                                                ? 'check-circle'
                                                : messageType === 'error'
                                                    ? 'alert-triangle'
                                                    : 'info'
                                        }
                                        size={20}
                                        color={
                                            messageType === 'success'
                                                ? (isDarkMode ? '#68D391' : '#38A169')
                                                : messageType === 'error'
                                                    ? (isDarkMode ? '#FC8181' : '#E53E3E')
                                                    : (isDarkMode ? '#63B3ED' : '#3182CE')
                                        }
                                        style={localStyles.messageIcon}
                                    />
                                    <Text style={[
                                        localStyles.messageText,
                                        {
                                            color: messageType === 'success'
                                                ? (isDarkMode ? '#68D391' : '#38A169')
                                                : messageType === 'error'
                                                    ? (isDarkMode ? '#FC8181' : '#E53E3E')
                                                    : (isDarkMode ? '#63B3ED' : '#3182CE')
                                        }
                                    ]}>
                                        {message}
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        <View style={[localStyles.sectionDivider, { backgroundColor: colors.divider }]} />

                        <View style={localStyles.usersSection}>
                            <View style={localStyles.usersSectionHeader}>
                                <Text style={[localStyles.usersSectionTitle, { color: colors.text }]}>
                                    Usuarios Registrados
                                </Text>
                                <TouchableOpacity
                                    style={[localStyles.refreshIconButton, {
                                        backgroundColor: isDarkMode
                                            ? colors.primaryLight + '40'
                                            : colors.primaryLight
                                    }]}
                                    onPress={loadSubUsers}
                                    disabled={isLoadingUsers}
                                >
                                    {isLoadingUsers ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Ionicons
                                            name="refresh"
                                            size={20}
                                            color={colors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {isLoadingUsers && !subUsers.length ? (
                                <View style={[localStyles.loadingContainer, {
                                    backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                    borderColor: colors.border
                                }]}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={[localStyles.loadingText, { color: colors.secondaryText }]}>
                                        Cargando usuarios...
                                    </Text>
                                </View>
                            ) : (
                                subUsers.length > 0 ? (
                                    <View style={localStyles.usersList}>
                                        {subUsers.map((user) => (
                                            <View
                                                key={user._id}
                                                style={[localStyles.userCard, {
                                                    backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                                    borderColor: colors.border
                                                }]}
                                            >
                                                <View style={localStyles.userInfo}>
                                                    <View style={localStyles.userHeader}>
                                                        {renderMethodIcon(user.accessMethod)}
                                                        <Text style={[localStyles.userName, { color: colors.text }]}>
                                                            {user.name}
                                                        </Text>
                                                    </View>
                                                    <Text style={[localStyles.userIdText, { color: colors.secondaryText }]}>
                                                        ID: {user.accessId.substring(0, 8)}
                                                        {user.accessId.length > 8 ? '...' : ''}
                                                    </Text>
                                                </View>

                                                <TouchableOpacity
                                                    style={[
                                                        localStyles.deleteButtonContainer,
                                                        {
                                                            shadowOpacity: isDarkMode ? 0.2 : 0.15,
                                                            elevation: isDarkMode ? 3 : 2
                                                        }
                                                    ]}
                                                    onPress={() => handleDeleteUser(
                                                        user._id,
                                                        user.name,
                                                        user.accessMethod,
                                                        user.accessId
                                                    )}
                                                    disabled={isLoading}
                                                    activeOpacity={0.8}
                                                >
                                                    <LinearGradient
                                                        colors={getDeleteButtonGradientColors()}
                                                        style={localStyles.deleteButton}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                    >
                                                        <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={[localStyles.emptyContainer, {
                                        backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                        borderColor: colors.border
                                    }]}>
                                        <View style={[localStyles.emptyIconContainer, {
                                            backgroundColor: isDarkMode
                                                ? 'rgba(160, 174, 192, 0.1)'
                                                : '#EDF2F7',
                                        }]}>
                                            <Ionicons name="people" size={40} color={colors.secondaryText} />
                                        </View>
                                        <Text style={[localStyles.emptyTitle, { color: colors.text }]}>
                                            No hay usuarios registrados
                                        </Text>
                                        <Text style={[localStyles.emptyText, { color: colors.secondaryText }]}>
                                            Registre nuevos usuarios para permitirles acceso al sistema
                                        </Text>
                                    </View>
                                )
                            )}
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>

            {/* Modal para registro de RFID o Huella */}
            <Modal
                animationType="none"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={closeModal}
            >
                <View style={localStyles.modalBackground}>
                    <Animated.View
                        style={[
                            localStyles.modalContainer,
                            {
                                backgroundColor: isDarkMode ? colors.background : '#FFFFFF',
                                borderColor: colors.border,
                                opacity: modalOpacityAnim,
                                transform: [{ scale: modalScaleAnim }]
                            }
                        ]}
                    >
                        {accessMethod === 'rfid' ? (
                            <RFIDControlModal
                                onCaptureComplete={handleAccessIdCapture}
                                onCancel={closeModal}
                            />
                        ) : (
                            <FingerprintRegistrationModal
                                onCaptureComplete={handleAccessIdCapture}
                                onCancel={closeModal}
                                userName={name}
                            />
                        )}
                    </Animated.View>
                </View>
            </Modal>

            {/* Indicador de carga global */}
            {isLoading && !isModalVisible && (
                <View style={localStyles.globalLoaderContainer}>
                    <View style={[localStyles.globalLoader, {
                        backgroundColor: isDarkMode ? colors.background : '#FFFFFF'
                    }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[localStyles.loaderText, { color: colors.text }]}>
                            Procesando...
                        </Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

// Estilos locales
const localStyles = StyleSheet.create({
    sectionTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 8,
        borderBottomWidth: 3,
        paddingBottom: 12,
        width: '65%',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
        lineHeight: 22,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    formSection: {
        marginBottom: 30,
    },
    formSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    methodSelector: {
        flexDirection: 'row',
        borderRadius: 10,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 24,
    },
    methodOption: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    methodSelected: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    methodText: {
        fontWeight: '500',
        marginLeft: 8,
    },
    buttonContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonIcon: {
        marginRight: 8,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        marginTop: 16,
    },
    messageIcon: {
        marginRight: 10,
    },
    messageText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    sectionDivider: {
        height: 1,
        marginVertical: 24,
    },
    usersSection: {
        marginBottom: 20,
    },
    usersSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    usersSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    refreshIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    usersList: {
        marginTop: 10,
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 10,
    },
    userInfo: {
        flex: 1,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    userMethodIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    userIdText: {
        fontSize: 13,
        marginLeft: 40, // Alineado con el nombre
    },
    deleteButtonContainer: {
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: "#E53E3E",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    deleteButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        padding: 40,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    emptyContainer: {
        padding: 30,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    emptyIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    globalLoaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    globalLoader: {
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        minWidth: 150,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    loaderText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '500',
    },
});