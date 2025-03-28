import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Animated,
    Dimensions,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from './Header';
import Footer from './Footer';
import BotonVolver from '../componentes/BotonVolver';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

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
}

// Componente separado para el ítem del dispositivo
const DeviceItemComponent = ({ item, index, onPress }: {
    item: DeviceItem,
    index: number,
    onPress: (device: DeviceItem) => void
}) => {
    // En un componente separado, PODEMOS usar hooks de forma segura
    const itemAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Retrasar la animación basada en el índice
        const delay = index * 100;
        Animated.timing(itemAnim, {
            toValue: 1,
            duration: 400,
            delay: delay,
            useNativeDriver: true,
        }).start();
    }, [index]);

    return (
        <Animated.View
            style={{
                opacity: itemAnim,
                transform: [
                    {
                        translateY: itemAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                        })
                    }
                ]
            }}
        >
            <TouchableOpacity
                style={[
                    styles.deviceCard,
                    !item.isConfigured && styles.deviceCardNotConfigured
                ]}
                onPress={() => onPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.deviceIconContainer}>
                    <MaterialCommunityIcons
                        name={item.isConfigured ? "security" : "shield-alert"}
                        size={28}
                        color={item.isConfigured ? "#3182CE" : "#DD6B20"}
                    />
                </View>

                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.name || 'Dispositivo sin nombre'}</Text>
                    <Text style={styles.deviceId}>MAC: {item.macAddress || 'No disponible'}</Text>

                    {!item.isConfigured ? (
                        <View style={styles.configWarning}>
                            <Ionicons name="warning-outline" size={16} color="#DD6B20" />
                            <Text style={styles.configWarningText}>Requiere configuración</Text>
                        </View>
                    ) : (
                        <View style={styles.configSuccess}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#38A169" />
                            <Text style={styles.configSuccessText}>Listo para usar</Text>
                        </View>
                    )}
                </View>

                <View style={styles.chevronContainer}>
                    <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="#3182CE"
                    />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function PantallaSeleccionDispositivoIoT() {
    const router = useRouter();
    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        // Animación de entrada
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

        fetchUserDevices();
    }, []);

    const fetchUserDevices = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                router.push('/Login1');
                return;
            }

            const response = await fetch('http://192.168.1.133:8082/api/devices/user-devices', {
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
            }));

            setDevices(transformedDevices);
            setError('');
        } catch (error) {
            console.error('Error al obtener dispositivos:', error);
            setError('No se pudieron cargar tus dispositivos');
            Alert.alert('Error', 'No se pudieron cargar tus dispositivos');
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Mis Dispositivos IoT" />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/" />
                    </View>

                    <Animated.View
                        style={[
                            styles.devicesSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Mis Dispositivos IoT</Text>
                        <Text style={styles.sectionSubtitle}>
                            Selecciona un dispositivo para configurarlo o controlarlo
                        </Text>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3182CE" />
                                <Text style={styles.loadingText}>Cargando tus dispositivos...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={fetchUserDevices}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.retryButtonText}>Reintentar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : devices.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconContainer}>
                                    <MaterialCommunityIcons name="devices" size={64} color="#3182CE" />
                                </View>
                                <Text style={styles.emptyTitle}>No tienes dispositivos registrados</Text>
                                <Text style={styles.emptyText}>
                                    Registra un nuevo dispositivo para comenzar a controlarlo desde la aplicación
                                </Text>
                                <TouchableOpacity
                                    style={styles.registrarButton}
                                    onPress={() => router.push('/registroDispositivo')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.registrarButtonText}>Registrar un dispositivo</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            // Importante: Usamos el componente DeviceItemComponent aquí
                            <FlatList
                                data={devices}
                                renderItem={({ item, index }) => (
                                    <DeviceItemComponent
                                        item={item}
                                        index={index}
                                        onPress={handleDeviceSelect}
                                    />
                                )}
                                keyExtractor={(item) => item._id}
                                contentContainerStyle={styles.listContent}
                                scrollEnabled={false}
                            />
                        )}
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
    devicesSection: {
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
    sectionTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#1A365D',
        borderBottomWidth: 3,
        borderBottomColor: '#3182CE',
        paddingBottom: 12,
        width: '65%',
        letterSpacing: 0.5,
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#4A5568',
        marginBottom: 20,
        marginTop: 6,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        marginVertical: 10,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#4A5568',
        fontWeight: '500',
    },
    errorContainer: {
        padding: 22,
        backgroundColor: '#FFF5F5',
        borderRadius: 16,
        borderLeftWidth: 5,
        borderLeftColor: '#FC8181',
        marginVertical: 10,
        alignItems: 'center',
    },
    errorText: {
        color: '#C53030',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.3,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        paddingHorizontal: 20,
    },
    emptyIconContainer: {
        backgroundColor: '#EBF8FF',
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 8,
    },
    emptyText: {
        color: '#4A5568',
        fontSize: 15,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: '90%',
    },
    registrarButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    registrarButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 10,
    },
    deviceCard: {
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "rgba(0,0,0,0.06)",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    deviceCardNotConfigured: {
        borderLeftWidth: 4,
        borderLeftColor: '#DD6B20',
    },
    deviceIconContainer: {
        backgroundColor: '#EBF8FF',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    deviceId: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 6,
    },
    configWarning: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    configWarningText: {
        fontSize: 14,
        color: '#DD6B20',
        marginLeft: 5,
        fontWeight: '500',
    },
    configSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    configSuccessText: {
        fontSize: 14,
        color: '#38A169',
        marginLeft: 5,
        fontWeight: '500',
    },
    chevronContainer: {
        backgroundColor: '#EBF8FF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});
