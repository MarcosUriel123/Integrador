import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Image, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración del Arduino - Reemplaza con la IP real de tu Arduino
const arduinoIP = '192.168.8.8'; // Cambia esto por la IP de tu Arduino ESP32

// Interfaces para las respuestas de la API
interface DeviceStatusResponse {
    connected: boolean;
    message?: string;
}

interface RFIDReadResponse {
    success: boolean;
    message?: string;
}

interface RFIDStatusResponse {
    status: 'idle' | 'reading' | 'completed' | 'error';
    cardId?: string;
    message?: string;
}

interface RFIDControlModalProps {
    onCaptureComplete: (accessId: string) => void;
    onCancel: () => void;
}

const RFIDControlModal = ({ onCaptureComplete, onCancel }: RFIDControlModalProps) => {
    const [status, setStatus] = useState('idle');
    const [cardId, setCardId] = useState('');
    const [message, setMessage] = useState('');
    const [isReading, setIsReading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Referencias para manejar intervalos y timeouts
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const statusRef = useRef('idle');

    // Actualizar la referencia cuando cambie el estado
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

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
        // Al montar el componente, verificar conexión con dispositivo
        checkDeviceConnection();
    }, []);

    const checkDeviceConnection = async () => {
        try {
            // Actualización: Usar la IP del Arduino directamente
            const response = await axios.get<DeviceStatusResponse>(
                `http://${arduinoIP}/api/arduino/status`
            );

            setIsConnected(response.data.connected);
            if (!response.data.connected) {
                setMessage('Dispositivo IoT desconectado');
            }
        } catch (error) {
            console.error('Error verificando estado del dispositivo:', error);
            setIsConnected(false);
            setMessage('Error al verificar estado del dispositivo. Compruebe que el Arduino está conectado a la red.');
        }
    };

    const startRFIDReading = async () => {
        if (!isConnected) {
            setMessage('Dispositivo IoT no conectado');
            return;
        }

        // Limpiar cualquier intervalo o timeout previo
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        setIsReading(true);
        setStatus('reading');
        setMessage('Acerque la tarjeta RFID al lector...');

        try {
            const token = await AsyncStorage.getItem('userToken');

            // Actualización: Usar la IP del Arduino directamente
            await axios.post<RFIDReadResponse>(
                `http://${arduinoIP}/api/arduino/rfid/read`,
                {},
                token ? { headers: { Authorization: `Bearer ${token}` } } : {}
            );

            // Iniciar polling para obtener el resultado
            pollIntervalRef.current = setInterval(async () => {
                try {
                    // Actualización: Usar la IP del Arduino directamente
                    const pollResponse = await axios.get<RFIDStatusResponse>(
                        `http://${arduinoIP}/api/arduino/rfid/status`,
                        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
                    );

                    if (pollResponse.data.status === 'completed' && pollResponse.data.cardId) {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }

                        const capturedCardId = pollResponse.data.cardId;
                        setCardId(capturedCardId);
                        setStatus('success');
                        setMessage(`Tarjeta leída correctamente: ${capturedCardId}`);
                        setIsReading(false);

                        // Esperar un momento antes de cerrar para mostrar el éxito
                        setTimeout(() => {
                            onCaptureComplete(capturedCardId);
                        }, 1500);
                    } else if (pollResponse.data.status === 'error') {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }

                        setStatus('error');
                        setMessage(`Error en la lectura: ${pollResponse.data.message || 'Error desconocido'}`);
                        setIsReading(false);
                    }
                } catch (pollError) {
                    console.error('Error al verificar estado de lectura:', pollError);
                    // No detener el polling por un solo error
                }
            }, 1000); // Verificar cada segundo

            // Establecer un timeout por si la lectura tarda demasiado
            timeoutRef.current = setTimeout(() => {
                if (statusRef.current === 'reading') {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }

                    setStatus('timeout');
                    setMessage('Tiempo de espera agotado. Intente nuevamente.');
                    setIsReading(false);
                }
            }, 30000); // 30 segundos de timeout

        } catch (error: any) {
            console.error('Error al iniciar lectura RFID:', error);

            let errorMessage = 'Error al comunicarse con el dispositivo';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message && error.message.includes('Network Error')) {
                errorMessage = 'Error de red: No se puede conectar con el dispositivo Arduino';
            }

            setStatus('error');
            setMessage(errorMessage);
            setIsReading(false);
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

        setIsReading(false);
        setStatus('idle');
        setMessage('');
        onCancel();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registro de Tarjeta RFID</Text>

            <View style={styles.contentContainer}>
                {/* <Image
                    source={require('../assets/images/rfid-card.png')}
                    style={styles.image}
                    resizeMode="contain"
                    onError={() => console.warn('Error cargando imagen RFID')}
                /> */}

                <Text style={styles.instruction}>
                    {isReading
                        ? "Acerque la tarjeta RFID al lector..."
                        : "Presione el botón para iniciar la lectura de la tarjeta RFID"}
                </Text>

                {status === 'reading' && (
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
                {!isReading ? (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.primaryButton,
                                !isConnected && styles.buttonDisabled
                            ]}
                            onPress={startRFIDReading}
                            disabled={!isConnected}
                        >
                            <Text style={styles.buttonText}>Leer Tarjeta RFID</Text>
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
                        <Text style={styles.buttonText}>Cancelar Lectura</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Los estilos existentes
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
        width: 200,
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
    buttonDisabled: {
        backgroundColor: '#cccccc',
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default RFIDControlModal;