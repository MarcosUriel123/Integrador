// app/recovery.tsx
import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import DropDownPicker from 'react-native-dropdown-picker';
import BotonVolver from '../componentes/BotonVolver';
import axios from 'axios';

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

    // Cargar preguntas secretas al montar el componente
    useEffect(() => {
        const loadSecretQuestions = async () => {
            try {
                setIsLoadingQuestions(true);
                // Aquí usamos la misma API que en PantallaRegistro1
                const response = await axios.get<SecretQuestion[]>('http://192.168.8.2:8082/api/secretQuestions');

                if (response.status === 200) {
                    setSecretQuestions(response.data);

                    // Convertir las preguntas al formato que necesita DropDownPicker
                    const dropdownItems = response.data.map(question => ({
                        label: question.pregunta,
                        value: question._id,
                        key: `question_${String(question._id || '')}`
                    }));

                    setItems(dropdownItems);

                    // Seleccionar la primera pregunta por defecto
                    if (response.data.length > 0) {
                        setSelectedQuestion(response.data[0]._id);
                    }
                }
            } catch (error) {
                console.error('Error al cargar preguntas secretas:', error);
                setMessage('No se pudieron cargar las preguntas secretas');
                setMessageType('error');

                // Datos de prueba en caso de error
                const mockData = [
                    { _id: 1, pregunta: "¿Cuál es el nombre de tu primera mascota?" },
                    { _id: 2, pregunta: "¿En qué ciudad naciste?" },
                    { _id: 3, pregunta: "¿Cómo se llama tu mejor amigo?" }
                ];

                setSecretQuestions(mockData);
                const dropdownItems = mockData.map(q => ({
                    label: q.pregunta,
                    value: q._id,
                    key: `fallback_${String(q._id)}`
                }));
                setItems(dropdownItems);
                setSelectedQuestion(mockData[0]._id);
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
            const response = await axios.post('http://192.168.8.2:8082/api/users/verify-recovery', {
                email,
                secretQuestion: selectedQuestion,
                secretAnswer
            });

            if (response.status === 200) {
                setIsVerified(true);
                setMessage('Verificación exitosa. Por favor ingresa tu nueva contraseña.');
                setMessageType('success');
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
            const response = await axios.post('http://192.168.8.2:8082/api/users/reset-password', {
                email,
                secretQuestion: selectedQuestion,
                secretAnswer,
                newPassword
            });

            if (response.status === 200) {
                setMessage('¡Éxito! Tu contraseña ha sido actualizada. Ya puedes iniciar sesión con tu nueva contraseña.');
                setMessageType('success');

                Alert.alert(
                    "¡Éxito!",
                    "Tu contraseña ha sido actualizada. Ya puedes iniciar sesión con tu nueva contraseña.",
                    [{ text: "Ir a iniciar sesión", onPress: () => router.push('/Login1') }]
                );

                // Pequeño retraso antes de redirigir para que el usuario pueda ver el mensaje de éxito
                setTimeout(() => {
                    router.push('/Login1');
                }, 1500); // 1.5 segundos de retraso para que el usuario pueda ver el mensaje
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Tarjeta blanca */}
                <View style={styles.cardContainer}>
                    {/* Barra Superior */}
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                        {/* Botón de regreso */}
                    </View>
                    <BotonVolver destino="/Login1" />

                    {/* Contenido principal */}
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>Recuperación de contraseña</Text>

                        {/* Ícono de huella digital */}
                        <View style={styles.iconContainer}>
                            <FontAwesome6 name="fingerprint" size={120} color="black" />
                        </View>

                        {/* Mensaje de estado (error o éxito) */}
                        {message ? (
                            <Text style={[
                                styles.messageText,
                                messageType === 'success' ? styles.successMessage : styles.errorMessage
                            ]}>
                                {message}
                            </Text>
                        ) : null}

                        {/* Formulario de verificación (paso 1) */}
                        {!isVerified ? (
                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Correo electrónico</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="correo@ejemplo.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Pregunta secreta</Text>
                                    {isLoadingQuestions ? (
                                        <ActivityIndicator size="small" color="#1E1E1E" />
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
                                                listMode="MODAL" // Cambiar de SCROLLVIEW a MODAL
                                                modalProps={{
                                                    animationType: "slide"
                                                }}
                                                schema={{
                                                    label: 'label',
                                                    value: 'value',
                                                    icon: 'icon',
                                                    parent: 'parent',
                                                    selectable: 'selectable'
                                                }}
                                                zIndex={3000}
                                                zIndexInverse={1000}
                                            />
                                        </View>
                                    )}
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Respuesta a tu pregunta secreta</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Respuesta"
                                        value={secretAnswer}
                                        onChangeText={setSecretAnswer}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, isVerifying && styles.buttonDisabled]}
                                    onPress={handleVerifyCredentials}
                                    disabled={isVerifying}
                                >
                                    <Text style={styles.buttonText}>
                                        {isVerifying ? 'Verificando...' : 'Verificar identidad'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* Formulario para nueva contraseña (paso 2) */
                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Nueva contraseña</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ingresa tu nueva contraseña"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirmar contraseña</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirma tu nueva contraseña"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, isUpdating && styles.buttonDisabled]}
                                    onPress={handleUpdatePassword}
                                    disabled={isUpdating}
                                >
                                    <Text style={styles.buttonText}>
                                        {isUpdating ? 'Actualizando...' : 'Actualizar contraseña'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
        margin: 20,
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
    backText: {
        fontSize: 24,
        color: '#1E1E1E',
    },
    contentContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#1E1E1E',
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    form: {
        width: '100%',
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        color: '#1E1E1E',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FFF',
    },
    dropdownContainer: {
        marginBottom: 10,
        zIndex: 3000,
    },
    dropdown: {
        borderColor: '#E8E8E8',
        borderRadius: 8,
    },
    dropdownList: {
        borderColor: '#E8E8E8',
    },
    messageText: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        width: '100%',
    },
    successMessage: {
        backgroundColor: '#d4edda',
        color: '#155724',
    },
    errorMessage: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
    },
    button: {
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        padding: 15,
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
    },
    buttonDisabled: {
        backgroundColor: '#666666',
    },
});