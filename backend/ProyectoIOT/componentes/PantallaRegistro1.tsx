import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import BotonVolver from '../componentes/BotonVolver';
import InputApp from './Inputapp';

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

    // Cargar preguntas secretas al montar el componente (sin cambios)
    useEffect(() => {
        const loadSecretQuestions = async () => {
            // Código existente para cargar preguntas...
            try {
                setIsLoadingQuestions(true);
                const response = await axios.get<SecretQuestion[]>('http://192.168.8.2:8082/api/secretQuestions');

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
            const response = await axios.post('http://192.168.8.2:8082/api/users/register', {
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <BotonVolver destino="/Login1" />
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                    </View>
                    <View style={styles.contentContainer}>
                        <Feather name="user" size={80} color="black" style={styles.icon} />
                        <Text style={styles.title}>Registrarse</Text>

                        {/* Nombre */}
                        <InputApp
                            tipo="nombre"
                            value={name}
                            onChangeText={setName}
                            placeholder="Ingresa tu nombre"
                            label="Nombre"
                            showValidation={name.length > 0}
                            onValidationChange={setNameValid}
                            containerStyle={styles.inputContainer}
                            maxLength={20}
                        />

                        {/* Apellido paterno */}
                        <InputApp
                            tipo="nombre"
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Ingresa tu apellido paterno"
                            label="Apellido paterno"
                            showValidation={lastName.length > 0}
                            onValidationChange={setLastNameValid}
                            containerStyle={styles.inputContainer}
                            maxLength={20}
                        />

                        {/* Apellido materno */}
                        <InputApp
                            tipo="nombre"
                            value={surname}
                            onChangeText={setSurname}
                            placeholder="Ingresa tu apellido materno"
                            label="Apellido materno"
                            showValidation={surname.length > 0}
                            onValidationChange={setSurnameValid}
                            containerStyle={styles.inputContainer}
                            maxLength={20}
                        />

                        {/* Teléfono */}
                        <InputApp
                            tipo="telefono"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Ingresa tu teléfono (10 dígitos)"
                            label="Teléfono"
                            showValidation={phone.length > 0}
                            onValidationChange={setPhoneValid}
                            containerStyle={styles.inputContainer}
                        />

                        {/* Correo electrónico */}
                        <InputApp
                            tipo="correo"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Ingresa tu correo electrónico"
                            label="Correo electrónico"
                            showValidation={email.length > 0}
                            onValidationChange={setEmailValid}
                            containerStyle={styles.inputContainer}
                        />

                        {/* Contraseña */}
                        <InputApp
                            tipo="contrasenna"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Ingresa tu contraseña"
                            label="Contraseña"
                            showValidation={password.length > 0}
                            onValidationChange={setPasswordValid}
                            containerStyle={styles.inputContainer}
                        />

                        {/* Pregunta secreta (sin cambios) */}
                        <Text style={styles.label}>Pregunta secreta</Text>
                        {isLoadingQuestions ? (
                            <Text>Cargando preguntas...</Text>
                        ) : (
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
                                />
                            </View>
                        )}

                        {/* Respuesta secreta - Usamos TextInput normal para este campo */}
                        <Text style={styles.label}>Respuesta secreta</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu respuesta secreta"
                            value={secretAnswer}
                            onChangeText={setSecretAnswer}
                        />

                        {message ? <Text style={[styles.messageText, message.includes('exitoso') ? styles.successMessage : styles.errorMessage]}>{message}</Text> : null}

                        <TouchableOpacity
                            style={[
                                styles.button,
                                (!areAllRequiredFieldsValid() || isRegistering || isLoading) && styles.buttonDisabled
                            ]}
                            onPress={handleRegister}
                            disabled={!areAllRequiredFieldsValid() || isRegistering || isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isRegistering ? 'Registrando...' : isLoading ? 'Iniciando sesión...' : 'Registrarse'}
                            </Text>
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
        paddingVertical: 20,
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

    // Estilos para InputApp
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },

    // Estilos existentes que todavía se usan
    label: {
        alignSelf: 'flex-start',
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        width: '100%',
        height: 45,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    dropdownContainer: {
        width: '100%',
        marginBottom: 15,
        zIndex: 1000,
    },
    dropdown: {
        borderColor: '#ccc',
        borderRadius: 5,
    },
    dropdownList: {
        borderColor: '#ccc',
        maxHeight: 200,
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
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    messageText: {
        marginVertical: 10,
        fontSize: 16,
        alignSelf: 'center',
    },
    errorMessage: {
        color: 'red',
    },
    successMessage: {
        color: 'green',
    }
});