import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Switch,
    StyleSheet,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BotonVolver from '../componentes/BotonVolver';

export default function PantallaConfigurarDispositivo() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState<{ name: string; macAddress: string; isOnline: boolean } | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Estado para los switches
    const [seguroActivo, setSeguroActivo] = useState(false);
    const [alarmaActiva, setAlarmaActiva] = useState(false);

    // Funciones para manejar el cambio de estado
    const toggleSeguro = () => setSeguroActivo(!seguroActivo);
    const toggleAlarma = () => setAlarmaActiva(!alarmaActiva);

    // Obtener la información del dispositivo al cargar la pantalla
    useEffect(() => {
        fetchDeviceInfo();
    }, []);

    const fetchDeviceInfo = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                Alert.alert('Error', 'No se encontró sesión. Inicie sesión nuevamente.');
                router.push('/Login1');
                return;
            }

            const response = await axios.get(
                'http://192.168.8.6:8082/api/devices/info',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setDeviceInfo(response.data as { name: string; macAddress: string; isOnline: boolean });
        } catch (error) {
            console.error('Error obteniendo información del dispositivo:', error);
            Alert.alert('Error', 'No se pudo obtener la información del dispositivo');
        } finally {
            setIsLoading(false);
        }
    };

    const validatePin = (text: string) => {
        // Solo permitir dígitos y limitar a 4 caracteres
        if (/^\d*$/.test(text) && text.length <= 4) {
            setNewPin(text);
        }
    };

    const handleChangePin = async () => {
        // Validar longitud del PIN
        if (newPin.length !== 4) {
            setErrorMsg('El PIN debe tener exactamente 4 dígitos');
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        try {
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                Alert.alert('Error', 'No se encontró sesión. Inicie sesión nuevamente.');
                router.push('/Login1');
                return;
            }

            const response = await axios.post(
                'http://192.168.8.6:8082/api/devices/update-pin',
                { devicePin: newPin },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                // Modificar la alerta para navegar a PantallaPuerta después de cerrar el modal
                Alert.alert(
                    'Éxito',
                    'El PIN del dispositivo ha sido actualizado correctamente.',
                    [{
                        text: 'OK',
                        onPress: () => {
                            setModalVisible(false); // Cerrar el modal
                            setNewPin(''); // Limpiar el campo

                            // Navegar a la pantalla de puerta
                            router.push('/puerta');
                        }
                    }]
                );
            }
        } catch (error) {
            console.error('Error actualizando PIN:', error);
            let message = 'Error al actualizar el PIN del dispositivo';

            if ((error as any).response?.data?.message) {
                message = (error as any).response.data.message;
            }
            setErrorMsg(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            {/* Botón para volver */}
            <BotonVolver destino="/puerta" />

            <ScrollView style={{ flex: 1 }}>
                {/* Tarjeta principal */}
                <View style={styles.cardContainer}>
                    {/* Contenido principal */}
                    <View style={styles.mainContent}>
                        <Text style={styles.title}>Configuración de mi dispositivo</Text>

                        {/* ID del dispositivo */}
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>ID del dispositivo</Text>
                            <TextInput
                                style={styles.input}
                                value={deviceInfo?.macAddress || "Cargando..."}
                                editable={false}
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Desactivar todos los seguros */}
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Desactivar todos los seguros</Text>
                            <Switch
                                value={seguroActivo}
                                onValueChange={toggleSeguro}
                                trackColor={{ false: "#767577", true: "#81b0ff" }}
                                thumbColor={seguroActivo ? "#4CAF50" : "#f4f3f4"}
                            />
                        </View>

                        {/* Desactivar alarma sonora */}
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Desactivar alarma sonora</Text>
                            <Switch
                                value={alarmaActiva}
                                onValueChange={toggleAlarma}
                                trackColor={{ false: "#767577", true: "#81b0ff" }}
                                thumbColor={alarmaActiva ? "#4CAF50" : "#f4f3f4"}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => setModalVisible(true)}>
                            <Text style={styles.optionText}>Cambiar PIN de seguridad del dispositivo</Text>
                            <Ionicons name="chevron-forward-outline" size={20} color="#1E1E1E" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Modal para cambiar PIN */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Cambiar PIN del Dispositivo</Text>

                        <Text style={styles.modalSubtitle}>
                            Ingrese un nuevo PIN de 4 dígitos para acceder a su dispositivo
                        </Text>

                        <TextInput
                            style={styles.pinInput}
                            placeholder="Nuevo PIN (4 dígitos)"
                            value={newPin}
                            onChangeText={validatePin}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry={true}
                            autoFocus={true}
                        />

                        {errorMsg ? (
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        ) : null}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNewPin('');
                                    setErrorMsg('');
                                }}
                            >
                                <Text style={styles.buttonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.confirmButton,
                                    newPin.length !== 4 && styles.disabledButton
                                ]}
                                onPress={handleChangePin}
                                disabled={newPin.length !== 4 || isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Guardar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    /* Fondo azul suave */
    screen: {
        flex: 1,
        backgroundColor: '#CFE2FF',
        paddingTop: 50, // Dar espacio para el botón de volver
    },
    cardContainer: {
        margin: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        // Sombra en iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        // Sombra en Android
        elevation: 6,
    },
    /* Contenido principal */
    mainContent: {
        marginTop: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginBottom: 20,
    },
    /* Fila con etiqueta e input */
    inputRow: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#1E1E1E',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        color: '#1E1E1E',
    },
    /* Fila con etiqueta y toggle */
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    toggleLabel: {
        fontSize: 16,
        color: '#1E1E1E',
    },
    /* Opciones extra (con flecha a la derecha) */
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 14,
        marginBottom: 10,
    },
    optionText: {
        fontSize: 16,
        color: '#1E1E1E',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 10,
    },
    // Estilos del modal
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '85%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    pinInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        width: '100%',
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: 10,
    },
    errorText: {
        color: '#F44336',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        padding: 12,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#757575',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
    },
    disabledButton: {
        backgroundColor: '#A5D6A7',
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});