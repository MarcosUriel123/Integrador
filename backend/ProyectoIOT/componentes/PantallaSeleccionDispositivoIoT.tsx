import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from './Header';
import Footer from './Footer';
import BotonVolver from '../componentes/BotonVolver';

// Actualizar la interfaz para usar macAddress en lugar de mac
interface DeviceItem {
    _id: string;
    name: string;
    deviceId: string;
    macAddress: string; // Cambiar mac por macAddress
    status: string;
    isConfigured: boolean;
    serialNumber?: string;
    userId: string;
    pin?: string;
    createdAt: string;
    // isOnline removido
}

export default function PantallaSeleccionDispositivoIoT() {
    const router = useRouter();
    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Estado checkingStatus removido

    useEffect(() => {
        fetchUserDevices();
    }, []);

    // Función para obtener los dispositivos del usuario
    const fetchUserDevices = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                router.push('/Login1');
                return;
            }

            const response = await fetch('http://192.168.8.7:8082/api/devices/user-devices', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Dispositivos obtenidos:', data);

            // Transformar datos pero solo para isConfigured
            const transformedDevices = data.map((device: DeviceItem) => ({
                ...device,
                // Asegurar que isConfigured esté presente
                isConfigured: device.isConfigured === undefined
                    ? !!(device.name && device.pin)
                    : device.isConfigured
                // isOnline removido
            }));

            setDevices(transformedDevices);
            // Verificación de estado removida

            setError('');
        } catch (error) {
            console.error('Error al obtener dispositivos:', error);
            setError('No se pudieron cargar tus dispositivos');
            Alert.alert('Error', 'No se pudieron cargar tus dispositivos');
        } finally {
            setLoading(false);
        }
    };

    // Función checkDeviceStatus removida

    // Función para manejar la selección de un dispositivo
    const handleDeviceSelect = async (device: DeviceItem) => {
        try {
            // Si el dispositivo no está configurado, redirigir a la pantalla de configuración
            if (!device.isConfigured) {
                // Guardar el ID del dispositivo seleccionado para usarlo en la configuración
                await AsyncStorage.setItem('selectedDeviceId', device._id);
                router.push('/configurarDispositivo');
                return;
            }

            // Si el dispositivo está configurado, guardar su ID y proceder a la pantalla de control
            await AsyncStorage.setItem('selectedDeviceId', device._id);
            router.push('/puerta');
        } catch (error) {
            console.error('Error al seleccionar dispositivo:', error);
            Alert.alert('Error', 'No se pudo procesar tu selección');
        }
    };

    // Simplificar el renderizado para mostrar solo la MAC, sin estado
    const renderDeviceItem = ({ item }: { item: DeviceItem }) => (
        <TouchableOpacity
            style={[
                styles.deviceCard,
                !item.isConfigured && styles.deviceCardNotConfigured
            ]}
            onPress={() => handleDeviceSelect(item)}
        >
            <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name || 'Dispositivo sin nombre'}</Text>

                {/* Mostrar macAddress en lugar de mac */}
                <Text style={styles.deviceId}>MAC: {item.macAddress || 'No disponible'}</Text>

                {/* Sección de estado removida */}

                {!item.isConfigured && (
                    <View style={styles.configWarning}>
                        <Ionicons name="warning-outline" size={16} color="#f39c12" />
                        <Text style={styles.configWarningText}>Requiere configuración</Text>
                    </View>
                )}
            </View>
            <Ionicons
                name="chevron-forward"
                size={24}
                color="#007bff"
                style={styles.chevron}
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Mis Dispositivos IoT" />
            <BotonVolver destino="/" />

            <View style={styles.content}>
                <Text style={styles.title}>Selecciona un dispositivo</Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007bff" />
                        <Text style={styles.loadingText}>Cargando tus dispositivos...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={fetchUserDevices}
                        >
                            <Text style={styles.retryButtonText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : devices.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No tienes dispositivos registrados</Text>
                        <TouchableOpacity
                            style={styles.registrarButton}
                            onPress={() => router.push('/registroDispositivo')}
                        >
                            <Text style={styles.registrarButtonText}>Registrar un dispositivo</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={devices}
                        renderItem={renderDeviceItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>

            <Footer />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#dc3545',
        fontSize: 16,
        marginBottom: 15,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    registrarButton: {
        backgroundColor: '#28a745',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    registrarButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 20,
    },
    deviceCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    deviceCardNotConfigured: {
        borderLeftWidth: 4,
        borderLeftColor: '#f39c12',
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    deviceId: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    deviceStatus: {
        fontSize: 14,
        color: '#28a745',
        marginBottom: 3,
    },
    configWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    configWarningText: {
        fontSize: 14,
        color: '#f39c12',
        marginLeft: 5,
    },
    chevron: {
        marginLeft: 10,
    }
    // Estilos relacionados con el estado removidos
});
