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
import InputApp from './Inputapp';
import IPS from '../config/IPS';
import { useAppTheme } from '../hooks/useAppTheme';

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
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Obtener isDarkMode también
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
            const response = await axios.post<LoginResponse>(`${IPS.SERVER_URL}/api/users/login`, {
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

    // Definir los colores del gradiente para el botón según el tema y estado
    const getButtonGradientColors = (): readonly [string, string] => {
        if (!emailValid || !password || isLoggingIn) {
            // Colores para estado deshabilitado
            return isDarkMode
                ? ['#3d4451', '#2d3748'] as const // Gris oscuro para tema oscuro
                : ['#A0AEC0', '#718096'] as const; // Gris claro para tema claro
        } else {
            // Colores para estado activo
            return isDarkMode
                ? [colors.primary, '#1e3a8a'] as const // Primario a azul oscuro para tema oscuro
                : [colors.primary, '#2C5282'] as const; // Primario a azul medio para tema claro
        }
    };

    return (
        <SafeAreaView style={baseStyles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <Animated.View
                    style={[
                        baseStyles.contentContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        }
                    ]}
                >
                    <View style={localStyles.loginHeader}>
                        <View style={[localStyles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                            <Feather name="lock" size={40} color={colors.primary} />
                        </View>
                        <Text style={[baseStyles.title, { textAlign: 'center' }]}>Iniciar Sesión</Text>
                        <Text style={[baseStyles.secondaryText, { textAlign: 'center', maxWidth: '90%', lineHeight: 22 }]}>
                            Accede a tu cuenta para disfrutar de todas las funcionalidades
                        </Text>
                    </View>

                    <View style={[baseStyles.section, { marginTop: 20 }]}>
                        {/* Correo electrónico */}
                        <View style={localStyles.fieldContainer}>
                            <Text style={[baseStyles.secondaryText, { fontWeight: '500', marginBottom: 6 }]}>
                                Correo electrónico
                            </Text>
                            <View style={localStyles.inputWithIcon}>
                                <View style={[localStyles.inputIconContainer, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="mail-outline" size={18} color={colors.primary} />
                                </View>
                                <InputApp
                                    tipo="correo"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Ingresa tu correo electrónico"
                                    showValidation={email.length > 0}
                                    onValidationChange={setEmailValid}
                                    containerStyle={localStyles.customInputContainer}
                                />
                            </View>
                        </View>

                        {/* Contraseña */}
                        <View style={localStyles.fieldContainer}>
                            <Text style={[baseStyles.secondaryText, { fontWeight: '500', marginBottom: 6 }]}>
                                Contraseña
                            </Text>
                            <View style={localStyles.inputWithIcon}>
                                <View style={[localStyles.inputIconContainer, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
                                </View>
                                <InputApp
                                    tipo="contrasenna"
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Ingresa tu contraseña"
                                    showValidation={false}
                                    onValidationChange={setPasswordValid}
                                    containerStyle={localStyles.customInputContainer}
                                />
                            </View>
                        </View>

                        {errorMessage ? (
                            <View style={[baseStyles.errorContainer, { marginVertical: 16 }]}>
                                <Ionicons name="alert-circle-outline" size={18} color={colors.error} style={{ marginRight: 8 }} />
                                <Text style={[baseStyles.normalText, { color: colors.error }]}>{errorMessage}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[
                                localStyles.loginButtonContainer,
                                {
                                    overflow: 'hidden',
                                    marginTop: 16,
                                    // Reducir las sombras para un diseño más plano
                                    shadowOpacity: isDarkMode ? 0.2 : 0.15,
                                    elevation: isDarkMode ? 3 : 2
                                }
                            ]}
                            onPress={handleLogin}
                            disabled={!emailValid || !password || isLoggingIn}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={getButtonGradientColors()}
                                style={localStyles.loginButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isLoggingIn ? (
                                    <>
                                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                                        <Text style={baseStyles.primaryButtonText}>Iniciando sesión...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                        <Text style={baseStyles.primaryButtonText}>Iniciar Sesión</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={localStyles.linkContainer}>
                            <TouchableOpacity
                                style={localStyles.linkButton}
                                onPress={() => router.push('/registro1')}
                                activeOpacity={0.7}
                            >
                                <Text style={[baseStyles.secondaryText, { textAlign: 'center' }]}>
                                    ¿No tienes cuenta? <Text style={{ color: colors.primary, fontWeight: '600' }}>Regístrate aquí</Text>
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={localStyles.linkButton}
                                onPress={() => router.push('/recovery')}
                                activeOpacity={0.7}
                            >
                                <Text style={[baseStyles.secondaryText, { textAlign: 'center' }]}>
                                    ¿Olvidaste tu contraseña? <Text style={{ color: colors.primary, fontWeight: '600' }}>Recupérala</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos locales específicos que no están en el sistema de temas
const localStyles = StyleSheet.create({
    loginHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "rgba(66,153,225,0.2)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 3,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    customInputContainer: {
        flex: 1,
        marginBottom: 0,
    },
    loginButtonContainer: {
        borderRadius: 12,
        shadowOffset: { width: 0, height: 2 }, // Reducir el offset
        shadowRadius: 5, // Reducir el radio
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12, // Asegurar que el gradiente tenga el mismo radio que el contenedor
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
});
