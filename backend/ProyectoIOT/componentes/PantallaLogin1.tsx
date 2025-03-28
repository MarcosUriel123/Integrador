import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import { useRouter } from 'expo-router';
import BotonVolver from '../componentes/BotonVolver';
import InputApp from './Inputapp'; // Corregido: importación correcta

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

    // Estados para validación
    const [emailValid, setEmailValid] = useState(false);
    const [passwordValid, setPasswordValid] = useState(false);

    const handleLogin = async () => {
        // Verificar que ambos campos sean válidos
        if (!emailValid) {
            setErrorMessage('Por favor, ingresa un correo electrónico válido');
            return;
        }

        // No validamos exhaustivamente la contraseña en el login,
        // pero sí verificamos que no esté vacía
        if (!password) {
            setErrorMessage('Por favor, ingresa tu contraseña');
            return;
        }

        setErrorMessage('');

        try {
            const response = await axios.post<LoginResponse>('http://192.168.8.7:8082/api/users/login', {
                email,
                password,
            });

            if (response.status === 200) {
                // Guardar el token en AsyncStorage
                if (response.data && response.data.token) {
                    await AsyncStorage.setItem('userToken', response.data.token);
                    await AsyncStorage.setItem('userId', response.data._id);

                    // NUEVO: Inicializar el valor userHasDevice como 'false' por defecto
                    await AsyncStorage.setItem('userHasDevice', 'false');

                    console.log('Token guardado:', response.data.token);
                    console.log('Estado de dispositivo inicializado como: false');
                } else {
                    console.error('No se recibió un token del servidor');
                    setErrorMessage("Error en la respuesta del servidor");
                    return;
                }

                // Redirige a la pantalla principal usando expo-router
                handleSuccessfulLogin();
            }
        } catch (error: any) {
            console.error("Error al iniciar sesión:", error);

            // Mostrar mensaje de error más específico
            if (error.response) {
                if (error.response.status === 401) {
                    setErrorMessage("Credenciales incorrectas");
                } else {
                    setErrorMessage(error.response.data?.message || "Error al iniciar sesión");
                }
            } else {
                setErrorMessage("No se pudo conectar con el servidor");
            }
        }
    };

    const handleSuccessfulLogin = async () => {
        // Resto de la función sin cambios
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

                        {/* Nuevo componente para correo electrónico */}
                        <InputApp
                            tipo="correo"
                            value={email}
                            onChangeText={setEmail}
                            showValidation={email.length > 0}
                            onValidationChange={setEmailValid}
                            containerStyle={styles.inputContainer}
                        />

                        {/* Nuevo componente para contraseña */}
                        <InputApp
                            tipo="contrasenna"
                            value={password}
                            onChangeText={setPassword}
                            showValidation={false} // No mostramos validaciones para contraseña en login
                            onValidationChange={setPasswordValid}
                            containerStyle={styles.inputContainer}
                        />

                        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

                        <TouchableOpacity
                            style={[
                                styles.button,
                                !emailValid && styles.buttonDisabled
                            ]}
                            onPress={handleLogin}
                            disabled={!emailValid}
                        >
                            <Text style={styles.buttonText}>Iniciar Sesión</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => router.push('/registro1')}
                        >
                            <Text style={styles.linkText}>¿No tienes cuenta? Regístrate aquí</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => router.push('/recovery')}
                        >
                            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Estilos existentes
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
        width: '100%',
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    // Nuevos estilos para los componentes InputApp
    inputContainer: {
        marginBottom: 10,
        width: '100%',
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
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
    linkButton: {
        marginTop: 15,
        padding: 5,
    },
    linkText: {
        color: '#007bff',
        textAlign: 'center',
    }
});
