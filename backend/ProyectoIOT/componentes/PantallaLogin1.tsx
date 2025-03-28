import React, { useState, useRef, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import BotonVolver from '../componentes/BotonVolver';
import InputApp from './Inputapp';
import Header from './Header';
import Footer from './Footer';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

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
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Estados para validación
    const [emailValid, setEmailValid] = useState(false);
    const [passwordValid, setPasswordValid] = useState(false);

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // Animar la entrada del contenido cuando carga la pantalla
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

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
        setIsLoggingIn(true);

        try {
            const response = await axios.post<LoginResponse>('http://192.168.0.75:8082/api/users/login', {
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
                    setIsLoggingIn(false);
                    return;
                }

                // Redirige a la pantalla principal usando expo-router
                handleSuccessfulLogin();
            }
        } catch (error: any) {
            console.error("Error al iniciar sesión:", error);
            setIsLoggingIn(false);

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
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Iniciar Sesión" showMenu={false} />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/" />
                    </View>

                    <Animated.View
                        style={[
                            styles.loginSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <View style={styles.loginHeader}>
                            <View style={styles.iconContainer}>
                                <Feather name="lock" size={40} color="#3182CE" />
                            </View>
                            <Text style={styles.loginTitle}>Iniciar Sesión</Text>
                            <Text style={styles.loginSubtitle}>
                                Accede a tu cuenta para disfrutar de todas las funcionalidades
                            </Text>
                        </View>

                        <View style={styles.formFields}>
                            {/* Correo electrónico */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Correo electrónico</Text>
                                <View style={styles.inputWithIcon}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="mail-outline" size={18} color="#3182CE" />
                                    </View>
                                    <InputApp
                                        tipo="correo"
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="Ingresa tu correo electrónico"
                                        showValidation={email.length > 0}
                                        onValidationChange={setEmailValid}
                                        containerStyle={styles.customInputContainer}
                                    />
                                </View>
                            </View>

                            {/* Contraseña */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Contraseña</Text>
                                <View style={styles.inputWithIcon}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="lock-closed-outline" size={18} color="#3182CE" />
                                    </View>
                                    <InputApp
                                        tipo="contrasenna"
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Ingresa tu contraseña"
                                        showValidation={false}
                                        onValidationChange={setPasswordValid}
                                        containerStyle={styles.customInputContainer}
                                    />
                                </View>
                            </View>

                            {errorMessage ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle-outline" size={18} color="#E53E3E" style={styles.errorIcon} />
                                    <Text style={styles.errorMessage}>{errorMessage}</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                style={styles.loginButtonContainer}
                                onPress={handleLogin}
                                disabled={!emailValid || !password || isLoggingIn}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={
                                        !emailValid || !password || isLoggingIn
                                            ? ['#A0AEC0', '#718096']
                                            : ['#3182CE', '#2C5282']
                                    }
                                    style={styles.loginButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoggingIn ? (
                                        <>
                                            <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                                            <Text style={styles.loginButtonText}>Iniciando sesión...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.linkContainer}>
                                <TouchableOpacity
                                    style={styles.linkButton}
                                    onPress={() => router.push('/registro1')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.linkText}>
                                        ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate aquí</Text>
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.linkButton}
                                    onPress={() => router.push('/recovery')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.linkText}>
                                        ¿Olvidaste tu contraseña? <Text style={styles.linkTextBold}>Recupérala</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>

                    <Footer />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    cardContainer: {
        padding: 20,
    },
    buttonBackContainer: {
        marginBottom: 15,
        marginTop: 5,
    },
    loginSection: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 22,
        shadowColor: "rgba(0,0,0,0.2)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        marginBottom: 25,
        marginTop: 15,
    },
    loginHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EBF8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "rgba(66,153,225,0.2)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 3,
    },
    loginTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 8,
    },
    loginSubtitle: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        maxWidth: '90%',
        lineHeight: 22,
    },
    formFields: {
        width: '100%',
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 15,
        color: '#4A5568',
        marginBottom: 6,
        fontWeight: '500',
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EBF8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    customInputContainer: {
        flex: 1,
        marginBottom: 0,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#FC8181',
    },
    errorIcon: {
        marginRight: 8,
    },
    errorMessage: {
        flex: 1,
        color: '#C53030',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButtonContainer: {
        marginTop: 5,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    buttonIcon: {
        marginRight: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    linkContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkButton: {
        marginVertical: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    linkText: {
        color: '#718096',
        textAlign: 'center',
        fontSize: 15,
    },
    linkTextBold: {
        color: '#3182CE',
        fontWeight: '600',
    },
});
