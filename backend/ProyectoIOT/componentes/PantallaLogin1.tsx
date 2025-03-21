import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definir la interfaz para la respuesta del servidor
interface LoginResponse {
    token: string; // El token JWT
    name: string;  // El nombre del usuario
    [key: string]: any; // Para cualquier otra propiedad
}

export default function PantallaLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        try {
            // Especificar el tipo de respuesta esperada (LoginResponse)
            const response = await axios.post<LoginResponse>('http://localhost:8082/api/users/login', {
                email,
                password,
            });

            if (response.status === 200) {
                // Guardar el token y el nombre del usuario en AsyncStorage
                await AsyncStorage.setItem('userToken', response.data.token);
                await AsyncStorage.setItem('userName', response.data.name);

                console.log('Token y nombre guardados:', response.data.token, response.data.name);

                // Redirigir a la pantalla principal
                router.push('/Principal');
            }
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            setErrorMessage("Credenciales inválidas");
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                    </View>
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
                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/registro1')}>
                            <Text style={styles.forgotPasswordText}>¿No tienes cuenta? Regístrate aquí</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/recovery')}>
                            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
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
        backgroundColor: '#CFE2FF',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    cardContainer: {
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: 20,
        paddingBottom: 10,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E1E1E',
    },
    contentContainer: {
        alignItems: 'center',
    },
    icon: {
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1E1E1E',
    },
    label: {
        width: '100%',
        fontSize: 16,
        marginTop: 10,
        marginBottom: 5,
        color: '#1E1E1E',
    },
    input: {
        width: '100%',
        height: 40,
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        fontSize: 16,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    loginButton: {
        width: '100%',
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        paddingVertical: 12,
        marginTop: 10,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#007BFF',
        marginTop: 20,
        textDecorationLine: 'underline',
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
});