import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import { push } from 'expo-router/build/global-state/routing';

interface PantallaRegistro1Props {
    onNext: (email: string, password: string) => void;
    isLoading?: boolean;
};

export default function PantallaRegistro1({ onNext, isLoading = false }: PantallaRegistro1Props) {
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [surname, setSurname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isRegistering, setIsRegistering] = useState(false); // Añadir este estado


    // Cambiar nombre de handleNext a handleRegister para que coincida con el botón
    const handleRegister = async () => {
        try {
            setIsRegistering(true); // Establecer estado de registro
            const response = await axios.post('http://localhost:8082/api/users/register', { //(IPCONFIG)
                name,
                lastName,
                surname,
                phone,
                email,
                password,
            });
            if (response.status === 201) {
                setMessage('Registro exitoso!');
                // En lugar de redireccionar aquí, pasamos el email y password al padre
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
});

function setIsRegistering(arg0: boolean) {
    throw new Error('Function not implemented.');
}
