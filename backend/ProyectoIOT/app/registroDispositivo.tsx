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

    const handleRegisterDevice = async () => {
        // Validaciones básicas
        if (!macAddress || !name || !pin) {
            setMessage('Todos los campos son requeridos');
            return;
        }

        // Validar que el PIN sea numérico y tenga entre 4 y 6 dígitos
        if (!/^\d{4,6}$/.test(pin)) {
            setMessage('El PIN debe ser numérico y tener entre 4 y 6 dígitos');
            return;
        }

        setIsLoading(true);
        try {
            // Obtener el token de autenticación y userId de AsyncStorage
            const token = await AsyncStorage.getItem('userToken');
            const userId = await AsyncStorage.getItem('userId');

            if (!token || !userId) {
                setMessage('No se encontró la información de autenticación. Por favor inicie sesión.');
                setIsLoading(false);
                return;
            }

            // Realizar la solicitud al backend para registrar el dispositivo
            const deviceResponse = await axios.post(
                'http://localhost:8082/api/devices/register',
                { macAddress, name },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Si el dispositivo se registró correctamente, actualizar el usuario con el PIN
            if (deviceResponse.status === 201) {
                // Guardar el PIN en el perfil del usuario
                const userUpdateResponse = await axios.put(
                    `http://localhost:8082/api/users/update/${userId}`,
                    { devicePin: pin },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (userUpdateResponse.status === 200) {
                    setMessage('Dispositivo registrado y PIN configurado con éxito');
                    // Limpiar los campos
                    setMacAddress('');
                    setName('');
                    setPin('');
                } else {
                    setMessage('Dispositivo registrado pero hubo un problema al guardar el PIN');
                }
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

                    <Text style={styles.label}>PIN de Seguridad</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Entre 4 y 6 dígitos"
                        value={pin}
                        onChangeText={setPin}
                        keyboardType="numeric"
                        secureTextEntry={true}
                        maxLength={6}
                    />
                    <Text style={styles.helperText}>
                        Este PIN se usará para autenticar acciones con su dispositivo
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
        marginBottom: 5,
        paddingHorizontal: 15,
    },
    helperText: {
        fontSize: 12,
        color: '#666',
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