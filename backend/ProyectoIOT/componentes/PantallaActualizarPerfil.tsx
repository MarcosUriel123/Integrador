import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import BotonVolver from '../componentes/BotonVolver'; // Asegúrate de que la ruta sea correcta
import DropDownPicker from 'react-native-dropdown-picker';
import IPS from '../config/IPS'; // Importamos la configuración de IPs

// Define la interfaz para el objeto Usuario
interface User {
    _id: string;
    name: string;
    lastName: string;
    surname?: string;
    phone?: string;
    email: string;
    secretQuestion?: number;
    secretAnswer?: string;
    // Otros campos que pueda tener tu usuario
}

type Props = {
    userId: string;
};

export default function PantallaPerfil({ userId }: Props) {
    // Agregar el router para manejar la navegación
    const router = useRouter();

    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [surname, setSurname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localUserId, setLocalUserId] = useState<string | null>(userId || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [secretQuestion, setSecretQuestion] = useState<number>(1);
    const [secretAnswer, setSecretAnswer] = useState('');
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([
        { label: '¿Cuál es tu comida favorita?', value: 1 },
        { label: '¿Nombre de tu primera mascota?', value: 2 },
        { label: '¿Ciudad donde naciste?', value: 3 },
        { label: '¿Nombre de tu escuela primaria?', value: 4 },
        { label: '¿Cuál es tu película favorita?', value: 5 },
    ]);

    // Obtener el userId desde AsyncStorage si no se proporcionó como prop
    useEffect(() => {
        const getUserIdFromStorage = async () => {
            try {
                if (!localUserId) {
                    // Intenta obtener el userId del token o de AsyncStorage
                    const storedUserId = await AsyncStorage.getItem('userId');
                    if (storedUserId) {
                        setLocalUserId(storedUserId);
                    } else {
                        setError('No se pudo encontrar el ID de usuario');
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error('Error al obtener userId de AsyncStorage:', err);
                setError('Error al cargar datos de usuario');
                setLoading(false);
            }
        };

        getUserIdFromStorage();
    }, []);

    // Cargar datos del usuario cuando tengamos un userId válido
    useEffect(() => {
        if (localUserId) {
            fetchUserData();
        }
    }, [localUserId]);

    const fetchUserData = async () => {
        if (!localUserId) {
            console.error('No hay userId disponible para obtener datos');
            setError('No se puede cargar el perfil sin ID de usuario');
            return;
        }

        try {
            console.log(`Intentando obtener datos para userId: ${localUserId}`);
            // Usar la interfaz User como tipo genérico
            const response = await axios.get<User>(`${IPS.SERVER_URL}/api/users/${localUserId}`);
            const user = response.data;  // Ahora user tiene el tipo User

            setName(user.name || '');
            setLastName(user.lastName || '');
            setSurname(user.surname || '');
            setPhone(user.phone || '');
            setEmail(user.email || '');
            setSecretQuestion(user.secretQuestion || 1);
            setSecretAnswer(user.secretAnswer || '');
            setError(''); // Limpiar cualquier error anterior
        } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            setError('Error al cargar los datos del perfil');
        }
    };

    // Función handleSubmit corregida
    const handleSubmit = async () => {
        if (!localUserId) {
            Alert.alert('Error', 'No se pudo identificar el usuario para actualizar');
            return;
        }

        // Validar que haya datos para actualizar
        if (!name || !lastName || !email) {
            Alert.alert('Error', 'Los campos Nombre, Apellido Paterno y Correo son obligatorios');
            return;
        }

        // Incluir todos los campos que podrían ser actualizados en la base de datos
        const updateData = {
            name,
            lastName,
            surname,
            email,
            phone
        };

        try {
            // Obtener el token de autenticación
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                Alert.alert('Error', 'No hay sesión activa. Por favor, inicia sesión nuevamente.');
                return;
            }

            // CORRECCIÓN: Usar exactamente la ruta definida en userRoutes.ts
            const response = await axios.put(
                `${IPS.SERVER_URL}/api/users/update/${localUserId}`,
                updateData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                Alert.alert(
                    'Éxito',
                    'Datos actualizados correctamente',
                    [
                        {
                            text: 'Ver perfil',
                            onPress: () => router.replace('/Datosperfil')
                        }
                    ]
                );
            }
        } catch (error: any) {
            console.error('Error al actualizar:', error);
            const errorMessage = error.response?.data?.error || 'No se pudo actualizar la información';
            Alert.alert('Error', errorMessage);
        }
    };

    if (loading) {
        return (
            <View style={[styles.screen, styles.loadingContainer]}>
                <Text>Cargando perfil...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.screen, styles.errorContainer]}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.button} onPress={() => fetchUserData()}>
                    <Text style={styles.buttonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Mi Perfil</Text>
                        <BotonVolver destino="/Datosperfil" />
                    </View>
                    <View style={styles.contentContainer}>
                        <Feather name="user" size={80} color="black" style={styles.icon} />

                        <Text style={styles.label}>Nombre</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Apellido paterno</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                        />

                        <Text style={styles.label}>Apellido materno</Text>
                        <TextInput
                            style={styles.input}
                            value={surname}
                            onChangeText={setSurname}
                        />

                        <Text style={styles.label}>Correo electrónico</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                        />

                        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                            <Text style={styles.buttonText}>Guardar Cambios</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
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
    errorText: {
        color: 'red',
        fontSize: 16,
        marginBottom: 10,
    },
    // Agregar estilo para el botón de regreso
    backButton: {
        position: 'absolute',
        left: 0,
        padding: 10,
    },
    dropdownContainer: {
        width: '100%',
        marginBottom: 15,
        zIndex: 3000,
    },
    dropdown: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
    },
    dropdownList: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
    },
});