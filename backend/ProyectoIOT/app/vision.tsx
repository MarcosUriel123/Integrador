// app/vision.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons, Feather } from '@expo/vector-icons';
import IPS from '../config/IPS';
import { useAppTheme } from '../hooks/useAppTheme'; // Importar hook de tema

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

export default function VisionScreen() {
    const router = useRouter();
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Obtener colores y estilos del tema
    const API_BASE = `${IPS.SERVER_URL}/api`;
    const [vision, setVision] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // useEffect para cargar los datos de la visión desde el backend
    useEffect(() => {
        // Animar la entrada del contenido
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

        const fetchVision = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE}/empresa/visiones`);
                const data = response.data as { contenido: string }[];
                const lastVision = data[data.length - 1]; // Tomamos el último elemento
                setVision(lastVision?.contenido || 'No hay visión definida.');
                setError('');
            } catch (error) {
                console.error("Error fetching vision:", error);
                setError('No se pudo cargar la información de visión.');
            } finally {
                setLoading(false);
            }
        };

        fetchVision();
    }, []);

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
                        }]}>Nuestra Visión</Text>

                        {/* Sección Hero (Imagen) con animación */}
                        <Animated.View
                            style={[
                                localStyles.heroSection,
                                { transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <Image
                                source={require('../assets/images/puertaIOT-vision.jpg')}
                                style={localStyles.heroImage}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        {/* Contenido principal: Visión */}
                        <View style={localStyles.mainContent}>
                            {loading ? (
                                <View style={[localStyles.loadingContainer, {
                                    backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                    borderColor: colors.border
                                }]}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={[localStyles.loadingText, { color: colors.secondaryText }]}>
                                        Cargando nuestra visión...
                                    </Text>
                                </View>
                            ) : error ? (
                                <View style={[localStyles.errorContainer, {
                                    backgroundColor: isDarkMode ? 'rgba(254, 178, 178, 0.1)' : '#FFF5F5',
                                    borderLeftColor: colors.error
                                }]}>
                                    <Feather name="alert-triangle" size={32} color={colors.error} />
                                    <Text style={[localStyles.errorText, {
                                        color: isDarkMode ? '#FC8181' : '#C53030'
                                    }]}>{error}</Text>
                                </View>
                            ) : (
                                <Animated.View
                                    style={{
                                        opacity: fadeAnim,
                                        transform: [{
                                            translateY: fadeAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [20, 0]
                                            })
                                        }]
                                    }}
                                >
                                    <View style={[localStyles.visionCard, {
                                        backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                        borderColor: colors.border,
                                        shadowOpacity: isDarkMode ? 0.2 : 0.1,
                                        elevation: isDarkMode ? 2 : 1
                                    }]}>
                                        <View style={[localStyles.iconContainer, {
                                            backgroundColor: colors.primaryLight
                                        }]}>
                                            <Ionicons name="eye" size={32} color={colors.primary} />
                                        </View>
                                        <Text style={[localStyles.visionTitle, { color: colors.text }]}>
                                            Proyección de Futuro
                                        </Text>
                                        <Text style={[localStyles.visionText, { color: colors.secondaryText }]}>
                                            {vision}
                                        </Text>
                                    </View>

                                    <View style={[localStyles.visionInfoContainer, {
                                        backgroundColor: isDarkMode ? colors.primaryLight + '40' : colors.primaryLight
                                    }]}>
                                        <View style={localStyles.visionInfoItem}>
                                            <View style={[localStyles.visionInfoIconContainer, {
                                                backgroundColor: isDarkMode ? colors.primary + '50' : '#BEE3F8'
                                            }]}>
                                                <Ionicons name="telescope" size={20} color={colors.primary} />
                                            </View>
                                            <Text style={[localStyles.visionInfoText, {
                                                color: isDarkMode ? colors.text : '#2C5282'
                                            }]}>
                                                Nuestra visión guía nuestro rumbo y nuestras decisiones estratégicas.
                                            </Text>
                                        </View>

                                        <View style={localStyles.visionInfoItem}>
                                            <View style={[localStyles.visionInfoIconContainer, {
                                                backgroundColor: isDarkMode ? colors.primary + '50' : '#BEE3F8'
                                            }]}>
                                                <Ionicons name="trending-up" size={20} color={colors.primary} />
                                            </View>
                                            <Text style={[localStyles.visionInfoText, {
                                                color: isDarkMode ? colors.text : '#2C5282'
                                            }]}>
                                                Aspiramos a transformar la vida cotidiana a través de soluciones IoT innovadoras.
                                            </Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            )}
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos locales
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
    heroSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    heroImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
    },
    mainContent: {
        minHeight: 200,
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.3,
        marginLeft: 10,
        flex: 1,
    },
    visionCard: {
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        alignSelf: 'center',
    },
    visionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    visionText: {
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'justify',
        letterSpacing: 0.2,
    },
    visionInfoContainer: {
        borderRadius: 16,
        padding: 18,
    },
    visionInfoItem: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    visionInfoIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    visionInfoText: {
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
});
