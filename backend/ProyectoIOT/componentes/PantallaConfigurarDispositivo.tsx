import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';

export default function PantallaConfigurarDispositivo() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState<{ name: string; macAddress: string; isOnline: boolean } | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

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
                router.push('/login' as any);
                return;
            }

            const response = await axios.get(
                'http://192.168.8.5:8082/api/devices/info',
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
                router.push('/login' as any);
                return;
            }

            const response = await axios.post(
                'http://192.168.8.5:8082/api/devices/update-pin',
                { devicePin: newPin },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                Alert.alert(
                    'Éxito',
                    'El PIN del dispositivo ha sido actualizado correctamente.',
                    [{ text: 'OK', onPress: () => setModalVisible(false) }]
                );
                setNewPin('');
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Configuración del Dispositivo</Text>
            </View>

            {isLoading && !modalVisible ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loadingText}>Cargando información...</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    {deviceInfo ? (
                        <>
                            <View style={styles.infoCard}>
                                <Text style={styles.infoTitle}>Información del Dispositivo</Text>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Nombre:</Text>
                                    <Text style={styles.infoValue}>{deviceInfo.name}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Dirección MAC:</Text>
                                    <Text style={styles.infoValue}>{deviceInfo.macAddress}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Estado:</Text>
                                    <View style={styles.statusContainer}>
                                        <View style={[
                                            styles.statusDot,
                                            { backgroundColor: deviceInfo.isOnline ? '#4CAF50' : '#F44336' }
                                        ]} />
                                        <Text style={styles.infoValue}>
                                            {deviceInfo.isOnline ? 'En línea' : 'Desconectado'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.optionsContainer}>
                                <Text style={styles.sectionTitle}>Seguridad</Text>
                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={() => setModalVisible(true)}
                                >
                                    <FontAwesome5 name="key" size={20} color="#fff" />
                                    <Text style={styles.optionButtonText}>
                                        Cambiar PIN del Dispositivo
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <Text style={styles.noDeviceText}>
                            No se encontró información del dispositivo.
                        </Text>
                    )}
                </View>
            )}

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
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#3F51B5',
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: '500',
        width: 120,
        color: '#555',
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    optionsContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    optionButton: {
        backgroundColor: '#3F51B5',
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    noDeviceText: {
        fontSize: 18,
        textAlign: 'center',
        color: '#666',
        marginTop: 40,
    },
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