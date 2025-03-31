import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BotonVolver from '../componentes/BotonVolver';
import IPS from '../config/IPS';

export default function PantallaRegistroDispositivo() {
    const router = useRouter();
    const [macAddress, setMacAddress] = useState('');
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingMac, setIsFetchingMac] = useState(true);

    // Nueva función para obtener MAC del dispositivo
    const fetchDeviceInfo = async () => {
        setIsFetchingMac(true);
        interface DeviceInfo {
            mac: string;
            ip: string;
        }

        try {
            // Verificar si tenemos una IP guardada en AsyncStorage
            let endpoint;
            const savedArduinoIP = await AsyncStorage.getItem('arduinoIP');

            if (savedArduinoIP) {
                // Si tenemos una IP guardada, formamos la URL completa
                endpoint = `http://${savedArduinoIP}/api/arduino/info`;
            } else {
                // Si no tenemos IP guardada, usamos directamente la URL de IPS
                // que ya incluye el protocolo http://
                endpoint = `${IPS.ESP32_URL}/api/arduino/info`;
            }

            console.log('Intentando conectar a:', endpoint);

            const response = await axios.get<DeviceInfo>(endpoint, {
                timeout: 5000
            });

            if (response.data && response.data.mac) {
                setMacAddress(response.data.mac);

                // Guardar la IP si ha cambiado y viene en la respuesta
                if (response.data.ip) {
                    await AsyncStorage.setItem('arduinoIP', response.data.ip);
                }
            }
        } catch (error) {
            console.error('Error obteniendo información del dispositivo:', error);
            setMessage('No se pudo conectar con el dispositivo IoT. Verifica que esté encendido y conectado a la misma red.');
        } finally {
            setIsFetchingMac(false);
        }
    };

    // Función para notificar al ESP32 que el proceso de registro ha terminado
    const notifyRegistrationCompleted = async () => {
        try {
            let endpoint;
            const savedArduinoIP = await AsyncStorage.getItem('arduinoIP');

            if (savedArduinoIP) {
                endpoint = `http://${savedArduinoIP}/api/arduino/register-complete`;
            } else {
                endpoint = `${IPS.ESP32_URL}/api/arduino/register-complete`;
            }

            console.log('Notificando al ESP32 que se completó el registro:', endpoint);
            await axios.post(endpoint);
            console.log('ESP32 notificado exitosamente');
        } catch (error) {
            console.warn('Error notificando al ESP32:', error);
            // No bloquear el flujo si esto falla
        }
    };

    // Llamar a la función cuando se monte el componente y limpiar cuando se desmonte
    useEffect(() => {
        fetchDeviceInfo();

        // Cleanup function: notificar al ESP32 cuando el usuario abandone la pantalla
        return () => {
            console.log('Componente desmontado - notificando al ESP32');
            notifyRegistrationCompleted();
        };
    }, []);

    // Validar que el PIN solo contiene números
    interface ValidatePinProps {
        text: string;
    }

    const validatePin = (text: ValidatePinProps['text']) => {
        // Solo permitir dígitos y limitar a 4 caracteres
        if (/^\d*$/.test(text) && text.length <= 4) {
            setPin(text);
        }
    };

    const handleRegisterDevice = async () => {
        // Validaciones básicas
        if (!macAddress || !name) {
            setMessage('La dirección MAC y el nombre son requeridos');
            return;
        }

        // Validación específica para el PIN
        if (!pin || pin.length !== 4) {
            setMessage('El PIN debe tener exactamente 4 dígitos');
            return;
        }

        setIsLoading(true);
        try {
            // Obtener el token de autenticación de AsyncStorage
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                setMessage('No se encontró el token de autenticación. Por favor inicie sesión.');
                setIsLoading(false);
                return;
            }

            // Usar la configuración centralizada para la URL del servidor
            const baseUrl = IPS.SERVER_URL;

            // Realizar la solicitud al backend
            const response = await axios.post(
                `${baseUrl}/api/devices/register`,
                { macAddress, name, devicePin: pin },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 201) {
                // Guardar el estado para indicar que el usuario ya tiene un dispositivo
                await AsyncStorage.setItem('userHasDevice', 'true');
                setMessage('Dispositivo registrado con éxito');

                // Notificar al Arduino que el registro se completó
                await notifyRegistrationCompleted();

                // Mostrar mensaje de éxito y luego navegar a la pantalla puerta
                Alert.alert(
                    "Registro Exitoso",
                    "El dispositivo ha sido registrado correctamente.",
                    [
                        {
                            text: "Continuar",
                            onPress: () => {
                                console.log("Navegando a pantalla puerta");
                                router.push('/puerta');
                            }
                        }
                    ]
                );
            }
        } catch (error: any) {
            console.error('Error registrando dispositivo:', error);

            // Manejar el error de manera más robusta
            let errorMessage = 'Error al registrar el dispositivo';

            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage;
            } else if (error.message) {
                if (error.message.includes('Network Error')) {
                    errorMessage = 'Error de conexión al servidor. Verifica tu conexión a internet.';
                } else {
                    errorMessage = error.message;
                }
            }

            setMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <Text style={styles.title}>Registrar Dispositivo IoT</Text>
                    <BotonVolver destino="/CatalogoProductosScreen" />

                    {isFetchingMac ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007bff" />
                            <Text style={styles.loadingText}>Conectando con el dispositivo...</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.label}>Dirección MAC</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="00:1B:44:11:3A:B7"
                                value={macAddress}
                                onChangeText={setMacAddress}
                                autoCapitalize="none"
                                editable={!isFetchingMac} // Deshabilitar durante carga
                            />

                            <Text style={styles.label}>Nombre del Dispositivo</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Sensor de Temperatura"
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={styles.label}>PIN de Acceso (4 dígitos)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1234"
                                value={pin}
                                onChangeText={validatePin}
                                keyboardType="numeric"
                                maxLength={4}
                                secureTextEntry={true}
                            />
                            <Text style={styles.pinInfo}>
                                Este PIN se usará para acceder al dispositivo desde la cerradura física.
                            </Text>

                            <TouchableOpacity
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                onPress={handleRegisterDevice}
                                disabled={isLoading}
                            >
                                <Text style={styles.buttonText}>
                                    {isLoading ? 'Registrando...' : 'Registrar'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {message ? (
                        <Text style={[
                            styles.message,
                            message.includes('éxito') ? styles.successMessage : styles.errorMessage
                        ]}>
                            {message}
                        </Text>
                    ) : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos sin cambios
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    cardContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        width: '100%',
        height: 45,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    pinInfo: {
        fontSize: 12,
        color: '#666',
        marginTop: -10,
        marginBottom: 15,
        fontStyle: 'italic',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#007bff',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#cccccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    message: {
        marginTop: 15,
        fontSize: 16,
        textAlign: 'center',
        padding: 10,
        borderRadius: 5,
    },
    successMessage: {
        backgroundColor: '#d4edda',
        color: '#155724',
    },
    errorMessage: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
});