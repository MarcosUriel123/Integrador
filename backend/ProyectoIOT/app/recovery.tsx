import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import BotonVolver from '../componentes/BotonVolver';
import Header from '../componentes/Header';
import Footer from '../componentes/Footer';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

interface SecretQuestion {
    _id: number;
    pregunta: string;
}

export default function RecoveryScreen() {
    const router = useRouter();

    // Estados para el formulario de verificación
    const [email, setEmail] = useState('');
    const [secretAnswer, setSecretAnswer] = useState('');

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
                const response = await axios.get<SecretQuestion[]>('http://192.168.0.75:8082/api/secretQuestions');

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
            const response = await axios.post('http://192.168.0.75:8082/api/users/verify-recovery', {
                email,
                secretQuestion: selectedQuestion,
                secretAnswer
            });

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

        if (newPassword.length < 6) {
            setMessage('La contraseña debe tener al menos 6 caracteres');
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
            const response = await axios.post('http://192.168.0.75:8082/api/users/reset-password', {
                email,
                secretQuestion: selectedQuestion,
                secretAnswer,
                newPassword
            });

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

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Recuperar Contraseña" showMenu={false} />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/Login1" />
                    </View>

                    <Animated.View
                        style={[
                            styles.recoverySection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <View style={styles.recoveryHeader}>
                            <View style={styles.iconContainer}>
                                <Feather name="key" size={40} color="#3182CE" />
                            </View>
                            <Text style={styles.recoveryTitle}>
                                {isVerified ? 'Crear Nueva Contraseña' : 'Recuperar Contraseña'}
                            </Text>
                            <Text style={styles.recoverySubtitle}>
                                {isVerified
                                    ? 'Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta'
                                    : 'Verifica tu identidad para recuperar el acceso a tu cuenta'}
                            </Text>
                        </View>

                        {message ? (
                            <View style={[
                                styles.messageContainer,
                                messageType === 'success' ? styles.successMessageContainer : styles.errorMessageContainer
                            ]}>
                                <Ionicons
                                    name={messageType === 'success' ? "checkmark-circle-outline" : "alert-circle-outline"}
                                    size={20}
                                    color={messageType === 'success' ? "#38A169" : "#E53E3E"}
                                    style={styles.messageIcon}
                                />
                                <Text style={[
                                    styles.messageText,
                                    messageType === 'success' ? styles.successMessage : styles.errorMessage
                                ]}>
                                    {message}
                                </Text>
                            </View>
                        ) : null}

                        <Animated.View style={styles.formContainer}>
                            {!isVerified ? (
                                <View style={styles.form}>
                                    {/* Correo electrónico */}
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.fieldLabel}>Correo electrónico</Text>
                                        <View style={styles.inputWithIcon}>
                                            <View style={styles.inputIconContainer}>
                                                <Ionicons name="mail-outline" size={18} color="#3182CE" />
                                            </View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Ingresa tu correo electrónico"
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                placeholderTextColor="#A0AEC0"
                                            />
                                        </View>
                                    </View>

                                    {/* Pregunta secreta */}
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.fieldLabel}>Pregunta secreta</Text>
                                        {isLoadingQuestions ? (
                                            <View style={styles.loadingContainer}>
                                                <ActivityIndicator size="small" color="#3182CE" />
                                                <Text style={styles.loadingText}>Cargando preguntas...</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.dropdownWithIcon}>
                                                <View style={styles.inputIconContainer}>
                                                    <Ionicons name="help-circle-outline" size={18} color="#3182CE" />
                                                </View>
                                                <View style={styles.dropdownContainer}>
                                                    <DropDownPicker
                                                        open={open}
                                                        value={selectedQuestion}
                                                        items={items}
                                                        setOpen={setOpen as React.Dispatch<React.SetStateAction<boolean>>}
                                                        setValue={setSelectedQuestion as React.Dispatch<React.SetStateAction<number>>}
                                                        setItems={setItems as React.Dispatch<React.SetStateAction<{ label: string; value: number }[]>>}
                                                        placeholder="Selecciona una pregunta secreta"
                                                        style={styles.dropdown}
                                                        dropDownContainerStyle={styles.dropdownList}
                                                        listMode="SCROLLVIEW"
                                                        scrollViewProps={{
                                                            nestedScrollEnabled: true,
                                                        }}
                                                        textStyle={styles.dropdownText}
                                                        placeholderStyle={styles.dropdownPlaceholder}
                                                        ArrowDownIconComponent={() => <Ionicons name="chevron-down" size={16} color="#718096" />}
                                                        ArrowUpIconComponent={() => <Ionicons name="chevron-up" size={16} color="#718096" />}
                                                    />
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {/* Respuesta secreta */}
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.fieldLabel}>Respuesta secreta</Text>
                                        <View style={styles.inputWithIcon}>
                                            <View style={styles.inputIconContainer}>
                                                <Ionicons name="key-outline" size={18} color="#3182CE" />
                                            </View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Ingresa tu respuesta secreta"
                                                value={secretAnswer}
                                                onChangeText={setSecretAnswer}
                                                placeholderTextColor="#A0AEC0"
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.buttonContainer}
                                        onPress={handleVerifyCredentials}
                                        disabled={isVerifying}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={isVerifying ? ['#A0AEC0', '#718096'] : ['#3182CE', '#2C5282']}
                                            style={styles.button}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {isVerifying ? (
                                                <>
                                                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                                                    <Text style={styles.buttonText}>Verificando...</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                                    <Text style={styles.buttonText}>Verificar Identidad</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.form}>
                                    {/* Nueva contraseña */}
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.fieldLabel}>Nueva contraseña</Text>
                                        <View style={styles.inputWithIcon}>
                                            <View style={styles.inputIconContainer}>
                                                <Ionicons name="lock-closed-outline" size={18} color="#3182CE" />
                                            </View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Ingresa tu nueva contraseña"
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                                secureTextEntry
                                                placeholderTextColor="#A0AEC0"
                                            />
                                        </View>
                                    </View>

                                    {/* Confirmar contraseña */}
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.fieldLabel}>Confirmar contraseña</Text>
                                        <View style={styles.inputWithIcon}>
                                            <View style={styles.inputIconContainer}>
                                                <Ionicons name="lock-closed-outline" size={18} color="#3182CE" />
                                            </View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Confirma tu nueva contraseña"
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                secureTextEntry
                                                placeholderTextColor="#A0AEC0"
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.buttonContainer}
                                        onPress={handleUpdatePassword}
                                        disabled={isUpdating}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={isUpdating ? ['#A0AEC0', '#718096'] : ['#3182CE', '#2C5282']}
                                            style={styles.button}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                                                    <Text style={styles.buttonText}>Actualizando...</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="save-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                                    <Text style={styles.buttonText}>Actualizar Contraseña</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </Animated.View>
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
    recoverySection: {
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
    recoveryHeader: {
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
    recoveryTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 8,
    },
    recoverySubtitle: {
        fontSize: 16,
        color: '#718096',
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
    },
    successMessageContainer: {
        backgroundColor: '#F0FFF4',
        borderLeftWidth: 4,
        borderLeftColor: '#48BB78',
    },
    errorMessageContainer: {
        backgroundColor: '#FFF5F5',
        borderLeftWidth: 4,
        borderLeftColor: '#FC8181',
    },
    messageIcon: {
        marginRight: 8,
    },
    messageText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    successMessage: {
        color: '#276749',
    },
    errorMessage: {
        color: '#C53030',
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
    input: {
        flex: 1,
        height: 48,
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#2D3748',
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
        backgroundColor: '#F7FAFC',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 8,
        minHeight: 48,
    },
    dropdownList: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
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
        color: '#2D3748',
    },
    dropdownPlaceholder: {
        color: '#A0AEC0',
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 48,
        marginLeft: 50,
    },
    loadingText: {
        marginLeft: 10,
        color: '#718096',
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
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