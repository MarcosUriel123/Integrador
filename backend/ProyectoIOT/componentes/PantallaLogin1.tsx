import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Actualizar la interfaz:
interface LoginResponse {
    id?: string;
    userId?: string;
    user?: {
        id: string;
        name?: string;
        email: string;
    };
    token: string;
    hasDevice: boolean;
    message: string;
}

export default function PantallaLogin1() {
    const router = useRouter();
    const params = useLocalSearchParams(); // Para recibir parámetros de navegación
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorMessage("Por favor completa todos los campos");
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            console.log(`[Login] Intentando iniciar sesión con email: ${email}`);

            const response = await axios.post<LoginResponse>('http://localhost:8082/api/users/login', {
                email,
                password,
            });

            console.log(`[Login] Respuesta del servidor:`, {
                status: response.status,
                statusText: response.statusText,
                data: {
                    ...response.data,
                    token: response.data.token ? 'TOKEN_PRESENT' : 'NO_TOKEN',
                    hasDevice: response.data.hasDevice
                }
            });

            if (response.status === 200) {
                // Guardar el token en AsyncStorage
                if (response.data && response.data.token) {
                    await AsyncStorage.setItem('userToken', response.data.token);
                    console.log('[Login] Token guardado en AsyncStorage');

                    const userId = response.data.id || response.data.userId;
                    if (userId) {
                        await AsyncStorage.setItem('userId', userId);
                        console.log(`[Login] ID de usuario guardado: ${userId}`);
                    } else {
                        console.error('[Login] Error: No se recibió un ID de usuario válido');
                    }

                    // Guardar si el usuario tiene un dispositivo IoT
                    const hasDeviceValue = String(response.data.hasDevice);
                    await AsyncStorage.setItem('userHasDevice', hasDeviceValue);
                    console.log(`[Login] Estado de dispositivo guardado: ${hasDeviceValue}`);

                    // Verificar que los valores se guardaron correctamente
                    const storedToken = await AsyncStorage.getItem('userToken');
                    const storedUserId = await AsyncStorage.getItem('userId');
                    const storedHasDevice = await AsyncStorage.getItem('userHasDevice');

                    console.log('[Login] Verificación de almacenamiento:');
                    console.log(`- Token guardado: ${storedToken ? 'Sí' : 'No'}`);
                    console.log(`- UserID guardado: ${storedUserId}`);
                    console.log(`- HasDevice guardado: ${storedHasDevice}`);

                    if (hasDeviceValue !== storedHasDevice) {
                        console.warn('[Login] ¡Advertencia! El valor de hasDevice no se guardó correctamente');
                        console.warn(`  Esperado: ${hasDeviceValue}, Almacenado: ${storedHasDevice}`);
                    }
                } else {
                    console.error('[Login] Error: No se recibió un token del servidor');
                }

                // Redirige a la pantalla principal usando expo-router
                console.log('[Login] Iniciando proceso de redirección después del login exitoso');
                handleSuccessfulLogin();
            }
        } catch (error) {
            console.error("[Login] Error al iniciar sesión:", error);

            // if (axios.isAxiosError(error)) {
            //     console.error('[Login] Detalles del error:');
            //     console.error(`- Status: ${error.response?.status}`);
            //     console.error(`- Mensaje: ${error.response?.data?.message || error.message}`);
            //     console.error(`- Data:`, error.response?.data);
            // }

            setErrorMessage("Credenciales inválidas");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessfulLogin = async () => {
        // Después de guardar token y datos de usuario:
        console.log('[Login] Ejecutando handleSuccessfulLogin');

        const returnTo = params.returnTo as string;
        const productParam = params.productParam as string;

        console.log(`[Login] Parámetros de navegación: returnTo=${returnTo}, productParam=${productParam ? 'presente' : 'ausente'}`);

        if (returnTo) {
            console.log(`[Login] Navegando de vuelta a la ruta anterior: ${returnTo}`);
            // Si hay una ruta de retorno (por ejemplo, volver a la página de detalles del producto)
            if (productParam) {
                console.log(`[Login] Incluyendo parámetro de producto en la navegación`);
                router.replace({
                    pathname: returnTo as any,
                    params: { product: productParam }
                });
            } else {
                router.replace(returnTo as any);
            }
        } else {
            // Si no hay ruta de retorno específica
            const redirectPath = await AsyncStorage.getItem('redirectAfterLogin');
            console.log(`[Login] No hay returnTo, verificando redirectPath: ${redirectPath || 'no hay'}`);

            if (redirectPath) {
                await AsyncStorage.removeItem('redirectAfterLogin');
                console.log(`[Login] Navegando a ruta almacenada: ${redirectPath}`);
                router.replace(redirectPath as any);
            } else {
                console.log(`[Login] Navegando a la ruta principal por defecto`);
                router.replace('/Principal');
            }
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
                            editable={!isLoading}
                        />
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu contraseña"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!isLoading}
                        />
                        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.buttonText}>Iniciar Sesión</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/registro1')} disabled={isLoading}>
                            <Text style={[styles.linkText, isLoading && styles.linkTextDisabled]}>
                                ¿No tienes cuenta? Regístrate aquí
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/recovery')} disabled={isLoading}>
                            <Text style={[styles.linkText, isLoading && styles.linkTextDisabled]}>
                                ¿Olvidaste tu contraseña?
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={isLoading}
            >
                <Feather name="arrow-left" size={24} color="#007bff" />
            </TouchableOpacity>
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
        marginBottom: 15,
    },
    buttonDisabled: {
        backgroundColor: '#b3d7ff', // Color más claro para mostrar estado deshabilitado
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
    linkText: {
        marginTop: 10,
        color: '#007bff',
    },
    linkTextDisabled: {
        color: '#b3d7ff', // Color más claro para mostrar estado deshabilitado
    }
});