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
import Header from './Header';
import Footer from './Footer';
import BotonVolver from './BotonVolver';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

interface Registro {
    _id: string;
    mensaje: string;
    descripcion: string;
    fecha: string;
}

export default function PantallaRegistros() {
    const router = useRouter();
    const [registros, setRegistros] = useState<Registro[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

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
            const response = await axios.get<Registro[]>('http://192.168.0.75:8082/api/registros/get');

            if (response.status === 200) {
                const registrosData = response.data as Registro[];
                console.log(`Registros recibidos: ${registrosData.length}`);

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
                color: '#38A169',
                bgColor: '#F0FFF4',
                borderColor: '#C6F6D5'
            };
        } else if (lowerMsg.includes('cerr') || lowerMsg.includes('sali')) {
            return {
                icon: 'door-closed',
                color: '#3182CE',
                bgColor: '#EBF8FF',
                borderColor: '#BEE3F8'
            };
        } else if (lowerMsg.includes('fall') || lowerMsg.includes('error') || lowerMsg.includes('rechaz')) {
            return {
                icon: 'lock-alert',
                color: '#E53E3E',
                bgColor: '#FFF5F5',
                borderColor: '#FED7D7'
            };
        } else {
            return {
                icon: 'information',
                color: '#805AD5',
                bgColor: '#FAF5FF',
                borderColor: '#E9D8FD'
            };
        }
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

        return (
            <Animated.View
                style={[
                    styles.registroCard,
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
                <View style={styles.registroHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: style.borderColor }]}>
                        <MaterialCommunityIcons name={style.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={style.color} />
                    </View>
                    <Text style={[styles.registroMensaje, { color: style.color }]}>
                        {item.mensaje}
                    </Text>
                </View>

                <Text style={styles.registroDescripcion}>
                    {item.descripcion}
                </Text>

                <View style={styles.registroFooter}>
                    <View style={styles.timeContainer}>
                        <Ionicons name="time-outline" size={14} color="#718096" />
                        <Text style={styles.registroFecha}>
                            {fechaFormateada}
                        </Text>
                    </View>

                    <View style={styles.idContainer}>
                        <Ionicons name="key-outline" size={14} color="#718096" />
                        <Text style={styles.registroId}>
                            ID: {item._id.substring(item._id.length - 6)}
                        </Text>
                    </View>
                </View>
            </Animated.View>
        );
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text-outline" size={50} color="#A0AEC0" />
            </View>
            <Text style={styles.emptyTitle}>No hay registros disponibles</Text>
            <Text style={styles.emptyText}>
                Aún no se han registrado eventos de acceso en el sistema.
            </Text>

            <TouchableOpacity
                style={styles.refreshButtonContainer}
                onPress={fetchRegistros}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#3182CE', '#2C5282']}
                    style={styles.refreshButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Ionicons name="refresh" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.refreshButtonText}>Actualizar</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    // Renderizado condicional para la vista principal
    const renderContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3182CE" />
                    <Text style={styles.loadingText}>Cargando registros...</Text>
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
                    styles.listContent,
                    registros.length === 0 && styles.emptyList
                ]}
                ListEmptyComponent={renderEmptyList}
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>
                        <Text style={styles.listHeaderText}>
                            {registros.length} {registros.length === 1 ? 'registro' : 'registros'} encontrados
                        </Text>
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#3182CE"]}
                        tintColor="#3182CE"
                    />
                }
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        );
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Registros de Acceso" />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/puerta" />
                    </View>

                    <Animated.View
                        style={[
                            styles.contentSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleContainer}>
                                <Ionicons name="list" size={24} color="#3182CE" style={styles.titleIcon} />
                                <Text style={styles.sectionTitle}>Historial de Eventos</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.refreshIconButton}
                                onPress={onRefresh}
                                disabled={refreshing || loading}
                            >
                                <Ionicons
                                    name="refresh"
                                    size={22}
                                    color={refreshing || loading ? "#A0AEC0" : "#3182CE"}
                                />
                            </TouchableOpacity>
                        </View>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle-outline" size={22} color="#E53E3E" style={styles.errorIcon} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.listContainer}>
                            {renderContent()}
                        </View>
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleIcon: {
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    refreshIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EBF8FF',
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
        borderBottomColor: '#E2E8F0',
        marginBottom: 16,
    },
    listHeaderText: {
        color: '#718096',
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
        color: '#4A5568',
        marginBottom: 12,
        lineHeight: 20,
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
        color: '#718096',
        marginLeft: 5,
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    registroId: {
        fontSize: 12,
        color: '#718096',
        marginLeft: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#718096',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#FC8181',
    },
    errorIcon: {
        marginRight: 10,
    },
    errorText: {
        flex: 1,
        color: '#C53030',
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
        backgroundColor: '#F7FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4A5568',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 24,
        maxWidth: '80%',
        lineHeight: 20,
    },
    refreshButtonContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
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