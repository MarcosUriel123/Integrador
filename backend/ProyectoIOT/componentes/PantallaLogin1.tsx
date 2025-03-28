import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import { useRouter } from 'expo-router';
import BotonVolver from '../componentes/BotonVolver';
import input from './Inputapp'; // Asegúrate de que la ruta sea correcta

// Define la interfaz para la respuesta del login
interface LoginResponse {
    _id: string;
    name?: string;
    email: string;
    token: string;
    [key: string]: any; // Para cualquier otra propiedad que pueda tener
}

export default function PantallaLogin1() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        try {
            const response = await axios.post<LoginResponse>('http://192.168.8.2:8082/api/users/login', {
                email,
                password,
            });

            if (response.status === 200) {
                // Guardar el token en AsyncStorage
                if (response.data && response.data.token) {
                    await AsyncStorage.setItem('userToken', response.data.token);
                    await AsyncStorage.setItem('userId', response.data._id);

                    // NUEVO: Inicializar el valor userHasDevice como 'false' por defecto
                    // Esto evita problemas cuando Header intenta leer este valor
                    await AsyncStorage.setItem('userHasDevice', 'false');

                    console.log('Token guardado:', response.data.token);
                    console.log('Estado de dispositivo inicializado como: false');
                } else {
                    console.error('No se recibió un token del servidor');
                    setErrorMessage("Error en la respuesta del servidor");
                    return; // Detener la ejecución si no hay token
                }

                // Redirige a la pantalla principal usando expo-router
                handleSuccessfulLogin();
            }
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
        }
    };

    const handleSuccessfulLogin = async () => {
        // Después de guardar token y datos de usuario:
        const redirectPath = await AsyncStorage.getItem('redirectAfterLogin');

        if (redirectPath) {
            await AsyncStorage.removeItem('redirectAfterLogin');
            router.replace(redirectPath as any);
        } else {
            router.replace('/Principal');
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                    </View>
                    <BotonVolver destino="/" />
                    <View style={styles.contentContainer}>
                        <Feather name="lock" size={80} color="black" style={styles.icon} />
                        <Text style={styles.title}>Iniciar Sesión</Text>
                        <Text style={styles.label}>Correo Electrónico</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu correo electrónico"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu contraseña"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
                        <TouchableOpacity style={styles.button} onPress={handleLogin}>
                            <Text style={styles.buttonText}>Iniciar Sesión</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/registro1')}>
                            <Text>¿No tienes cuenta? Regístrate aquí</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/recovery')}>
                            <Text>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>
                    </View>
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
    },
    cardContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    topBar: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    contentContainer: {
        alignItems: 'center',
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        alignSelf: 'flex-start',
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        width: '100%',
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#007bff',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 10,
    },
});