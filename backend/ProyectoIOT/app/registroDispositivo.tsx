import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PantallaRegistroDispositivo() {
    const [macAddress, setMacAddress] = useState('');
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Validar que el PIN solo contiene números
    const validatePin = (text: string) => {
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

            // Realizar la solicitud al backend
            const response = await axios.post(
                'http://localhost:8082/api/devices/register',
                { macAddress, name, devicePin: pin }, // Cambiado de location a devicePin
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 201) {
                setMessage('Dispositivo registrado con éxito');
                // Limpiar los campos
                setMacAddress('');
                setName('');
                setPin('');
            }
        } catch (error) {
            console.error('Error registrando dispositivo:', error);
            setMessage('Error al registrar el dispositivo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <Text style={styles.title}>Registrar Dispositivo IoT</Text>

                    <Text style={styles.label}>Dirección MAC</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="00:1B:44:11:3A:B7"
                        value={macAddress}
                        onChangeText={setMacAddress}
                        autoCapitalize="none"
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

                    {message ? (
                        <Text style={[styles.message,
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
});