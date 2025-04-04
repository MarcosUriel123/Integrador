import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import IPS from '../config/IPS';
import { useAppTheme } from '../hooks/useAppTheme';
import InputApp from '../componentes/Inputapp'; // Importar el componente InputApp

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

interface SecretQuestion {
    _id: number;
    pregunta: string;
}

export default function RecoveryScreen() {
    const router = useRouter();
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme();

    // Estados para el formulario de verificación
    const [email, setEmail] = useState('');
    const [secretAnswer, setSecretAnswer] = useState('');
    const [emailValid, setEmailValid] = useState(false);

    // Estados para las preguntas secretas y el dropdown
    const [secretQuestions, setSecretQuestions] = useState<SecretQuestion[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<number>(0);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<{ label: string, value: number }[]>([]);

    // Estados para manejo de flujo
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordValid, setPasswordValid] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

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
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 700,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Cargar preguntas secretas al montar el componente
    useEffect(() => {
        const loadSecretQuestions = async () => {
            try {
                setIsLoadingQuestions(true);
                const response = await axios.get<SecretQuestion[]>(
                    `${IPS.SERVER_URL}${IPS.API.SECRET_QUESTION_URL}`
                );

                if (response.status === 200) {
                    const validQuestions = response.data.filter(q => q && q._id !== undefined);
                    setSecretQuestions(validQuestions);

                    // Convertir las preguntas al formato que necesita DropDownPicker
                    const dropdownItems = validQuestions.map(question => ({
                        label: question.pregunta,
                        value: question._id,
                        key: `question_${String(question._id || 'unknown')}`
                    }));

                    setItems(dropdownItems);

                    // Seleccionar la primera pregunta por defecto
                    if (validQuestions.length > 0) {
                        setSelectedQuestion(validQuestions[0]._id);
                    }
                }
            } catch (error) {
                console.error('Error al cargar preguntas secretas:', error);

                // Datos de fallback en caso de error
                const fallbackQuestions = [
                    { _id: 1, pregunta: "¿Cuál fue el nombre de tu primera mascota?" },
                    { _id: 2, pregunta: "¿En qué ciudad naciste?" },
                    { _id: 3, pregunta: "¿Cuál es el nombre de tu madre?" }
                ];

                setSecretQuestions(fallbackQuestions);
                const fallbackItems = fallbackQuestions.map(q => ({
                    label: q.pregunta,
                    value: q._id,
                    key: `fallback_${q._id}`
                }));
                setItems(fallbackItems);
                setSelectedQuestion(fallbackQuestions[0]._id);
            } finally {
                setIsLoadingQuestions(false);
            }
        };

        loadSecretQuestions();
    }, []);

    // Función para verificar las credenciales de recuperación
    const handleVerifyCredentials = async () => {
        // Validaciones básicas
        if (!email.trim()) {
            setMessage('Por favor ingresa tu correo electrónico');
            setMessageType('error');
            return;
        }

        if (!emailValid) {
            setMessage('Por favor ingresa un correo electrónico válido');
            setMessageType('error');
            return;
        }

        if (!secretAnswer.trim()) {
            setMessage('Por favor ingresa tu respuesta secreta');
            setMessageType('error');
            return;
        }

        if (selectedQuestion === 0) {
            setMessage('Por favor selecciona una pregunta secreta');
            setMessageType('error');
            return;
        }

        try {
            setIsVerifying(true);
            setMessage('');

            // Hacer la solicitud para verificar las credenciales
            const response = await axios.post(
                `${IPS.SERVER_URL}${IPS.API.USER_URL}/verify-recovery`,
                {
                    email,
                    secretQuestion: selectedQuestion,
                    secretAnswer
                }
            );

            if (response.status === 200) {
                setIsVerified(true);
                setMessage('Verificación exitosa. Por favor ingresa tu nueva contraseña.');
                setMessageType('success');

                // Animar la transición al formulario de nueva contraseña
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    })
                ]).start();
            }
        } catch (error: any) {
            console.error('Error en la verificación:', error);
            setMessage(error.response?.data?.message || 'Error al verificar las credenciales');
            setMessageType('error');
        } finally {
            setIsVerifying(false);
        }
    };

    // Función para actualizar la contraseña
    const handleUpdatePassword = async () => {
        // Validaciones de contraseña
        if (!newPassword) {
            setMessage('Por favor ingresa una nueva contraseña');
            setMessageType('error');
            return;
        }

        if (!passwordValid) {
            setMessage('La contraseña debe cumplir con todos los requisitos');
            setMessageType('error');
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('Las contraseñas no coinciden');
            setMessageType('error');
            return;
        }

        try {
            setIsUpdating(true);
            setMessage('');

            // Hacer la solicitud para actualizar la contraseña
            const response = await axios.post(
                `${IPS.SERVER_URL}${IPS.API.USER_URL}/reset-password`,
                {
                    email,
                    secretQuestion: selectedQuestion,
                    secretAnswer,
                    newPassword
                }
            );

            if (response.status === 200) {
                setMessage('¡Éxito! Tu contraseña ha sido actualizada. Redirigiendo a inicio de sesión...');
                setMessageType('success');

                // Pequeño retraso antes de redirigir
                setTimeout(() => {
                    router.push('/Login1');
                }, 1500);
            }
        } catch (error: any) {
            console.error('Error al actualizar contraseña:', error);
            setMessage(error.response?.data?.message || 'Error al actualizar la contraseña');
            setMessageType('error');
        } finally {
            setIsUpdating(false);
        }
    };

    // Obtener colores del gradiente para el botón según el tema
    const getButtonGradientColors = () => {
        return isDarkMode
            ? [colors.primary, '#1e3a8a'] as const // Primario a azul oscuro para tema oscuro
            : [colors.primary, '#2C5282'] as const; // Primario a azul medio para tema claro
    };

    return (
        <SafeAreaView style={baseStyles.screen}>
            <StatusBar
                backgroundColor={isDarkMode ? colors.background : '#FFFFFF'}
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            />
            <ScrollView style={{ flex: 1 }}>
                <View style={baseStyles.contentContainer}>
                    <Animated.View
                        style={[
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                                marginTop: 15,
                                marginBottom: 25
                            }
                        ]}
                    >
                        <View style={localStyles.recoveryHeader}>
                            <View style={[localStyles.iconContainer, {
                                backgroundColor: isDarkMode ? colors.primaryLight + '40' : '#EBF8FF',
                            }]}>
                                <Feather
                                    name="key"
                                    size={40}
                                    color={colors.primary}
                                />
                            </View>
                            <Text style={[localStyles.recoveryTitle, { color: colors.text }]}>
                                {isVerified ? 'Crear Nueva Contraseña' : 'Recuperar Contraseña'}
                            </Text>
                            <Text style={[localStyles.recoverySubtitle, { color: colors.secondaryText }]}>
                                {isVerified
                                    ? 'Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta'
                                    : 'Verifica tu identidad para recuperar el acceso a tu cuenta'}
                            </Text>
                        </View>

                        {message ? (
                            <View style={[
                                localStyles.messageContainer,
                                messageType === 'success'
                                    ? {
                                        backgroundColor: isDarkMode ? 'rgba(56, 161, 105, 0.1)' : '#F0FFF4',
                                        borderLeftColor: isDarkMode ? '#68D391' : '#48BB78'
                                    }
                                    : {
                                        backgroundColor: isDarkMode ? 'rgba(229, 62, 62, 0.1)' : '#FFF5F5',
                                        borderLeftColor: isDarkMode ? '#FC8181' : '#FC8181'
                                    }
                            ]}>
                                <Ionicons
                                    name={messageType === 'success' ? "checkmark-circle-outline" : "alert-circle-outline"}
                                    size={20}
                                    color={messageType === 'success'
                                        ? (isDarkMode ? '#68D391' : '#38A169')
                                        : (isDarkMode ? '#FC8181' : '#E53E3E')}
                                    style={localStyles.messageIcon}
                                />
                                <Text style={[
                                    localStyles.messageText,
                                    {
                                        color: messageType === 'success'
                                            ? (isDarkMode ? '#68D391' : '#276749')
                                            : (isDarkMode ? '#FC8181' : '#C53030')
                                    }
                                ]}>
                                    {message}
                                </Text>
                            </View>
                        ) : null}

                        <Animated.View style={localStyles.formContainer}>
                            {!isVerified ? (
                                <View style={localStyles.form}>
                                    {/* Correo electrónico - Usando InputApp */}
                                    <InputApp
                                        value={email}
                                        onChangeText={setEmail}
                                        tipo="correo"
                                        label="Correo electrónico"
                                        placeholder="Ingresa tu correo electrónico"
                                        showValidation={true}
                                        onValidationChange={(isValid) => setEmailValid(isValid)}
                                    />

                                    {/* Pregunta secreta */}
                                    <View style={localStyles.fieldContainer}>
                                        <Text style={[localStyles.fieldLabel, { color: colors.text }]}>Pregunta secreta</Text>
                                        {isLoadingQuestions ? (
                                            <View style={[localStyles.loadingContainer, {
                                                backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                                borderColor: colors.border
                                            }]}>
                                                <ActivityIndicator size="small" color={colors.primary} />
                                                <Text style={[localStyles.loadingText, { color: colors.secondaryText }]}>
                                                    Cargando preguntas...
                                                </Text>
                                            </View>
                                        ) : (
                                            <View style={localStyles.dropdownWithIcon}>
                                                <View style={[localStyles.inputIconContainer, {
                                                    backgroundColor: isDarkMode ? colors.primaryLight + '40' : '#EBF8FF'
                                                }]}>
                                                    <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                                                </View>
                                                <View style={localStyles.dropdownContainer}>
                                                    <DropDownPicker
                                                        open={open}
                                                        value={selectedQuestion}
                                                        items={items}
                                                        setOpen={setOpen as React.Dispatch<React.SetStateAction<boolean>>}
                                                        setValue={setSelectedQuestion as React.Dispatch<React.SetStateAction<number>>}
                                                        setItems={setItems as React.Dispatch<React.SetStateAction<{ label: string; value: number }[]>>}
                                                        placeholder="Selecciona una pregunta secreta"
                                                        style={[localStyles.dropdown, {
                                                            backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                                            borderColor: colors.border
                                                        }]}
                                                        dropDownContainerStyle={[localStyles.dropdownList, {
                                                            backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                                                            borderColor: colors.border
                                                        }]}
                                                        listMode="SCROLLVIEW"
                                                        scrollViewProps={{
                                                            nestedScrollEnabled: true,
                                                        }}
                                                        textStyle={[localStyles.dropdownText, { color: colors.text }]}
                                                        placeholderStyle={[localStyles.dropdownPlaceholder, { color: colors.secondaryText }]}
                                                        ArrowDownIconComponent={() => <Ionicons name="chevron-down" size={16} color={colors.secondaryText} />}
                                                        ArrowUpIconComponent={() => <Ionicons name="chevron-up" size={16} color={colors.secondaryText} />}
                                                    />
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {/* Respuesta secreta - Usando InputApp */}
                                    <InputApp
                                        value={secretAnswer}
                                        onChangeText={setSecretAnswer}
                                        tipo="texto"
                                        label="Respuesta secreta"
                                        placeholder="Ingresa tu respuesta secreta"
                                        showValidation={false}
                                    />

                                    <TouchableOpacity
                                        style={[localStyles.buttonContainer, {
                                            shadowOpacity: isDarkMode ? 0.3 : 0.2,
                                            elevation: isDarkMode ? 4 : 3
                                        }]}
                                        onPress={handleVerifyCredentials}
                                        disabled={isVerifying}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={isVerifying
                                                ? (isDarkMode ? ['#4A5568', '#2D3748'] : ['#A0AEC0', '#718096'])
                                                : getButtonGradientColors()}
                                            style={localStyles.button}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {isVerifying ? (
                                                <>
                                                    <ActivityIndicator size="small" color="#FFFFFF" style={localStyles.buttonIcon} />
                                                    <Text style={localStyles.buttonText}>Verificando...</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" style={localStyles.buttonIcon} />
                                                    <Text style={localStyles.buttonText}>Verificar Identidad</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={localStyles.form}>
                                    {/* Nueva contraseña - Usando InputApp */}
                                        <InputApp
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            tipo="contrasenna"
                                            label="Nueva contraseña"
                                            placeholder="Ingresa tu nueva contraseña"
                                            showValidation={true}
                                            onValidationChange={(isValid) => setPasswordValid(isValid)}
                                        />

                                    {/* Confirmar contraseña - Usando InputApp */}
                                    <InputApp
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        tipo="contrasenna"
                                        label="Confirmar contraseña"
                                        placeholder="Confirma tu nueva contraseña"
                                        showValidation={false}
                                        errorMessage={
                                            confirmPassword && newPassword !== confirmPassword
                                                ? "Las contraseñas no coinciden"
                                                : undefined
                                        }
                                    />

                                    <TouchableOpacity
                                        style={[localStyles.buttonContainer, {
                                            shadowOpacity: isDarkMode ? 0.3 : 0.2,
                                            elevation: isDarkMode ? 4 : 3
                                        }]}
                                        onPress={handleUpdatePassword}
                                        disabled={isUpdating}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={isUpdating
                                                ? (isDarkMode ? ['#4A5568', '#2D3748'] : ['#A0AEC0', '#718096'])
                                                : getButtonGradientColors()}
                                            style={localStyles.button}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <ActivityIndicator size="small" color="#FFFFFF" style={localStyles.buttonIcon} />
                                                    <Text style={localStyles.buttonText}>Actualizando...</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="save-outline" size={20} color="#FFFFFF" style={localStyles.buttonIcon} />
                                                    <Text style={localStyles.buttonText}>Actualizar Contraseña</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </Animated.View>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    recoveryHeader: {
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
    recoveryTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    recoverySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        maxWidth: '90%',
        lineHeight: 22,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
    },
    messageIcon: {
        marginRight: 8,
    },
    messageText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    formContainer: {
        width: '100%',
    },
    form: {
        gap: 16,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 15,
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    dropdownWithIcon: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        zIndex: 100,
    },
    dropdownContainer: {
        flex: 1,
        zIndex: 100,
    },
    dropdown: {
        borderWidth: 1,
        borderRadius: 8,
        minHeight: 48,
    },
    dropdownList: {
        borderWidth: 1,
        borderRadius: 8,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    dropdownText: {
        fontSize: 16,
    },
    dropdownPlaceholder: {
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        height: 48,
        marginLeft: 50,
    },
    loadingText: {
        marginLeft: 10,
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});