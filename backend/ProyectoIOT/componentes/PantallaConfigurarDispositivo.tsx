import React, { useState, useEffect, useRef } from 'react';
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
    Alert,
    Animated,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import BotonVolver from '../componentes/BotonVolver';
import Header from '../componentes/Header';
import Footer from '../componentes/Footer';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

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

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Animación modal
    const modalScaleAnim = useRef(new Animated.Value(0.8)).current;
    const modalOpacityAnim = useRef(new Animated.Value(0)).current;

    // Funciones para manejar el cambio de estado
    const toggleSeguro = async () => {
        try {
            setIsLoading(true);
            // Aquí iría la lógica para comunicarse con el API y cambiar el estado del seguro
            // Por ahora solo cambiamos el estado local
            setSeguroActivo(!seguroActivo);

            // Simulación de éxito después de 500ms
            setTimeout(() => {
                setIsLoading(false);
                Alert.alert(
                    "Configuración actualizada",
                    `Los seguros han sido ${!seguroActivo ? "desactivados" : "activados"} correctamente.`
                );
            }, 500);
        } catch (error) {
            console.error("Error al cambiar estado del seguro:", error);
            setIsLoading(false);
            Alert.alert("Error", "No se pudo actualizar la configuración del seguro");
        }
    };

    const toggleAlarma = async () => {
        try {
            setIsLoading(true);
            // Aquí iría la lógica para comunicarse con el API y cambiar el estado de la alarma
            // Por ahora solo cambiamos el estado local
            setAlarmaActiva(!alarmaActiva);

            // Simulación de éxito después de 500ms
            setTimeout(() => {
                setIsLoading(false);
                Alert.alert(
                    "Configuración actualizada",
                    `La alarma sonora ha sido ${!alarmaActiva ? "desactivada" : "activada"} correctamente.`
                );
            }, 500);
        } catch (error) {
            console.error("Error al cambiar estado de la alarma:", error);
            setIsLoading(false);
            Alert.alert("Error", "No se pudo actualizar la configuración de la alarma");
        }
    };

    // Animar la entrada del contenido cuando carga la pantalla
    useEffect(() => {
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
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 700,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

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
                'http://192.168.0.75:8082/api/devices/info',
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
                'http://192.168.0.75:8082/api/devices/update-pin',
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
                            closeModal(); // Cerrar el modal con animación
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

    // Función para abrir el modal con animación
    const openModal = () => {
        setModalVisible(true);
        // Animar la entrada del modal
        Animated.parallel([
            Animated.timing(modalScaleAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(modalOpacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
    };

    // Función para cerrar el modal con animación
    const closeModal = () => {
        // Animar la salida del modal
        Animated.parallel([
            Animated.timing(modalScaleAnim, {
                toValue: 0.8,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(modalOpacityAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            })
        ]).start(() => {
            setModalVisible(false);
            setNewPin('');
            setErrorMsg('');
        });
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Configuración" />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/puerta" />
                    </View>

                    <Animated.View
                        style={[
                            styles.contentSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Configuración del Dispositivo</Text>

                        {/* Estado del dispositivo */}
                        <View style={styles.deviceStatusContainer}>
                            <View style={styles.deviceIconContainer}>
                                <MaterialCommunityIcons
                                    name="door-sliding-lock"
                                    size={40}
                                    color="#3182CE"
                                />
                            </View>

                            <View style={styles.deviceInfoContainer}>
                                <Text style={styles.deviceName}>
                                    {deviceInfo?.name || "Mi dispositivo"}
                                </Text>

                                <View style={styles.statusIndicatorContainer}>
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: deviceInfo?.isOnline ? '#38A169' : '#E53E3E' }
                                    ]} />
                                    <Text style={styles.statusText}>
                                        {deviceInfo?.isOnline ? 'En línea' : 'Desconectado'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Sección de configuración */}
                        <View style={styles.configSection}>
                            <Text style={styles.configTitle}>Información General</Text>

                            {/* ID del dispositivo */}
                            <View style={styles.infoItem}>
                                <View style={styles.infoLabelContainer}>
                                    <Ionicons name="finger-print-outline" size={20} color="#3182CE" />
                                    <Text style={styles.infoLabel}>ID del dispositivo</Text>
                                </View>
                                <View style={styles.infoValueContainer}>
                                    <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                                        {isLoading
                                            ? "Cargando..."
                                            : deviceInfo?.macAddress || "No disponible"}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.sectionDivider} />

                            <Text style={styles.configTitle}>Configuración de Seguridad</Text>

                            {/* Desactivar todos los seguros */}
                            <View style={styles.toggleContainer}>
                                <View style={styles.toggleInfo}>
                                    <View style={styles.toggleIconContainer}>
                                        <MaterialCommunityIcons name="lock-open-variant" size={20} color="#3182CE" />
                                    </View>
                                    <View>
                                        <Text style={styles.toggleLabel}>Desactivar todos los seguros</Text>
                                        <Text style={styles.toggleDescription}>
                                            La puerta se abrirá automáticamente sin requerir PIN
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={seguroActivo}
                                    onValueChange={toggleSeguro}
                                    trackColor={{ false: "#CBD5E0", true: "#BEE3F8" }}
                                    thumbColor={seguroActivo ? "#3182CE" : "#A0AEC0"}
                                    disabled={isLoading}
                                    style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                                />
                            </View>

                            {/* Desactivar alarma sonora */}
                            <View style={styles.toggleContainer}>
                                <View style={styles.toggleInfo}>
                                    <View style={styles.toggleIconContainer}>
                                        <Ionicons name="volume-mute" size={20} color="#3182CE" />
                                    </View>
                                    <View>
                                        <Text style={styles.toggleLabel}>Desactivar alarma sonora</Text>
                                        <Text style={styles.toggleDescription}>
                                            El dispositivo no emitirá sonidos de alerta
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={alarmaActiva}
                                    onValueChange={toggleAlarma}
                                    trackColor={{ false: "#CBD5E0", true: "#BEE3F8" }}
                                    thumbColor={alarmaActiva ? "#3182CE" : "#A0AEC0"}
                                    disabled={isLoading}
                                    style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                                />
                            </View>

                            <View style={styles.sectionDivider} />

                            <Text style={styles.configTitle}>Opciones Avanzadas</Text>

                            {/* Cambiar PIN */}
                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={openModal}
                                activeOpacity={0.7}
                                disabled={isLoading}
                            >
                                <View style={styles.optionContent}>
                                    <View style={styles.optionIconContainer}>
                                        <Ionicons name="key-outline" size={20} color="#3182CE" />
                                    </View>
                                    <View style={styles.optionTextContainer}>
                                        <Text style={styles.optionTitle}>Cambiar PIN de seguridad</Text>
                                        <Text style={styles.optionDescription}>
                                            Modifica el código de acceso de 4 dígitos
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#718096" />
                            </TouchableOpacity>

                            {/* Vincular otro dispositivo */}
                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={() => router.push('/registroDispositivo')}
                                activeOpacity={0.7}
                                disabled={isLoading}
                            >
                                <View style={styles.optionContent}>
                                    <View style={styles.optionIconContainer}>
                                        <Ionicons name="add-circle-outline" size={20} color="#3182CE" />
                                    </View>
                                    <View style={styles.optionTextContainer}>
                                        <Text style={styles.optionTitle}>Vincular otro dispositivo</Text>
                                        <Text style={styles.optionDescription}>
                                            Agregar un nuevo dispositivo a tu cuenta
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#718096" />
                            </TouchableOpacity>

                            {/* Desvincular este dispositivo */}
                            <TouchableOpacity
                                style={[styles.optionButton, styles.dangerButton]}
                                onPress={() => Alert.alert(
                                    "Desvincular Dispositivo",
                                    "¿Está seguro que desea desvincular este dispositivo de su cuenta?",
                                    [
                                        { text: "Cancelar", style: "cancel" },
                                        {
                                            text: "Desvincular",
                                            style: "destructive",
                                            onPress: () => router.push('/')
                                        }
                                    ]
                                )}
                                activeOpacity={0.7}
                                disabled={isLoading}
                            >
                                <View style={styles.optionContent}>
                                    <View style={[styles.optionIconContainer, styles.dangerIcon]}>
                                        <Ionicons name="trash-outline" size={20} color="#E53E3E" />
                                    </View>
                                    <View style={styles.optionTextContainer}>
                                        <Text style={[styles.optionTitle, styles.dangerText]}>Desvincular este dispositivo</Text>
                                        <Text style={styles.optionDescription}>
                                            Eliminar la asociación con tu cuenta
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#718096" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <Footer />
                </View>
            </ScrollView>

            {/* Modal para cambiar PIN - Mejorado visualmente */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="none" // Usamos nuestra propia animación
                onRequestClose={closeModal}
            >
                <View style={styles.modalBackground}>
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                opacity: modalOpacityAnim,
                                transform: [{ scale: modalScaleAnim }]
                            }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconContainer}>
                                <Ionicons name="key" size={30} color="#3182CE" />
                            </View>
                            <Text style={styles.modalTitle}>Cambiar PIN de Seguridad</Text>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Ingrese un nuevo PIN de 4 dígitos para acceder a su dispositivo
                        </Text>

                        <View style={styles.pinInputContainer}>
                            <View style={styles.pinInputIconContainer}>
                                <Ionicons name="keypad-outline" size={20} color="#3182CE" />
                            </View>
                            <TextInput
                                style={styles.pinInput}
                                placeholder="Nuevo PIN (4 dígitos)"
                                value={newPin}
                                onChangeText={validatePin}
                                keyboardType="numeric"
                                maxLength={4}
                                secureTextEntry={true}
                                autoFocus={true}
                                placeholderTextColor="#A0AEC0"
                            />
                        </View>

                        {errorMsg ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle-outline" size={18} color="#E53E3E" style={styles.errorIcon} />
                                <Text style={styles.errorText}>{errorMsg}</Text>
                            </View>
                        ) : null}

                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity
                                style={styles.cancelButtonContainer}
                                onPress={closeModal}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#718096', '#4A5568']}
                                    style={styles.cancelButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="close-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                    <Text style={styles.buttonText}>Cancelar</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButtonContainer}
                                onPress={handleChangePin}
                                disabled={newPin.length !== 4 || isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={
                                        newPin.length !== 4 || isLoading
                                            ? ['#A0AEC0', '#718096']
                                            : ['#3182CE', '#2C5282']
                                    }
                                    style={styles.confirmButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <>
                                            <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                                            <Text style={styles.buttonText}>Guardando...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="save-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                            <Text style={styles.buttonText}>Guardar</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Indicador de carga global */}
            {isLoading && !modalVisible && (
                <View style={styles.globalLoaderContainer}>
                    <View style={styles.globalLoader}>
                        <ActivityIndicator size="large" color="#3182CE" />
                        <Text style={styles.loaderText}>Actualizando...</Text>
                    </View>
                </View>
            )}
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
    contentSection: {
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
        marginBottom: 24,
        color: '#1A365D',
        borderBottomWidth: 3,
        borderBottomColor: '#3182CE',
        paddingBottom: 12,
        width: '65%',
        letterSpacing: 0.5,
    },
    deviceStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF8FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 25,
    },
    deviceIconContainer: {
        backgroundColor: '#BEE3F8',
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    deviceInfoContainer: {
        flex: 1,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 6,
    },
    statusIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#4A5568',
    },
    configSection: {
        marginBottom: 10,
    },
    configTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 16,
    },
    infoItem: {
        marginBottom: 16,
    },
    infoLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoLabel: {
        fontSize: 15,
        color: '#4A5568',
        marginLeft: 8,
    },
    infoValueContainer: {
        backgroundColor: '#F7FAFC',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    infoValue: {
        fontSize: 15,
        color: '#2D3748',
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    toggleInfo: {
        flexDirection: 'row',
        flex: 1,
        marginRight: 10,
    },
    toggleIconContainer: {
        backgroundColor: '#EBF8FF',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3748',
        marginBottom: 2,
    },
    toggleDescription: {
        fontSize: 13,
        color: '#718096',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dangerButton: {
        backgroundColor: '#FFF5F5',
        borderColor: '#FED7D7',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionIconContainer: {
        backgroundColor: '#EBF8FF',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dangerIcon: {
        backgroundColor: '#FED7D7',
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3748',
        marginBottom: 2,
    },
    dangerText: {
        color: '#E53E3E',
    },
    optionDescription: {
        fontSize: 13,
        color: '#718096',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EBF8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: "rgba(66,153,225,0.2)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 3,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    pinInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    pinInputIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EBF8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    pinInput: {
        flex: 1,
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 20,
        textAlign: 'center',
        letterSpacing: 10,
        color: '#2D3748',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#FC8181',
    },
    errorIcon: {
        marginRight: 8,
    },
    errorText: {
        flex: 1,
        color: '#C53030',
        fontSize: 14,
        fontWeight: '500',
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButtonContainer: {
        flex: 1,
        marginRight: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#4A5568",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    cancelButton: {
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    confirmButtonContainer: {
        flex: 1,
        marginLeft: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButton: {
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    globalLoaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    globalLoader: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    loaderText: {
        marginTop: 10,
        color: '#2D3748',
        fontSize: 16,
        fontWeight: '500',
    },
});