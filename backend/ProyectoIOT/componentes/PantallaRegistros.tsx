import React, { useEffect, useState, useRef } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Animated,
    Dimensions,
    ScrollView
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import IPS from '../config/IPS';
import { useAppTheme } from '../hooks/useAppTheme'; // Importar hook de tema

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

// Interfaz para las FAQs
interface Registro {
    _id: string;
    mensaje: string;
    descripcion: string;
    metodoAcceso?: string;
    valorMetodo?: string;
    fecha: string;
}

export default function PantallaRegistros() {
    const router = useRouter();
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Obtener colores y estilos del tema
    const [registros, setRegistros] = useState<Registro[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Para las animaciones de los items de la lista
    const itemAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

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

    const fetchRegistros = async () => {
        try {
            console.log("Obteniendo registros...");
            setLoading(true);
            setError('');
            const response = await axios.get<Registro[]>(`${IPS.SERVER_URL}/api/registros/get`);

            if (response.status === 200) {
                const registrosData = response.data as Registro[];
                console.log(`Registros recibidos: ${registrosData.length}`);

                // Verificar qué datos contienen
                registrosData.forEach((item, idx) => {
                    if (idx < 5) { // Solo mostrar los primeros 5 para no saturar la consola
                        console.log(
                            `Registro #${idx + 1}: 
                        id=${item._id}, 
                        mensaje=${item.mensaje}, 
                        método=${item.metodoAcceso || 'ninguno'}, 
                        valor=${item.valorMetodo || 'ninguno'}`
                        );
                    }
                });

                // Crear animaciones para nuevos items
                registrosData.forEach(item => {
                    if (!itemAnimations[item._id]) {
                        itemAnimations[item._id] = new Animated.Value(0);
                        // Iniciar la animación
                        Animated.timing(itemAnimations[item._id], {
                            toValue: 1,
                            duration: 500,
                            useNativeDriver: true,
                        }).start();
                    }
                });

                setRegistros(registrosData);
            }
        } catch (err: any) {
            console.error("Error al cargar registros:", err.message);
            setError('Error al cargar los registros. Intente nuevamente.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRegistros();

        // Polling cada 15 segundos (menos frecuente para evitar sobrecarga)
        const interval = setInterval(fetchRegistros, 15000);
        return () => clearInterval(interval);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRegistros();
    };

    // Función para determinar el color y el icono según el tipo de registro
    const getRegistroStyle = (mensaje: string) => {
        const lowerMsg = mensaje.toLowerCase();

        if (lowerMsg.includes('abri') || lowerMsg.includes('entr')) {
            return {
                icon: 'door-open',
                color: isDarkMode ? '#68D391' : '#38A169',
                bgColor: isDarkMode ? 'rgba(56, 161, 105, 0.1)' : '#F0FFF4',
                borderColor: isDarkMode ? 'rgba(104, 211, 145, 0.5)' : '#C6F6D5'
            };
        } else if (lowerMsg.includes('cerr') || lowerMsg.includes('sali')) {
            return {
                icon: 'door-closed',
                color: isDarkMode ? '#63B3ED' : '#3182CE',
                bgColor: isDarkMode ? 'rgba(49, 130, 206, 0.1)' : '#EBF8FF',
                borderColor: isDarkMode ? 'rgba(99, 179, 237, 0.5)' : '#BEE3F8'
            };
        } else if (lowerMsg.includes('fall') || lowerMsg.includes('error') || lowerMsg.includes('rechaz')) {
            return {
                icon: 'lock-alert',
                color: isDarkMode ? '#FC8181' : '#E53E3E',
                bgColor: isDarkMode ? 'rgba(229, 62, 62, 0.1)' : '#FFF5F5',
                borderColor: isDarkMode ? 'rgba(252, 129, 129, 0.5)' : '#FED7D7'
            };
        } else {
            return {
                icon: 'information',
                color: isDarkMode ? '#B794F4' : '#805AD5',
                bgColor: isDarkMode ? 'rgba(128, 90, 213, 0.1)' : '#FAF5FF',
                borderColor: isDarkMode ? 'rgba(183, 148, 244, 0.5)' : '#E9D8FD'
            };
        }
    };

    // Obtener colores del gradiente para el botón según el tema
    const getButtonGradientColors = () => {
        return isDarkMode
            ? [colors.primary, '#1e3a8a'] as const // Primario a azul oscuro para tema oscuro
            : [colors.primary, '#2C5282'] as const; // Primario a azul medio para tema claro
    };

    const renderRegistroItem = ({ item, index }: { item: Registro; index: number }) => {
        const style = getRegistroStyle(item.mensaje);
        const opacity = itemAnimations[item._id] || new Animated.Value(1);

        // Fecha formateada de manera más legible
        const fecha = new Date(item.fecha);
        const hoy = new Date();
        let fechaFormateada = '';

        if (fecha.toDateString() === hoy.toDateString()) {
            fechaFormateada = `Hoy a las ${fecha.toLocaleTimeString()}`;
        } else {
            const ayer = new Date(hoy);
            ayer.setDate(hoy.getDate() - 1);

            if (fecha.toDateString() === ayer.toDateString()) {
                fechaFormateada = `Ayer a las ${fecha.toLocaleTimeString()}`;
            } else {
                fechaFormateada = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;
            }
        }

        // Formatear el texto del método de acceso
        let metodoAccesoText = '';

        if (item.metodoAcceso && item.metodoAcceso !== 'desconocido') {
            if (item.valorMetodo) {
                metodoAccesoText = `Método: ${item.metodoAcceso} | Valor: ${item.valorMetodo}`;
            } else {
                metodoAccesoText = `Método: ${item.metodoAcceso}`;
            }
        }

        return (
            <Animated.View
                style={[
                    localStyles.registroCard,
                    {
                        backgroundColor: style.bgColor,
                        borderColor: style.borderColor,
                        opacity,
                        transform: [
                            {
                                translateY: opacity.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0]
                                })
                            }
                        ]
                    }
                ]}
            >
                <View style={localStyles.registroHeader}>
                    <View style={[localStyles.iconContainer, { backgroundColor: style.borderColor }]}>
                        <MaterialCommunityIcons
                            name={style.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                            size={20}
                            color={style.color}
                        />
                    </View>
                    <Text style={[localStyles.registroMensaje, { color: style.color }]}>
                        {item.mensaje}
                    </Text>
                </View>

                <Text style={[localStyles.registroDescripcion, { color: colors.secondaryText }]}>
                    {item.descripcion}
                </Text>

                {metodoAccesoText ? (
                    <View style={[localStyles.metodoContainer, {
                        backgroundColor: isDarkMode ? 'rgba(146, 64, 14, 0.1)' : '#FFFBEB',
                        borderColor: isDarkMode ? 'rgba(252, 211, 77, 0.5)' : '#FCD34D'
                    }]}>
                        <Text style={[localStyles.registroMetodo, {
                            color: isDarkMode ? '#F6AD55' : '#92400E'
                        }]}>
                            {metodoAccesoText}
                        </Text>
                    </View>
                ) : null}

                <View style={localStyles.registroFooter}>
                    <View style={localStyles.timeContainer}>
                        <Ionicons
                            name="time-outline"
                            size={14}
                            color={isDarkMode ? colors.secondaryText : '#718096'}
                        />
                        <Text style={[localStyles.registroFecha, {
                            color: isDarkMode ? colors.secondaryText : '#718096'
                        }]}>
                            {fechaFormateada}
                        </Text>
                    </View>

                    <View style={localStyles.idContainer}>
                        <Ionicons
                            name="key-outline"
                            size={14}
                            color={isDarkMode ? colors.secondaryText : '#718096'}
                        />
                        <Text style={[localStyles.registroId, {
                            color: isDarkMode ? colors.secondaryText : '#718096'
                        }]}>
                            ID: {item._id.substring(item._id.length - 6)}
                        </Text>
                    </View>
                </View>
            </Animated.View>
        );
    };

    const renderEmptyList = () => (
        <View style={localStyles.emptyContainer}>
            <View style={[localStyles.emptyIconContainer, {
                backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                borderColor: colors.border
            }]}>
                <Ionicons name="document-text-outline" size={50} color={colors.secondaryText} />
            </View>
            <Text style={[localStyles.emptyTitle, { color: colors.text }]}>
                No hay registros disponibles
            </Text>
            <Text style={[localStyles.emptyText, { color: colors.secondaryText }]}>
                Aún no se han registrado eventos de acceso en el sistema.
            </Text>

            <TouchableOpacity
                style={[
                    localStyles.refreshButtonContainer,
                    {
                        shadowOpacity: isDarkMode ? 0.2 : 0.15,
                        elevation: isDarkMode ? 3 : 2
                    }
                ]}
                onPress={fetchRegistros}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={getButtonGradientColors()}
                    style={localStyles.refreshButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Ionicons name="refresh" size={18} color="#FFFFFF" style={localStyles.buttonIcon} />
                    <Text style={localStyles.refreshButtonText}>Actualizar</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    // Renderizado condicional para la vista principal
    const renderContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={[localStyles.loadingContainer, {
                    backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                    borderColor: colors.border
                }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[localStyles.loadingText, { color: colors.secondaryText }]}>
                        Cargando registros...
                    </Text>
                </View>
            );
        }

        return (
            <FlatList
                data={registros}
                renderItem={renderRegistroItem}
                keyExtractor={(item) => item._id}
                scrollEnabled={true}
                contentContainerStyle={[
                    localStyles.listContent,
                    registros.length === 0 && localStyles.emptyList
                ]}
                ListEmptyComponent={renderEmptyList}
                ListHeaderComponent={() => (
                    <View style={[localStyles.listHeader, { borderBottomColor: colors.divider }]}>
                        <Text style={[localStyles.listHeaderText, { color: colors.secondaryText }]}>
                            {registros.length} {registros.length === 1 ? 'registro' : 'registros'} encontrados
                        </Text>
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        );
    };

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
                        }]}>Historial de Eventos</Text>

                        <View style={localStyles.headerControls}>
                            <TouchableOpacity
                                style={[localStyles.refreshIconButton, {
                                    backgroundColor: isDarkMode
                                        ? colors.primaryLight + '40'
                                        : colors.primaryLight
                                }]}
                                onPress={onRefresh}
                                disabled={refreshing || loading}
                            >
                                <Ionicons
                                    name="refresh"
                                    size={22}
                                    color={refreshing || loading
                                        ? colors.secondaryText
                                        : colors.primary}
                                />
                            </TouchableOpacity>
                        </View>

                        {error ? (
                            <View style={[localStyles.errorContainer, {
                                backgroundColor: isDarkMode ? 'rgba(254, 178, 178, 0.1)' : '#FFF5F5',
                                borderLeftColor: colors.error
                            }]}>
                                <Feather name="alert-triangle" size={22} color={colors.error} style={localStyles.errorIcon} />
                                <Text style={[localStyles.errorText, {
                                    color: isDarkMode ? '#FC8181' : '#C53030'
                                }]}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={localStyles.listContainer}>
                            {renderContent()}
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos locales específicos para este componente
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
    headerControls: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
    },
    refreshIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        flex: 1,
        minHeight: 300, // Altura mínima para mostrar contenido
    },
    listContent: {
        width: '100%',
        paddingBottom: 10,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
    },
    listHeader: {
        paddingBottom: 10,
        borderBottomWidth: 1,
        marginBottom: 16,
    },
    listHeaderText: {
        fontSize: 14,
        fontWeight: '500',
    },
    registroCard: {
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
    },
    registroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    registroMensaje: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    registroDescripcion: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    registroMetodo: {
        fontSize: 14,
        fontWeight: '500',
    },
    metodoContainer: {
        borderRadius: 8,
        padding: 10,
        marginVertical: 8,
        borderWidth: 1,
    },
    registroFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    registroFecha: {
        fontSize: 12,
        marginLeft: 5,
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    registroId: {
        fontSize: 12,
        marginLeft: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
        paddingVertical: 40,
        borderRadius: 16,
        borderWidth: 1,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
    },
    errorIcon: {
        marginRight: 10,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        maxWidth: '80%',
        lineHeight: 20,
    },
    refreshButtonContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    buttonIcon: {
        marginRight: 8,
    },
    refreshButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});