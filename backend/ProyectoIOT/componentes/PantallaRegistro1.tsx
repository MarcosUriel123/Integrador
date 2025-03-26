import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';

interface PantallaRegistro1Props {
    onNext: (email: string, password: string) => void;
    isLoading?: boolean;
};

interface SecretQuestion {
    _id: number;
    pregunta: string;
}

export default function PantallaRegistro1({ onNext, isLoading = false }: PantallaRegistro1Props) {
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [surname, setSurname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [secretQuestions, setSecretQuestions] = useState<SecretQuestion[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<number>(0);
    const [secretAnswer, setSecretAnswer] = useState('');
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

    // Estados necesarios para DropDownPicker
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<{ label: string, value: number }[]>([]);

    // Cargar preguntas secretas al montar el componente
    useEffect(() => {
        const loadSecretQuestions = async () => {
            try {
                setIsLoadingQuestions(true);
                // Añadir el tipo genérico para la respuesta
                const response = await axios.get<SecretQuestion[]>('http://192.168.8.4:8082/api/secretQuestions');
                if (response.status === 200) {
                    setSecretQuestions(response.data);

                    // Convertir las preguntas al formato que necesita DropDownPicker
                    const dropdownItems = response.data.map(question => ({
                        label: question.pregunta,
                        value: question._id
                    }));
                    setItems(dropdownItems);

                    // Seleccionar la primera pregunta por defecto si hay preguntas
                    if (response.data.length > 0) {
                        setSelectedQuestion(response.data[0]._id);
                    }
                }
            } catch (error) {
                console.error('Error al cargar preguntas secretas:', error);
            } finally {
                setIsLoadingQuestions(false);
            }
        };

        loadSecretQuestions();
    }, []);

    const handleRegister = async () => {
        // Validar campos
        if (!name || !lastName || !email || !password || !selectedQuestion || !secretAnswer) {
            setMessage('Por favor completa todos los campos obligatorios');
            return;
        }

        try {
            setIsRegistering(true);
            const response = await axios.post('http://192.168.8.4:8082/api/users/register', {
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
        } catch (error) {
            console.error('Error al registrar el usuario:', error);
            setMessage('Error al registrar usuario');
        } finally {
            setIsRegistering(false);
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
                        <Feather name="user" size={80} color="black" style={styles.icon} />
                        <Text style={styles.title}>Registrarse</Text>
                        <Text style={styles.label}>Nombre</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu nombre"
                            value={name}
                            onChangeText={setName}
                        />
                        <Text style={styles.label}>Apellido paterno</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu apellido paterno"
                            value={lastName}
                            onChangeText={setLastName}
                        />
                        <Text style={styles.label}>Apellido materno</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu apellido materno"
                            value={surname}
                            onChangeText={setSurname}
                        />
                        <Text style={styles.label}>Teléfono</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu teléfono"
                            value={phone}
                            onChangeText={setPhone}
                        />
                        <Text style={styles.label}>Correo electrónico</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu correo electrónico"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu contraseña"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        {/* Reemplazar el Picker con DropDownPicker */}
                        <Text style={styles.label}>Pregunta secreta</Text>
                        {isLoadingQuestions ? (
                            <Text>Cargando preguntas...</Text>
                        ) : (
                            <View style={styles.dropdownContainer}>
                                <DropDownPicker
                                    open={open}
                                    value={selectedQuestion}
                                    items={items}
                                    setOpen={setOpen}
                                    setValue={setSelectedQuestion}
                                    setItems={setItems}
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


                        {/* Campo para respuesta secreta */}
                        <Text style={styles.label}>Respuesta secreta</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu respuesta secreta"
                            value={secretAnswer}
                            onChangeText={setSecretAnswer}
                        />

                        {message ? <Text style={styles.messageText}>{message}</Text> : null}
                        <TouchableOpacity
                            style={[styles.button, (isRegistering || isLoading) && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isRegistering || isLoading}
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
    pickerContainer: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 15,
        overflow: 'hidden',
    },
    picker: {
        width: '100%',
        height: 40,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#007bff',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
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
        color: 'red',
        alignSelf: 'center',
    },
    dropdownContainer: {
        width: '100%',
        marginBottom: 15,
        zIndex: 1000, // Importante para que el dropdown se muestre sobre otros elementos
    },
    dropdown: {
        borderColor: '#ccc',
        borderRadius: 5,
    },
    dropdownList: {
        borderColor: '#ccc',
        maxHeight: 200,
    },
});