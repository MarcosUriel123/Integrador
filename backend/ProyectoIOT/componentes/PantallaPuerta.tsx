import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../componentes/Header';
import Footer from '../componentes/Footer';
import BotonVolver from '../componentes/BotonVolver';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

export default function PantallaPuerta() {
    const router = useRouter();

    // Estado para saber si la puerta está abierta (true) o cerrada (false)
    const [puertaAbierta, setPuertaAbierta] = useState(false);

    // Estado para el sensor magnético (estado real de la puerta)
    const [estadoRealPuerta, setEstadoRealPuerta] = useState<string>('desconocido');
    const [cargandoEstado, setCargandoEstado] = useState<boolean>(true);

    // Para la animación del indicador cuando la puerta está abierta
    const opacidadDot = useRef(new Animated.Value(1)).current;

    // Animaciones de la pantalla
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Para controlar cuándo hacer polling (menos frecuente)
    const [errorConexion, setErrorConexion] = useState<boolean>(false);

    // Estado para el botón
    const [enviandoComando, setEnviandoComando] = useState<boolean>(false);

    // Función para obtener el estado real de la puerta desde el sensor
    const obtenerEstadoRealPuerta = async () => {
        try {
            // Verificar IP del Arduino en la consola del ESP32
            const response = await axios.get<{ status: string }>('http://192.168.0.75:8082/api/arduino/doorstatus');

            // Depurar la respuesta
            console.log('Respuesta del sensor:', response.data);

            // Actualizar estado solo si hay un cambio para evitar re-renders innecesarios
            if (response.data && typeof response.data.status === 'string' &&
                response.data.status !== estadoRealPuerta) {
                setEstadoRealPuerta(response.data.status);
            }

            // Restablecer bandera de error si había un error previo
            if (errorConexion) {
                setErrorConexion(false);
            }

            setCargandoEstado(false);
        } catch (error) {
            console.error("Error al obtener estado real de la puerta:", error);
            setErrorConexion(true);
            setCargandoEstado(false);
        }
    };

    // Modificar la función handleTogglePuerta para que siempre abra la puerta
    const handleTogglePuerta = async () => {
        try {
            setEnviandoComando(true);

            // Al momento de enviar el comando, actualizar también el estado
            obtenerEstadoRealPuerta();

            // Siempre intentamos abrir la puerta, sin importar el estado actual
            const url = 'http://192.168.0.75:8082/api/door/abrir';

            const response = await axios.get(url);
            console.log('Respuesta al abrir puerta:', response.data);

            // Actualizamos el estado después de la acción para reflejar el cambio
            setTimeout(obtenerEstadoRealPuerta, 1000);
        } catch (error) {
            console.error("Error al controlar la puerta:", error);
            // Mostrar mensaje de error mejorado
            setErrorConexion(true);
        } finally {
            setEnviandoComando(false);
        }
    };

    // Animación para el indicador cuando la puerta está abierta
    useEffect(() => {
        if (estadoRealPuerta === 'open') {
            // Crear animación de parpadeo
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(opacidadDot, {
                        toValue: 0.3,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacidadDot, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    })
                ])
            );

            animation.start();

            // Limpiar animación al desmontar o cambiar estado
            return () => {
                animation.stop();
            };
        }
    }, [estadoRealPuerta]);

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

    // Consultar inicialmente y configurar intervalo para consultas menos frecuentes
    useEffect(() => {
        // Verificar inmediatamente al cargar el componente
        obtenerEstadoRealPuerta();

        // Intervalo de respaldo para verificar cada 10 segundos
        // (solo como respaldo en caso de problemas de conectividad)
        const intervalo = setInterval(obtenerEstadoRealPuerta, 10000);

        // Limpiar el intervalo cuando el componente se desmonte
        return () => clearInterval(intervalo);
    }, []);

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Control de Acceso" />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/devices" />
                    </View>

                    <Animated.View
                        style={[
                            styles.contentSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Control de Puerta</Text>

                        {/* Estado real de la puerta desde el sensor magnético */}
                        <View style={[
                            styles.statusContainer,
                            estadoRealPuerta === 'open' ? styles.statusOpen :
                                estadoRealPuerta === 'closed' ? styles.statusClosed :
                                    styles.statusUnknown
                        ]}>
                            <Animated.View
                                style={[
                                    styles.statusIndicator,
                                    estadoRealPuerta === 'open' ? styles.statusIndicatorOpen :
                                        estadoRealPuerta === 'closed' ? styles.statusIndicatorClosed :
                                            styles.statusIndicatorUnknown,
                                    { opacity: estadoRealPuerta === 'open' ? opacidadDot : 1 }
                                ]}
                            />
                            <Text style={styles.statusText}>
                                {cargandoEstado ? "Consultando estado..." :
                                    errorConexion ? "ERROR DE CONEXIÓN" :
                                        estadoRealPuerta === 'open' ? "PUERTA ABIERTA" :
                                            estadoRealPuerta === 'closed' ? "PUERTA CERRADA" :
                                                "ESTADO DESCONOCIDO"}
                            </Text>
                        </View>

                        {/* Ícono de la puerta basado en el estado real */}
                        <Animated.View
                            style={[
                                styles.doorIconContainer,
                                { transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={estadoRealPuerta === 'open' ? "door-open" : "door-closed"}
                                size={160}
                                color={estadoRealPuerta === 'open' ? "#E53E3E" : "#3182CE"}
                                style={styles.doorIcon}
                            />
                        </Animated.View>

                        {/* Información sobre el estado con iconos */}
                        <View style={styles.infoContainer}>
                            <View style={styles.infoItem}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="time-outline" size={20} color="#3182CE" />
                                </View>
                                <Text style={styles.infoText}>
                                    Última actualización: {new Date().toLocaleTimeString()}
                                </Text>
                            </View>

                            <View style={styles.infoItem}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons
                                        name={errorConexion ? "wifi-off" : "wifi"}
                                        size={20}
                                        color={errorConexion ? "#E53E3E" : "#3182CE"}
                                    />
                                </View>
                                <Text style={styles.infoText}>
                                    {errorConexion
                                        ? "Problema de conexión con el dispositivo"
                                        : "Conectado con el dispositivo"}
                                </Text>
                            </View>
                        </View>

                        {/* Botón para abrir/cerrar */}
                        <TouchableOpacity
                            style={styles.doorButtonContainer}
                            onPress={handleTogglePuerta}
                            disabled={enviandoComando || errorConexion}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={
                                    enviandoComando || errorConexion
                                        ? ['#A0AEC0', '#718096']
                                        : ['#3182CE', '#2C5282']
                                }
                                style={styles.doorButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {enviandoComando ? (
                                    <>
                                        <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                                        <Text style={styles.doorButtonText}>Abriendo puerta...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="key" size={22} color="#FFFFFF" style={styles.buttonIcon} />
                                        <Text style={styles.doorButtonText}>Abrir Puerta</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Opciones adicionales */}
                        <View style={styles.optionsContainer}>
                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={() => router.push('../configurarDispositivo')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.optionIconContainer}>
                                    <Ionicons name="settings-outline" size={22} color="#3182CE" />
                                </View>
                                <Text style={styles.optionText}>Configuración</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={() => router.push('/registros')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.optionIconContainer}>
                                    <Ionicons name="document-text-outline" size={22} color="#3182CE" />
                                </View>
                                <Text style={styles.optionText}>Registros</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Botón de Gestionar Usuarios */}
                        <TouchableOpacity
                            style={styles.usersButtonContainer}
                            onPress={() => router.push('/registroUsuarios')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#805AD5', '#6B46C1']}
                                style={styles.usersButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="people" size={22} color="#FFFFFF" style={styles.buttonIcon} />
                                <Text style={styles.usersButtonText}>Gestionar Usuarios</Text>
                            </LinearGradient>
                        </TouchableOpacity>
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
        marginBottom: 20,
        color: '#1A365D',
        borderBottomWidth: 3,
        borderBottomColor: '#3182CE',
        paddingBottom: 12,
        width: '65%',
        letterSpacing: 0.5,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 25,
    },
    statusOpen: {
        backgroundColor: '#FFF5F5',
        borderWidth: 1,
        borderColor: '#FC8181',
    },
    statusClosed: {
        backgroundColor: '#F0FFF4',
        borderWidth: 1,
        borderColor: '#68D391',
    },
    statusUnknown: {
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E0',
    },
    statusIndicator: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 10,
    },
    statusIndicatorOpen: {
        backgroundColor: '#E53E3E',
    },
    statusIndicatorClosed: {
        backgroundColor: '#38A169',
    },
    statusIndicatorUnknown: {
        backgroundColor: '#CBD5E0',
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3748',
        letterSpacing: 0.5,
    },
    doorIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
        height: 200,
    },
    doorIcon: {
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    infoContainer: {
        backgroundColor: '#EBF8FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 25,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#BEE3F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#2C5282',
        flex: 1,
    },
    doorButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 25,
    },
    doorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    doorButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    buttonIcon: {
        marginRight: 10,
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    optionButton: {
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionIconContainer: {
        marginRight: 8,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#2D3748',
    },
    usersButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#6B46C1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    usersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    usersButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});