import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Image, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración del Arduino - Reemplaza con la IP real de tu Arduino
const arduinoIP = '192.168.8.10'; // Cambia esto por la IP de tu Arduino ESP32

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
    const [arduinoIPStatus, setArduinoIPStatus] = useState('Verificando...');

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
        verifyArduinoIP();
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

    const verifyArduinoIP = async () => {
        try {
            // Mostrar la IP actual que estamos usando
            setArduinoIPStatus(`Usando IP: ${arduinoIP}`);

            // Verificar si podemos acceder al ESP32
            const response = await axios.get(`http://${arduinoIP}/api/arduino/ping`, { timeout: 3000 });
            if (response.status === 200) {
                setArduinoIPStatus(`Conectado a IP: ${arduinoIP}`);
                setIsConnected(true);
            }
        } catch (error) {
            console.error('Error verificando IP del Arduino:', error);
            setArduinoIPStatus(`Error conectando a ${arduinoIP}. Verifique la IP correcta.`);
            setIsConnected(false);
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

        try {
            // Indicación visual inmediata para mejorar la experiencia
            setIsReading(true);
            setStatus('preparing');
            setMessage('Preparando lector...');

            const token = await AsyncStorage.getItem('userToken');

            // 1. Agregar un timeout más largo para la operación de reset
            await axios.post(
                `http://${arduinoIP}/api/arduino/rfid/reset`,
                {},
                {
                    timeout: 5000,
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }
            ).catch(error => {
                console.warn("Error al reiniciar el estado, continuando de todos modos:", error.message);
                // No detenemos el proceso si el reset falla
            });

            // 2. Esperar un poco más para que el reset se complete
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. Hacer la solicitud de lectura con un timeout más generoso
            const readResponse = await axios.post(
                `http://${arduinoIP}/api/arduino/rfid/read`,
                {},
                {
                    timeout: 8000,
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }
            );

            // Si llegamos aquí, la solicitud fue exitosa
            setStatus('reading');
            setMessage('Acerque la tarjeta RFID al lector...');

            // Iniciar polling para obtener el resultado
            let errorCount = 0; // Para contar errores consecutivos

            pollIntervalRef.current = setInterval(async () => {
                try {
                    // 4. Agregar timeout también en la solicitud de estado
                    const pollResponse = await axios.get(
                        `http://${arduinoIP}/api/arduino/rfid/status`,
                        {
                            timeout: 3000,
                            headers: token ? { Authorization: `Bearer ${token}` } : {}
                        }
                    );

                    // Reiniciar contador de errores al recibir respuesta
                    errorCount = 0;

                    const data = pollResponse.data as RFIDStatusResponse;
                    if (data.status === 'completed' && data.cardId) {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }

                        const capturedCardId = (pollResponse.data as RFIDStatusResponse).cardId;
                        if (capturedCardId) {
                            setCardId(capturedCardId);
                        }
                        setStatus('success');
                        setMessage(`Tarjeta leída correctamente: ${capturedCardId}`);
                        setIsReading(false);

                        // Esperar un momento antes de cerrar para mostrar el éxito
                        setTimeout(() => {
                            if (capturedCardId) {
                                onCaptureComplete(capturedCardId);
                            } else {
                                setMessage('Error: No se pudo capturar el ID de la tarjeta.');
                            }
                        }, 1500);
                    } else if ((pollResponse.data as RFIDStatusResponse).status === 'error') {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }

                        setStatus('error');
                        const data = pollResponse.data as RFIDStatusResponse;
                        setMessage(`Error en la lectura: ${data.message || 'Error desconocido'}`);
                        setIsReading(false);
                    }
                } catch (pollError) {
                    console.error('Error al verificar estado de lectura:', pollError);

                    // 5. Incrementar contador de errores y detener polling después de varios errores
                    errorCount++;
                    if (errorCount > 3) {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }
                        setStatus('error');
                        setMessage('Error de conexión con el dispositivo. Verifique que la IP sea correcta.');
                        setIsReading(false);
                    }
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

                    // 6. Intentar reiniciar el estado del dispositivo en timeout
                    axios.post(`http://${arduinoIP}/api/arduino/rfid/reset`).catch(console.warn);
                }
            }, 30000); // 30 segundos de timeout

        } catch (error: any) {
            // 7. Mejor manejo de errores específicos
            console.error('Error al iniciar lectura RFID:', error);

            let errorMessage = 'Error al comunicarse con el dispositivo';

            // Error de red (dispositivo no accesible)
            if (error.message && error.message.includes('Network Error')) {
                errorMessage = 'Error de red: No se puede conectar con el dispositivo Arduino. Verifique la IP correcta.';
            }
            // Error de conflicto (operación ya en progreso)
            else if (error.response?.status === 409) {
                errorMessage = 'Ya hay una operación RFID en progreso. Espere unos momentos e intente nuevamente.';

                // Intentar reiniciar el estado
                axios.post(`http://${arduinoIP}/api/arduino/rfid/reset`).catch(console.warn);
            }
            // Timeout
            else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Tiempo de espera agotado al conectar con el dispositivo.';
            }
            // Otros errores con mensaje específico
            else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
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

                {/* Añadir esta sección para mostrar información de depuración */}
                <View style={styles.debugContainer}>
                    <Text style={styles.debugText}>
                        {arduinoIPStatus}
                    </Text>
                    <Text style={styles.debugText}>
                        Estado: {status}
                    </Text>
                </View>
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
    },
    debugContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    debugText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});

export default RFIDControlModal;