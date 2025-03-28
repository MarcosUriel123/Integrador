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
import BotonVolver from '../componentes/BotonVolver';
import InputApp from './Inputapp';
import Header from './Header';
import Footer from './Footer';

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
                const response = await axios.get<SecretQuestion[]>('http://192.168.0.75:8082/api/secretQuestions');

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

    const handleRegister = async () => {
        // Validar campos usando los estados de validación
        if (!areAllRequiredFieldsValid()) {
            setMessage('Por favor completa todos los campos obligatorios correctamente');
            return;
        }

        try {
            setIsRegistering(true);
            const response = await axios.post('http://192.168.0.75:8082/api/users/register', {
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
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Registro de Usuario" showMenu={false} />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/Login1" />
                    </View>

                    <Animated.View
                        style={[
                            styles.formSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <View style={styles.formHeader}>
                            <View style={styles.iconContainer}>
                                <Feather name="user-plus" size={36} color="#3182CE" />
                            </View>
                            <Text style={styles.formTitle}>Crear Cuenta</Text>
                            <Text style={styles.formSubtitle}>
                                Complete los siguientes campos para registrarse en nuestra plataforma
                            </Text>
                        </View>

                        <View style={styles.formFields}>
                            {/* Nombre */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Nombre <Text style={styles.requiredMark}>*</Text></Text>
                                <View style={styles.inputWithIcon}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="person-outline" size={18} color="#3182CE" />
                                    </View>
                                    <InputApp
                                        tipo="nombre"
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Ingresa tu nombre"
                                        showValidation={name.length > 0}
                                        onValidationChange={setNameValid}
                                        containerStyle={styles.customInputContainer}
                                        maxLength={20}
                                    />
                                </View>
                            </View>

                            {/* Apellido paterno */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Apellido paterno <Text style={styles.requiredMark}>*</Text></Text>
                                <View style={styles.inputWithIcon}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="person-outline" size={18} color="#3182CE" />
                                    </View>
                                    <InputApp
                                        tipo="nombre"
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder="Ingresa tu apellido paterno"
                                        showValidation={lastName.length > 0}
                                        onValidationChange={setLastNameValid}
                                        containerStyle={styles.customInputContainer}
                                        maxLength={20}
                                    />
                                </View>
                            </View>

                            {/* Apellido materno */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Apellido materno</Text>
                                <View style={styles.inputWithIcon}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="person-outline" size={18} color="#3182CE" />
                                    </View>
                                    <InputApp
                                        tipo="nombre"
                                        value={surname}
                                        onChangeText={setSurname}
                                        placeholder="Ingresa tu apellido materno"
                                        showValidation={surname.length > 0}
                                        onValidationChange={setSurnameValid}
                                        containerStyle={styles.customInputContainer}
                                        maxLength={20}
                                    />
                                </View>
                            </View>

                            {/* Teléfono */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Teléfono</Text>
                                <View style={styles.inputWithIcon}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="call-outline" size={18} color="#3182CE" />
                                    </View>
                                    <InputApp
                                        tipo="telefono"
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="Ingresa tu teléfono (10 dígitos)"
                                        showValidation={phone.length > 0}
                                        onValidationChange={setPhoneValid}
                                        containerStyle={styles.customInputContainer}
                                    />
                                </View>
                            </View>

                            {/* Correo electrónico */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Correo electrónico <Text style={styles.requiredMark}>*</Text></Text>
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
                                <Text style={styles.fieldLabel}>Contraseña <Text style={styles.requiredMark}>*</Text></Text>
                                <View style={styles.inputWithIcon}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="lock-closed-outline" size={18} color="#3182CE" />
                                    </View>
                                    <InputApp
                                        tipo="contrasenna"
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Ingresa tu contraseña"
                                        showValidation={password.length > 0}
                                        onValidationChange={setPasswordValid}
                                        containerStyle={styles.customInputContainer}
                                    />
                                </View>
                            </View>

                            {/* Pregunta secreta */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Pregunta secreta <Text style={styles.requiredMark}>*</Text></Text>
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
                                <Text style={styles.fieldLabel}>Respuesta secreta <Text style={styles.requiredMark}>*</Text></Text>
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

                            {message ? (
                                <View style={[
                                    styles.messageContainer,
                                    message.includes('exitoso') ? styles.successMessageContainer : styles.errorMessageContainer
                                ]}>
                                    <Ionicons
                                        name={message.includes('exitoso') ? "checkmark-circle-outline" : "alert-circle-outline"}
                                        size={20}
                                        color={message.includes('exitoso') ? "#38A169" : "#E53E3E"}
                                        style={styles.messageIcon}
                                    />
                                    <Text style={[
                                        styles.messageText,
                                        message.includes('exitoso') ? styles.successMessage : styles.errorMessage
                                    ]}>
                                        {message}
                                    </Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                style={styles.registerButtonContainer}
                                onPress={handleRegister}
                                disabled={!areAllRequiredFieldsValid() || isRegistering || isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={
                                        !areAllRequiredFieldsValid() || isRegistering || isLoading
                                            ? ['#A0AEC0', '#718096']
                                            : ['#3182CE', '#2C5282']
                                    }
                                    style={styles.registerButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isRegistering || isLoading ? (
                                        <>
                                            <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                                            <Text style={styles.registerButtonText}>
                                                {isRegistering ? 'Registrando...' : 'Iniciando sesión...'}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="person-add-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                            <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.requiredFieldsNote}>
                                <Text style={styles.requiredFieldsText}>
                                    <Text style={styles.requiredMark}>*</Text> Campos obligatorios
                                </Text>
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
    formSection: {
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
    formHeader: {
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
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 8,
    },
    formSubtitle: {
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
    requiredMark: {
        color: '#E53E3E',
        fontWeight: 'bold',
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
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginVertical: 16,
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
    registerButtonContainer: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    buttonIcon: {
        marginRight: 8,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    requiredFieldsNote: {
        marginTop: 16,
        alignItems: 'center',
    },
    requiredFieldsText: {
        fontSize: 13,
        color: '#718096',
    },
});