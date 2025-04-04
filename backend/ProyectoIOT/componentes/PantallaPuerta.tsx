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
import IPS from '../config/IPS'; // Importamos la configuración de IPs
import { useAppTheme } from '../hooks/useAppTheme'; // Importar hook de tema

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

export default function PantallaPuerta() {
    const router = useRouter();
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Obtener colores y estilos del tema

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
            const response = await axios.get<{ status: string }>(`${IPS.ESP32_URL}/api/arduino/doorstatus`);

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
            // console.error("Error al obtener estado real de la puerta:", error);
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
            const url = `${IPS.SERVER_URL}/api/door/abrir`;

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

    // Obtener colores del gradiente para los botones según el tema
    const getMainButtonGradientColors = () => {
        if (enviandoComando || errorConexion) {
            return isDarkMode
                ? ['#4A5568', '#2D3748'] // Gris oscuro para tema oscuro
                : ['#A0AEC0', '#718096']; // Gris para tema claro
        } else {
            return isDarkMode
                ? [colors.primary, '#1e3a8a'] // Primario a azul oscuro para tema oscuro
                : [colors.primary, '#2C5282']; // Primario a azul medio para tema claro
        }
    };

    const getUsersButtonGradientColors = () => {
        return isDarkMode
            ? ['#805AD5', '#553C9A'] // Púrpura oscuro para tema oscuro
            : ['#805AD5', '#6B46C1']; // Púrpura para tema claro
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

    // Obtener colores de estado según la condición
    const getStatusColors = () => {
        if (estadoRealPuerta === 'open') {
            return {
                bgColor: isDarkMode ? 'rgba(229, 62, 62, 0.1)' : '#FFF5F5',
                borderColor: isDarkMode ? 'rgba(252, 129, 129, 0.5)' : '#FC8181',
                indicatorColor: isDarkMode ? '#F56565' : '#E53E3E',
                doorIconColor: isDarkMode ? '#F56565' : '#E53E3E'
            };
        } else if (estadoRealPuerta === 'closed') {
            return {
                bgColor: isDarkMode ? 'rgba(56, 161, 105, 0.1)' : '#F0FFF4',
                borderColor: isDarkMode ? 'rgba(104, 211, 145, 0.5)' : '#68D391',
                indicatorColor: isDarkMode ? '#48BB78' : '#38A169',
                doorIconColor: isDarkMode ? '#48BB78' : '#38A169'
            };
        } else {
            return {
                bgColor: isDarkMode ? 'rgba(203, 213, 224, 0.1)' : '#F7FAFC',
                borderColor: isDarkMode ? 'rgba(203, 213, 224, 0.5)' : '#CBD5E0',
                indicatorColor: isDarkMode ? '#A0AEC0' : '#CBD5E0',
                doorIconColor: colors.secondaryText
            };
        }
    };

    const statusColors = getStatusColors();

    return (
        <SafeAreaView style={baseStyles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={baseStyles.contentContainer}>
                    <Animated.View
                        style={[
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Text style={[localStyles.sectionTitle, {
                            color: colors.text,
                            borderBottomColor: colors.primary
                        }]}>Control de Puerta</Text>

                        {/* Estado real de la puerta desde el sensor magnético */}
                        <View style={[
                            localStyles.statusContainer,
                            {
                                backgroundColor: statusColors.bgColor,
                                borderColor: statusColors.borderColor
                            }
                        ]}>
                            <Animated.View
                                style={[
                                    localStyles.statusIndicator,
                                    {
                                        backgroundColor: statusColors.indicatorColor,
                                        opacity: estadoRealPuerta === 'open' ? opacidadDot : 1
                                    }
                                ]}
                            />
                            <Text style={[localStyles.statusText, { color: colors.text }]}>
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
                                localStyles.doorIconContainer,
                                { transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={estadoRealPuerta === 'open' ? "door-open" : "door-closed"}
                                size={160}
                                color={statusColors.doorIconColor}
                                style={localStyles.doorIcon}
                            />
                        </Animated.View>

                        {/* Información sobre el estado con iconos */}
                        <View style={[localStyles.infoContainer, {
                            backgroundColor: isDarkMode ? colors.primaryLight + '30' : '#EBF8FF'
                        }]}>
                            <View style={localStyles.infoItem}>
                                <View style={[localStyles.infoIconContainer, {
                                    backgroundColor: isDarkMode ? colors.primary + '40' : '#BEE3F8'
                                }]}>
                                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                                </View>
                                <Text style={[localStyles.infoText, {
                                    color: isDarkMode ? colors.text : '#2C5282'
                                }]}>
                                    Última actualización: {new Date().toLocaleTimeString()}
                                </Text>
                            </View>

                            <View style={localStyles.infoItem}>
                                <View style={[localStyles.infoIconContainer, {
                                    backgroundColor: isDarkMode
                                        ? (errorConexion ? 'rgba(229, 62, 62, 0.3)' : colors.primary + '40')
                                        : (errorConexion ? '#FED7D7' : '#BEE3F8')
                                }]}>
                                    <Ionicons
                                        name={errorConexion ? "wifi-off" : "wifi"}
                                        size={20}
                                        color={errorConexion ? colors.error : colors.primary}
                                    />
                                </View>
                                <Text style={[localStyles.infoText, {
                                    color: isDarkMode
                                        ? (errorConexion ? colors.error : colors.text)
                                        : (errorConexion ? '#C53030' : '#2C5282')
                                }]}>
                                    {errorConexion
                                        ? "Problema de conexión con el dispositivo"
                                        : "Conectado con el dispositivo"}
                                </Text>
                            </View>
                        </View>

                        {/* Botón para abrir/cerrar */}
                        <TouchableOpacity
                            style={[
                                localStyles.doorButtonContainer,
                                {
                                    shadowOpacity: isDarkMode ? 0.2 : 0.15,
                                    elevation: isDarkMode ? 3 : 2
                                }
                            ]}
                            onPress={handleTogglePuerta}
                            disabled={enviandoComando || errorConexion}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={getMainButtonGradientColors()}
                                style={localStyles.doorButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {enviandoComando ? (
                                    <>
                                        <ActivityIndicator size="small" color="#FFFFFF" style={localStyles.buttonIcon} />
                                        <Text style={localStyles.doorButtonText}>Abriendo puerta...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="key" size={22} color="#FFFFFF" style={localStyles.buttonIcon} />
                                        <Text style={localStyles.doorButtonText}>Abrir Puerta</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Opciones adicionales */}
                        <View style={localStyles.optionsContainer}>
                            <TouchableOpacity
                                style={[localStyles.optionButton, {
                                    backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                    borderColor: colors.border
                                }]}
                                onPress={() => router.push('../configurarDispositivo')}
                                activeOpacity={0.7}
                            >
                                <View style={[localStyles.optionIconContainer, {
                                    backgroundColor: isDarkMode ? colors.primaryLight + '40' : colors.primaryLight
                                }]}>
                                    <Ionicons name="settings-outline" size={22} color={colors.primary} />
                                </View>
                                <Text style={[localStyles.optionText, { color: colors.text }]}>
                                    Configuración
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[localStyles.optionButton, {
                                    backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                    borderColor: colors.border
                                }]}
                                onPress={() => router.push('/registros')}
                                activeOpacity={0.7}
                            >
                                <View style={[localStyles.optionIconContainer, {
                                    backgroundColor: isDarkMode ? colors.primaryLight + '40' : colors.primaryLight
                                }]}>
                                    <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                                </View>
                                <Text style={[localStyles.optionText, { color: colors.text }]}>
                                    Registros
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Botón de Gestionar Usuarios */}
                        <TouchableOpacity
                            style={[
                                localStyles.usersButtonContainer,
                                {
                                    shadowOpacity: isDarkMode ? 0.2 : 0.15,
                                    elevation: isDarkMode ? 3 : 2
                                }
                            ]}
                            onPress={() => router.push('/registroUsuarios')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={getUsersButtonGradientColors()}
                                style={localStyles.usersButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="people" size={22} color="#FFFFFF" style={localStyles.buttonIcon} />
                                <Text style={localStyles.usersButtonText}>Gestionar Usuarios</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    sectionTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 24,
        borderBottomWidth: 3,
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
        borderWidth: 1,
    },
    statusIndicator: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 10,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
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
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    infoContainer: {
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoText: {
        fontSize: 14,
        flex: 1,
    },
    doorButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
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
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '500',
    },
    usersButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
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