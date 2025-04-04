import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Animated,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import InputApp from './Inputapp';
import IPS from '../config/IPS';
import { useAppTheme } from '../hooks/useAppTheme'; // Importar el hook de tema

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

interface PantallaRegistro1Props {
    onNext: (email: string, password: string) => void;
    isLoading?: boolean;
};

interface SecretQuestion {
    _id: number;
    pregunta: string;
}

export default function PantallaRegistro1({ onNext, isLoading = false }: PantallaRegistro1Props) {
    // Obtenemos colores y estilos del tema
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme();

    // Campos de formulario
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [surname, setSurname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretAnswer, setSecretAnswer] = useState('');

    // Estados para validaciones
    const [nameValid, setNameValid] = useState(false);
    const [lastNameValid, setLastNameValid] = useState(false);
    const [surnameValid, setSurnameValid] = useState(false);
    const [phoneValid, setPhoneValid] = useState(false);
    const [emailValid, setEmailValid] = useState(false);
    const [passwordValid, setPasswordValid] = useState(false);

    // Estados restantes
    const [message, setMessage] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [secretQuestions, setSecretQuestions] = useState<SecretQuestion[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<number>(0);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

    // Estados necesarios para DropDownPicker
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<{ label: string, value: number }[]>([]);

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

    // Cargar preguntas secretas al montar el componente
    useEffect(() => {
        const loadSecretQuestions = async () => {
            try {
                setIsLoadingQuestions(true);
                const response = await axios.get<SecretQuestion[]>(`${IPS.SERVER_URL}/api/secretQuestions`);

                if (response.status === 200) {
                    console.log('Datos recibidos:', response.data);

                    const validQuestions = response.data.filter(q => q && q._id !== undefined);
                    setSecretQuestions(validQuestions);

                    const dropdownItems = validQuestions.map(question => ({
                        label: question.pregunta,
                        value: question._id,
                        key: `question_${String(question._id || 'unknown')}`
                    }));

                    setItems(dropdownItems);

                    if (validQuestions.length > 0) {
                        setSelectedQuestion(validQuestions[0]._id);
                    }
                }
            } catch (error) {
                console.error('Error al cargar preguntas secretas:', error);

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

    // Verificar si todos los campos requeridos son válidos
    const areAllRequiredFieldsValid = () => {
        return nameValid &&
            lastNameValid &&
            emailValid &&
            passwordValid &&
            selectedQuestion &&
            secretAnswer.trim() !== '';
    };

    // Definir los colores del gradiente para el botón según el tema y estado
    const getButtonGradientColors = (): readonly [string, string] => {
        if (!areAllRequiredFieldsValid() || isRegistering || isLoading) {
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

    const handleRegister = async () => {
        // Validar campos usando los estados de validación
        if (!areAllRequiredFieldsValid()) {
            setMessage('Por favor completa todos los campos obligatorios correctamente');
            return;
        }

        try {
            setIsRegistering(true);
            const response = await axios.post(`${IPS.SERVER_URL}/api/users/register`, {
                name,
                lastName,
                surname,
                phone,
                email,
                password,
                secretQuestion: selectedQuestion,
                secretAnswer
            });

            if (response.status === 201) {
                setMessage('Registro exitoso!');
                onNext(email, password);
            }
        } catch (error: any) {
            console.error('Error al registrar el usuario:', error);
            setMessage(error.response?.data?.message || 'Error al registrar usuario');
        } finally {
            setIsRegistering(false);
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
                    <View style={localStyles.registerHeader}>
                        <View style={[localStyles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                            <Feather name="user-plus" size={36} color={colors.primary} />
                        </View>
                        <Text style={[baseStyles.title, { textAlign: 'center' }]}>Crear Cuenta</Text>
                        <Text style={[baseStyles.secondaryText, { textAlign: 'center', maxWidth: '90%', lineHeight: 22 }]}>
                            Complete los siguientes campos para registrarse en nuestra plataforma
                        </Text>
                    </View>

                    <View style={[baseStyles.section, { marginTop: 20 }]}>
                        {/* Nombre */}
                        <View style={localStyles.fieldContainer}>
                            <Text style={[baseStyles.secondaryText, { fontWeight: '500', marginBottom: 6 }]}>
                                Nombre <Text style={localStyles.requiredMark}>*</Text>
                            </Text>
                            <View style={localStyles.inputWithIcon}>
                                <View style={[localStyles.inputIconContainer, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="person-outline" size={18} color={colors.primary} />
                                </View>
                                <InputApp
                                    tipo="nombre"
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Ingresa tu nombre"
                                    showValidation={name.length > 0}
                                    onValidationChange={setNameValid}
                                    containerStyle={localStyles.customInputContainer}
                                    maxLength={20}
                                />
                            </View>
                        </View>

                        {/* Apellido paterno */}
                        <View style={localStyles.fieldContainer}>
                            <Text style={[baseStyles.secondaryText, { fontWeight: '500', marginBottom: 6 }]}>
                                Apellido paterno <Text style={localStyles.requiredMark}>*</Text>
                            </Text>
                            <View style={localStyles.inputWithIcon}>
                                <View style={[localStyles.inputIconContainer, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="person-outline" size={18} color={colors.primary} />
                                </View>
                                <InputApp
                                    tipo="nombre"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Ingresa tu apellido paterno"
                                    showValidation={lastName.length > 0}
                                    onValidationChange={setLastNameValid}
                                    containerStyle={localStyles.customInputContainer}
                                    maxLength={20}
                                />
                            </View>
                        </View>

                        {/* Apellido materno */}
                        <View style={localStyles.fieldContainer}>
                            <Text style={[baseStyles.secondaryText, { fontWeight: '500', marginBottom: 6 }]}>
                                Apellido materno
                            </Text>
                            <View style={localStyles.inputWithIcon}>
                                <View style={[localStyles.inputIconContainer, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="person-outline" size={18} color={colors.primary} />
                                </View>
                                <InputApp
                                    tipo="nombre"
                                    value={surname}
                                    onChangeText={setSurname}
                                    placeholder="Ingresa tu apellido materno"
                                    showValidation={surname.length > 0}
                                    onValidationChange={setSurnameValid}
                                    containerStyle={localStyles.customInputContainer}
                                    maxLength={20}
                                />
                            </View>
                        </View>

                        {/* Teléfono */}
                        <View style={localStyles.fieldContainer}>
                            <Text style={[baseStyles.secondaryText, { fontWeight: '500', marginBottom: 6 }]}>
                                Teléfono
                            </Text>
                            <View style={localStyles.inputWithIcon}>
                                <View style={[localStyles.inputIconContainer, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="call-outline" size={18} color={colors.primary} />
                                </View>
                                <InputApp
                                    tipo="telefono"
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Ingresa tu teléfono (10 dígitos)"
                                    showValidation={phone.length > 0}
                                    onValidationChange={setPhoneValid}
                                    containerStyle={localStyles.customInputContainer}
                                />
                            </View>
                        </View>

                        {/* Correo electrónico */}
                        <View style={localStyles.fieldContainer}>
                            <Text style={[baseStyles.secondaryText, { fontWeight: '500', marginBottom: 6 }]}>
                                Correo electrónico <Text style={localStyles.requiredMark}>*</Text>
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
                                Contraseña <Text style={localStyles.requiredMark}>*</Text>
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
                                    showValidation={password.length > 0}
                                    onValidationChange={setPasswordValid}
                                    containerStyle={localStyles.customInputContainer}
                                />
                            </View>
                        </View>

                        {/* Pregunta secreta */}
                        <View style={localStyles.fieldContainer}>
                            <Text style={[baseStyles.secondaryText, { fontWeight: '500', marginBottom: 6 }]}>
                                Pregunta secreta <Text style={localStyles.requiredMark}>*</Text>
                            </Text>
                            {isLoadingQuestions ? (
                                <View style={[localStyles.loadingContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={[baseStyles.secondaryText, { marginLeft: 10 }]}>Cargando preguntas...</Text>
                                </View>
                            ) : (
                                <View style={localStyles.dropdownWithIcon}>
                                    <View style={[localStyles.inputIconContainer, { backgroundColor: colors.primaryLight }]}>
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
                                                backgroundColor: colors.input,
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

                        {/* Respuesta secreta */}
                        <View style={localStyles.fieldContainer}>
                            <Text style={[baseStyles.secondaryText, { fontWeight: '500', marginBottom: 6 }]}>
                                Respuesta secreta <Text style={localStyles.requiredMark}>*</Text>
                            </Text>
                            <View style={localStyles.inputWithIcon}>
                                <View style={[localStyles.inputIconContainer, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="key-outline" size={18} color={colors.primary} />
                                </View>
                                <TextInput
                                    style={[localStyles.input, {
                                        backgroundColor: colors.input,
                                        borderColor: colors.border,
                                        color: colors.text
                                    }]}
                                    placeholder="Ingresa tu respuesta secreta"
                                    value={secretAnswer}
                                    onChangeText={setSecretAnswer}
                                    placeholderTextColor={colors.secondaryText}
                                />
                            </View>
                        </View>

                        {message ? (
                            <View style={[
                                localStyles.messageContainer,
                                message.includes('exitoso')
                                    ? [localStyles.successMessageContainer, { backgroundColor: isDarkMode ? '#1C4532' : '#F0FFF4', borderLeftColor: colors.success }]
                                    : [localStyles.errorMessageContainer, { backgroundColor: isDarkMode ? '#3C1618' : '#FFF5F5', borderLeftColor: colors.error }]
                            ]}>
                                <Ionicons
                                    name={message.includes('exitoso') ? "checkmark-circle-outline" : "alert-circle-outline"}
                                    size={20}
                                    color={message.includes('exitoso') ? colors.success : colors.error}
                                    style={localStyles.messageIcon}
                                />
                                <Text style={[
                                    localStyles.messageText,
                                    message.includes('exitoso')
                                        ? { color: isDarkMode ? '#68D391' : '#276749' }
                                        : { color: isDarkMode ? '#FC8181' : '#C53030' }
                                ]}>
                                    {message}
                                </Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[
                                localStyles.registerButtonContainer,
                                {
                                    overflow: 'hidden',
                                    marginTop: 16,
                                    shadowOpacity: isDarkMode ? 0.2 : 0.15,
                                    elevation: isDarkMode ? 3 : 2
                                }
                            ]}
                            onPress={handleRegister}
                            disabled={!areAllRequiredFieldsValid() || isRegistering || isLoading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={getButtonGradientColors()}
                                style={localStyles.registerButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isRegistering || isLoading ? (
                                    <>
                                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                                        <Text style={baseStyles.primaryButtonText}>
                                            {isRegistering ? 'Registrando...' : 'Iniciando sesión...'}
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="person-add-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                        <Text style={baseStyles.primaryButtonText}>Crear Cuenta</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={localStyles.requiredFieldsNote}>
                            <Text style={[baseStyles.secondaryText, { fontSize: 13 }]}>
                                <Text style={localStyles.requiredMark}>*</Text> Campos obligatorios
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos locales específicos que no están en el sistema de temas
const localStyles = StyleSheet.create({
    registerHeader: {
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 2,
    },
    requiredMark: {
        color: '#E53E3E',
        fontWeight: 'bold',
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
    input: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
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
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 8,
    },
    dropdownList: {
        borderWidth: 1,
        borderRadius: 8,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginVertical: 16,
    },
    successMessageContainer: {
        borderLeftWidth: 4,
    },
    errorMessageContainer: {
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
    registerButtonContainer: {
        borderRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    requiredFieldsNote: {
        marginTop: 16,
        alignItems: 'center',
    },
});