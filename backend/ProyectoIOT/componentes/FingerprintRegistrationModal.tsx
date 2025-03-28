import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Image, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const arduinoIP = '192.168.8.4'; // Cambia esto por la IP de tu Arduino ESP32

// Interfaces para las respuestas de la API
interface FingerprintRegisterResponse {
    success: boolean;
    fingerprintId: string;
    message?: string;
}

interface FingerprintStatusResponse {
    status: 'idle' | 'step1' | 'step2' | 'error' | 'completed';
    message?: string;
}

// Nueva interfaz para la respuesta del estado del dispositivo
interface DeviceStatusResponse {
    connected: boolean;
    message?: string;
}

interface FingerprintRegistrationModalProps {
    onCaptureComplete: (accessId: string) => void;
    onCancel: () => void;
    userName: string;
}

const FingerprintRegistrationModal = ({
    onCaptureComplete,
    onCancel,
    userName
}: FingerprintRegistrationModalProps) => {
    const [status, setStatus] = useState('idle');
    const [fingerprintId, setFingerprintId] = useState('');
    const [message, setMessage] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [registrationStep, setRegistrationStep] = useState(0);

    // Usar referencias para manejar intervalos y timeouts
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isRegisteringRef = useRef(false);

    // Limpiar recursos cuando el componente se desmonte
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Actualizar la referencia cuando cambie el estado
        isRegisteringRef.current = isRegistering;
    }, [isRegistering]);

    useEffect(() => {
        // Al montar el componente, verificar conexión con dispositivo
        checkDeviceConnection();
    }, []);

    // Cambiar las URLs para que coincidan con las del Arduino
    const checkDeviceConnection = async () => {
        try {
            const response = await axios.get<DeviceStatusResponse>(
                `http://${arduinoIP}/api/arduino/status`
            );

            // Ahora TypeScript sabe que response.data tiene una propiedad connected
            setIsConnected(response.data.connected);

            if (!response.data.connected) {
                setMessage('Dispositivo IoT desconectado');
            }
        } catch (error) {
            console.error('Error verificando estado del dispositivo:', error);
            setIsConnected(false);
            setMessage('Error al verificar estado del dispositivo');
        }
    };

    const startFingerprintRegistration = async () => {
        if (!isConnected) {
            setMessage('Dispositivo IoT no conectado');
            return;
        }

        // Limpiar cualquier intervalo o timeout previo
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setIsRegistering(true);
        setStatus('registering');
        setMessage('Coloque su dedo en el sensor de huella...');
        setRegistrationStep(1);

        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setMessage('No se encontró token de autenticación');
                setIsRegistering(false);
                setStatus('error');
                return;
            }

            // Tipar correctamente la respuesta
            const response = await axios.post<FingerprintRegisterResponse>(
                `http://${arduinoIP}/api/arduino/fingerprint/register`,
                { userName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Ahora TypeScript sabe que response.data tiene una propiedad fingerprintId
            const newFingerprintId = response.data.fingerprintId;

            // Iniciar polling para obtener el resultado del proceso
            pollIntervalRef.current = setInterval(async () => {
                if (!isRegisteringRef.current) {
                    // Si ya no estamos registrando, detener el intervalo
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    return;
                }

                try {
                    // Tipar correctamente la respuesta del polling
                    const pollResponse = await axios.get<FingerprintStatusResponse>(
                        `http://${arduinoIP}/api/arduino/fingerprint/status`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    const registrationStatus = pollResponse.data.status;

                    if (registrationStatus === 'step1') {
                        setMessage('Primera captura completada. Retire su dedo.');
                        setRegistrationStep(2);
                    } else if (registrationStatus === 'step2') {
                        setMessage('Vuelva a colocar su dedo para confirmar...');
                        setRegistrationStep(3);
                    } else if (registrationStatus === 'completed') {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }

                        setFingerprintId(newFingerprintId);
                        setStatus('success');
                        setMessage(`Huella registrada correctamente con ID: ${newFingerprintId}`);
                        setIsRegistering(false);

                        // Esperar un momento antes de cerrar para mostrar el éxito
                        setTimeout(() => {
                            if (newFingerprintId) {
                                onCaptureComplete(newFingerprintId);
                            } else {
                                Alert.alert(
                                    "Error",
                                    "No se pudo obtener el ID de la huella",
                                    [{ text: "OK", onPress: onCancel }]
                                );
                            }
                        }, 2000);
                    } else if (registrationStatus === 'error') {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }

                        setStatus('error');
                        // Manejar de forma segura el mensaje
                        setMessage(`Error en el registro de huella: ${pollResponse.data.message || 'Error desconocido'}`);
                        setIsRegistering(false);
                    } else {
                        // Status desconocido, seguir esperando
                        console.log('Estado de registro desconocido:', registrationStatus);
                    }
                } catch (pollError) {
                    console.error('Error al verificar estado del registro:', pollError);

                    // Manejar errores de polling, pero seguir intentando
                    setMessage('Error al verificar estado. Reintentando...');

                    // Si hay demasiados errores consecutivos, podríamos detener el proceso
                    // Por simplicidad, aquí solo mostramos el mensaje de error
                }
            }, 1000);

            // Establecer un timeout por si el registro tarda demasiado
            timeoutRef.current = setTimeout(() => {
                if (isRegisteringRef.current) {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }

                    setStatus('timeout');
                    setMessage('Tiempo de espera agotado. Intente nuevamente.');
                    setIsRegistering(false);
                }
            }, 60000); // 60 segundos de timeout

        } catch (error: any) {
            console.error('Error al iniciar registro de huella:', error);

            let errorMessage = 'Error al comunicarse con el dispositivo';

            // Manejar la respuesta de error de forma segura
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            setStatus('error');
            setMessage(errorMessage);
            setIsRegistering(false);
        }
    };

    const handleCancel = () => {
        // Limpiar recursos antes de cancelar
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        setIsRegistering(false);
        setStatus('idle');
        setMessage('');
        onCancel();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registro de Huella Digital</Text>

            <View style={styles.contentContainer}>
                {/* Usar try-catch para las imágenes o tener una imagen fallback */}
                {/* <Image
                    source={require('../assets/images/fingerprint.png')}
                    style={styles.image}
                    resizeMode="contain"
                    onError={() => console.warn('Error cargando imagen de huella')}
                /> */}

                <Text style={styles.instruction}>
                    {isRegistering
                        ? getStepInstruction(registrationStep)
                        : "Presione el botón para iniciar el registro de huella"}
                </Text>

                {status === 'registering' && (
                    <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
                )}

                {message && (
                    <Text style={[
                        styles.message,
                        status === 'error' ? styles.errorText :
                            status === 'success' ? styles.successText :
                                styles.infoText
                    ]}>
                        {message}
                    </Text>
                )}
            </View>

            <View style={styles.buttonContainer}>
                {!isRegistering ? (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.primaryButton,
                                !isConnected && styles.buttonDisabled
                            ]}
                            onPress={startFingerprintRegistration}
                            disabled={!isConnected}
                        >
                            <Text style={styles.buttonText}>Registrar Huella</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={handleCancel}
                    >
                        <Text style={styles.buttonText}>Cancelar Registro</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// Función auxiliar para obtener instrucciones según el paso
const getStepInstruction = (step: number) => {
    switch (step) {
        case 1:
            return "Coloque su dedo en el sensor de huella...";
        case 2:
            return "Primera captura completada. Retire su dedo.";
        case 3:
            return "Vuelva a colocar su dedo para confirmar...";
        default:
            return "Siga las instrucciones del dispositivo...";
    }
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    contentContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    image: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    instruction: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    loader: {
        marginVertical: 20,
    },
    message: {
        padding: 10,
        borderRadius: 5,
        textAlign: 'center',
        marginVertical: 10,
    },
    errorText: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
    },
    successText: {
        backgroundColor: '#d4edda',
        color: '#155724',
    },
    infoText: {
        backgroundColor: '#cce5ff',
        color: '#004085',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    button: {
        padding: 12,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#007bff',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonDisabled: {
        backgroundColor: '#cccccc',
        opacity: 0.7,
    },
});

export default FingerprintRegistrationModal;