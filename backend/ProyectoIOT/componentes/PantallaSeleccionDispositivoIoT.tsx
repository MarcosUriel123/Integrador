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
    ScrollView,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import IPS from '../config/IPS';
import { useAppTheme } from '../hooks/useAppTheme';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

// Interfaz para dispositivos
interface DeviceItem {
    _id: string;
    name: string;
    deviceId: string;
    macAddress: string;
    status: string;
    isConfigured: boolean;
    serialNumber?: string;
    userId: string;
    pin?: string;
    createdAt: string;
}

// Componente separado para el ítem del dispositivo
const DeviceItemComponent = ({ item, index, onPress, colors, isDarkMode }: {
    item: DeviceItem,
    index: number,
    onPress: (device: DeviceItem) => void,
    colors: any,
    isDarkMode: boolean
}) => {
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
                    localStyles.deviceCard,
                    !item.isConfigured && localStyles.deviceCardNotConfigured,
                    {
                        backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                        borderColor: colors.border,
                        borderLeftColor: !item.isConfigured ?
                            (isDarkMode ? '#DD6B20' : '#DD6B20') :
                            colors.border
                    }
                ]}
                onPress={() => onPress(item)}
                activeOpacity={0.7}
            >
                <View style={[
                    localStyles.deviceIconContainer,
                    {
                        backgroundColor: isDarkMode ? colors.primaryLight + '40' : '#EBF8FF'
                    }
                ]}>
                    <MaterialCommunityIcons
                        name={item.isConfigured ? "security" : "shield-alert"}
                        size={28}
                        color={item.isConfigured ?
                            colors.primary :
                            (isDarkMode ? '#F6AD55' : '#DD6B20')}
                    />
                </View>

                <View style={localStyles.deviceInfo}>
                    <Text style={[localStyles.deviceName, { color: colors.text }]}>
                        {item.name || 'Dispositivo sin nombre'}
                    </Text>
                    <Text style={[localStyles.deviceId, { color: colors.secondaryText }]}>
                        MAC: {item.macAddress || 'No disponible'}
                    </Text>

                    {!item.isConfigured ? (
                        <View style={localStyles.configWarning}>
                            <Ionicons name="warning-outline" size={16}
                                color={isDarkMode ? '#F6AD55' : '#DD6B20'} />
                            <Text style={[localStyles.configWarningText, {
                                color: isDarkMode ? '#F6AD55' : '#DD6B20'
                            }]}>
                                Requiere configuración
                            </Text>
                        </View>
                    ) : (
                        <View style={localStyles.configSuccess}>
                            <Ionicons name="checkmark-circle-outline" size={16}
                                color={isDarkMode ? '#68D391' : '#38A169'} />
                            <Text style={[localStyles.configSuccessText, {
                                color: isDarkMode ? '#68D391' : '#38A169'
                            }]}>
                                Listo para usar
                            </Text>
                        </View>
                    )}
                </View>

                <View style={[
                    localStyles.chevronContainer,
                    {
                        backgroundColor: isDarkMode ? colors.primaryLight + '40' : '#EBF8FF'
                    }
                ]}>
                    <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={colors.primary}
                    />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function PantallaSeleccionDispositivoIoT() {
    const router = useRouter();
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme();
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

            const response = await fetch(`${IPS.SERVER_URL}/api/devices/user-devices`, {
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

    // Obtener colores del gradiente para el botón según el tema
    const getButtonGradientColors = () => {
        return isDarkMode
            ? [colors.primary, '#1e3a8a'] as const // Primario a azul oscuro para tema oscuro
            : [colors.primary, '#2C5282'] as const; // Primario a azul medio para tema claro
    };

    return (
        <SafeAreaView style={baseStyles.screen}>
            <StatusBar
                backgroundColor={isDarkMode ? colors.background : '#FFFFFF'}
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            />
            <ScrollView style={{ flex: 1 }}>
                <View style={baseStyles.contentContainer}>
                    {/* Título y subtítulo ahora directamente en el contentContainer sin el contenedor adicional */}
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                            marginBottom: 20
                        }}
                    >
                        <Text style={[localStyles.sectionTitle, {
                            color: colors.text,
                            borderBottomColor: colors.primary
                        }]}>
                            Mis Dispositivos IoT
                        </Text>
                        <Text style={[localStyles.sectionSubtitle, { color: colors.secondaryText }]}>
                            Selecciona un dispositivo para configurarlo o controlarlo
                        </Text>
                    </Animated.View>

                    {loading ? (
                        <View style={[localStyles.loadingContainer, {
                            backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                            borderColor: colors.border
                        }]}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[localStyles.loadingText, { color: colors.secondaryText }]}>
                                Cargando tus dispositivos...
                            </Text>
                        </View>
                    ) : error ? (
                        <View style={[localStyles.errorContainer, {
                            backgroundColor: isDarkMode ? 'rgba(229, 62, 62, 0.1)' : '#FFF5F5',
                            borderLeftColor: isDarkMode ? '#FC8181' : '#FC8181'
                        }]}>
                            <Text style={[localStyles.errorText, {
                                color: isDarkMode ? '#FC8181' : '#C53030'
                            }]}>
                                {error}
                            </Text>
                            <TouchableOpacity
                                style={[localStyles.retryButton, {
                                    backgroundColor: colors.primary,
                                    shadowOpacity: isDarkMode ? 0.3 : 0.2
                                }]}
                                onPress={fetchUserDevices}
                                activeOpacity={0.7}
                            >
                                <Text style={localStyles.retryButtonText}>Reintentar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : devices.length === 0 ? (
                        <View style={[localStyles.emptyContainer, {
                            backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                        }]}>
                            <View style={[localStyles.emptyIconContainer, {
                                backgroundColor: isDarkMode ? colors.primaryLight + '40' : '#EBF8FF'
                            }]}>
                                <MaterialCommunityIcons
                                    name="devices"
                                    size={64}
                                    color={colors.primary}
                                />
                            </View>
                            <Text style={[localStyles.emptyTitle, { color: colors.text }]}>
                                No tienes dispositivos registrados
                            </Text>
                            <Text style={[localStyles.emptyText, { color: colors.secondaryText }]}>
                                Registra un nuevo dispositivo para comenzar a controlarlo desde la aplicación
                            </Text>
                            <TouchableOpacity
                                style={[
                                    localStyles.buttonContainer,
                                    {
                                        shadowOpacity: isDarkMode ? 0.3 : 0.2,
                                        elevation: isDarkMode ? 4 : 3
                                    }
                                ]}
                                onPress={() => router.push('/registroDispositivo')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={getButtonGradientColors()}
                                    style={localStyles.button}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={localStyles.buttonText}>
                                        Registrar un dispositivo
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }}
                        >
                            <FlatList
                                data={devices}
                                renderItem={({ item, index }) => (
                                    <DeviceItemComponent
                                        item={item}
                                        index={index}
                                        onPress={handleDeviceSelect}
                                        colors={colors}
                                        isDarkMode={isDarkMode}
                                    />
                                )}
                                keyExtractor={(item) => item._id}
                                contentContainerStyle={localStyles.listContent}
                                scrollEnabled={false}
                            />
                        </Animated.View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    sectionTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 6,
        borderBottomWidth: 3,
        paddingBottom: 12,
        width: '65%',
        letterSpacing: 0.5,
    },
    sectionSubtitle: {
        fontSize: 16,
        marginBottom: 20,
        marginTop: 6,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        borderRadius: 16,
        marginVertical: 10,
        borderWidth: 1,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '500',
    },
    errorContainer: {
        padding: 22,
        borderRadius: 16,
        borderLeftWidth: 5,
        marginVertical: 10,
        alignItems: 'center',
    },
    errorText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.3,
        marginBottom: 16,
    },
    retryButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
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
        borderRadius: 16,
        paddingHorizontal: 20,
    },
    emptyIconContainer: {
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
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: '90%',
    },
    buttonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 10,
    },
    deviceCard: {
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
    },
    deviceCardNotConfigured: {
        borderLeftWidth: 4,
    },
    deviceIconContainer: {
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
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    deviceId: {
        fontSize: 14,
        marginBottom: 6,
    },
    configWarning: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    configWarningText: {
        fontSize: 14,
        marginLeft: 5,
        fontWeight: '500',
    },
    configSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    configSuccessText: {
        fontSize: 14,
        marginLeft: 5,
        fontWeight: '500',
    },
    chevronContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});