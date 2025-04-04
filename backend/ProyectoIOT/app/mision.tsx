// app/mision.tsx
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
import { useAppTheme } from '../hooks/useAppTheme'; // Importar el hook de tema

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

export default function MisionScreen() {
    const router = useRouter();
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Obtener colores y estilos del tema
    const API_BASE = `${IPS.SERVER_URL}/api`;
    const [mision, setMision] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // useEffect para cargar la última misión desde el backend y animar la entrada
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

        const fetchMision = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE}/empresa/misiones`);
                const data = response.data as { contenido: string }[];
                const lastMision = data[data.length - 1]; // Toma la última misión
                setMision(lastMision?.contenido || 'No hay misión definida.');
                setError('');
            } catch (error) {
                console.error("Error fetching misión:", error);
                setError('No se pudo cargar la información de la misión.');
            } finally {
                setLoading(false);
            }
        };

        fetchMision();
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
                        }]}>Nuestra Misión</Text>

                        {/* Sección Hero (Imagen) con animación */}
                        <Animated.View
                            style={[
                                localStyles.heroSection,
                                { transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <Image
                                source={require('../assets/images/puertaIOT-mision.png')}
                                style={localStyles.heroImage}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        {/* Contenido principal: Misión */}
                        <View style={localStyles.mainContent}>
                            {loading ? (
                                <View style={[localStyles.loadingContainer, {
                                    backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                    borderColor: colors.border
                                }]}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={[localStyles.loadingText, { color: colors.secondaryText }]}>
                                        Cargando nuestra misión...
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
                                    <View style={[localStyles.misionCard, {
                                        backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                        borderColor: colors.border,
                                        shadowOpacity: isDarkMode ? 0.2 : 0.1,
                                        elevation: isDarkMode ? 2 : 1
                                    }]}>
                                        <View style={[localStyles.quoteContainer, {
                                            backgroundColor: colors.primaryLight,
                                            borderRadius: 30,
                                            width: 60,
                                            height: 60,
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }]}>
                                            <Ionicons name="albums" size={32} color={colors.primary} />
                                        </View>
                                        <Text style={[localStyles.misionText, { color: colors.text }]}>{mision}</Text>
                                    </View>

                                    <View style={[localStyles.misionInfo, {
                                        backgroundColor: isDarkMode ? colors.primaryLight + '40' : colors.primaryLight,
                                        borderColor: isDarkMode ? 'rgba(0,0,0,0)' : colors.border
                                    }]}>
                                        <Text style={[localStyles.misionInfoText, {
                                            color: isDarkMode ? colors.text : '#2C5282'
                                        }]}>
                                            Nuestra misión define quiénes somos y hacia dónde nos dirigimos como empresa.
                                            Representa nuestro compromiso con nuestros clientes y la sociedad.
                                        </Text>
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
    misionCard: {
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    quoteContainer: {
        alignItems: 'center',
        marginBottom: 16,
        alignSelf: 'center',
    },
    misionText: {
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'center',
        fontStyle: 'italic',
        letterSpacing: 0.3,
    },
    misionInfo: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    misionInfoText: {
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
    },
});
