import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { Entypo, Feather, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IPS from '../config/IPS';
import { useAppTheme } from '../hooks/useAppTheme'; // Importar hook de tema

// Interfaz para las FAQs
interface FAQ {
    _id: string;
    pregunta: string;
    respuesta: string;
}

export default function PantallaPrincipal() {
    const router = useRouter();
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Obtener colores y estilos del tema
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loadingFaqs, setLoadingFaqs] = useState(true);
    const [error, setError] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    // Configurar animaciones
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    // Cargar preguntas frecuentes al montar el componente
    useEffect(() => {
        // Animar entrada del contenido
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 700,
                useNativeDriver: true,
            })
        ]).start();

        const fetchFAQs = async () => {
            try {
                setLoadingFaqs(true);
                const response = await axios.get<FAQ[]>(`${IPS.SERVER_URL}/api/preguntasFrecuentes`);
                setFaqs(response.data);
                setError('');
            } catch (err) {
                console.error('Error al cargar preguntas frecuentes:', err);
                setError('No se pudieron cargar las preguntas frecuentes');
                // Usar algunos datos de respaldo en caso de error
                setFaqs([
                    { _id: '1', pregunta: '¿Para qué sirve Segurix?', respuesta: 'Segurix es una plataforma para gestionar y controlar dispositivos IoT de seguridad.' },
                    { _id: '2', pregunta: '¿Cómo conectar mi dispositivo IoT?', respuesta: 'Ve a la sección de dispositivos y sigue las instrucciones de configuración.' }
                ]);
            } finally {
                setLoadingFaqs(false);
            }
        };

        fetchFAQs();
    }, []);

    // Función para alternar la visibilidad de la respuesta
    const toggleFaqExpansion = (id: string) => {
        if (expandedFaq === id) {
            setExpandedFaq(null);
        } else {
            setExpandedFaq(id);
        }
    };

    // Helper para verificar autenticación antes de navegar
    const navigateWithAuthCheck = async (path: string) => {
        try {
            // Lista de rutas públicas que no requieren autenticación
            const publicRoutes = [
                '/CatalogoProductosScreen',
                '/empresa',
                // Agregar otras rutas públicas aquí si es necesario
            ];

            // Si es una ruta pública, navegar directamente sin verificar autenticación
            if (publicRoutes.includes(path)) {
                router.push(path as any);
                return;
            }

            // Para rutas protegidas, verificar autenticación
            const token = await AsyncStorage.getItem('userToken');

            if (token) {
                // Usuario autenticado, navegar a la ruta solicitada
                router.push(path as any);
            } else {
                // Usuario no autenticado, guardar la ruta deseada y redirigir al login
                await AsyncStorage.setItem('redirectAfterLogin', path);
                router.push('/Login1');
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            router.push('/Login1');
        }
    };

    // Función para manejar el botón de perfil
    const handleProfilePress = async () => {
        try {
            // Verificar si hay una sesión activa
            const token = await AsyncStorage.getItem('userToken');

            if (token) {
                // Si hay sesión activa, navegar al perfil
                router.push('/Datosperfil');
            } else {
                // Si no hay sesión activa, redirigir al login
                router.push('/Login1');

                // Opcional: guardar la ruta de retorno para después del login
                await AsyncStorage.setItem('redirectAfterLogin', '/Datosperfil');
            }
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            router.push('/Login1');
        }
    };

    return (
        <SafeAreaView style={baseStyles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={baseStyles.contentContainer}>
                    <Animated.View
                        style={[
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        {/* Sección Hero */}
                        <Text style={[localStyles.sectionTitle, {
                            color: colors.text,
                            borderBottomColor: colors.primary
                        }]}>Segurix IoT</Text>

                        <View style={[localStyles.heroSection, {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            shadowOpacity: isDarkMode ? 0.2 : 0.1,
                            elevation: isDarkMode ? 2 : 1
                        }]}>
                            <Image
                                source={require('../assets/images/puertaIOT-pantallaPrincipal.jpg')}
                                style={localStyles.heroImage}
                                resizeMode="cover"
                            />
                            <Text style={[localStyles.heroTitle, { color: colors.text }]}>
                                Bienvenido a Segurix
                            </Text>
                            <Text style={[localStyles.heroSubtitle, { color: colors.secondaryText }]}>
                                La solución inteligente para controlar y asegurar tus dispositivos IoT.
                            </Text>
                        </View>

                        {/* Características principales */}
                        <View style={localStyles.featuresContainer}>
                            <View style={localStyles.featureItem}>
                                <View style={[localStyles.featureIconContainer, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
                                </View>
                                <Text style={[localStyles.featureText, { color: colors.text }]}>
                                    Seguridad de primera clase para tu hogar
                                </Text>
                            </View>

                            <View style={localStyles.featureItem}>
                                <View style={[localStyles.featureIconContainer, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="wifi" size={22} color={colors.primary} />
                                </View>
                                <Text style={[localStyles.featureText, { color: colors.text }]}>
                                    Conectividad y control remoto
                                </Text>
                            </View>

                            <View style={localStyles.featureItem}>
                                <View style={[localStyles.featureIconContainer, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="notifications" size={22} color={colors.primary} />
                                </View>
                                <Text style={[localStyles.featureText, { color: colors.text }]}>
                                    Alertas y notificaciones en tiempo real
                                </Text>
                            </View>
                        </View>

                        {/* Sección de Preguntas Frecuentes */}
                        <Text style={[localStyles.sectionTitle, {
                            color: colors.text,
                            borderBottomColor: colors.primary,
                            marginTop: 30
                        }]}>Preguntas Frecuentes</Text>

                        <View style={localStyles.faqSection}>
                            {loadingFaqs ? (
                                <View style={[localStyles.loadingContainer, {
                                    backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                    borderColor: colors.border
                                }]}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={[localStyles.loadingText, { color: colors.secondaryText }]}>
                                        Cargando preguntas...
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
                                faqs.map((faq) => (
                                    <View key={faq._id} style={[localStyles.faqItem, {
                                        backgroundColor: colors.card,
                                        borderColor: colors.border
                                    }]}>
                                        <TouchableOpacity
                                            style={[localStyles.faqQuestion, {
                                                backgroundColor: isDarkMode ? colors.card : '#F7FAFC'
                                            }]}
                                            onPress={() => toggleFaqExpansion(faq._id)}
                                        >
                                            <Text style={[localStyles.faqQuestionText, { color: colors.text }]}>
                                                {faq.pregunta}
                                            </Text>
                                            <Ionicons
                                                name={expandedFaq === faq._id ? "chevron-up" : "chevron-down"}
                                                size={20}
                                                color={colors.primary}
                                            />
                                        </TouchableOpacity>

                                        {expandedFaq === faq._id && (
                                            <View style={[localStyles.faqAnswer, {
                                                backgroundColor: isDarkMode ? colors.primaryLight + '30' : colors.primaryLight + '40',
                                                borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                            }]}>
                                                <Text style={[localStyles.faqAnswerText, { color: colors.secondaryText }]}>
                                                    {faq.respuesta}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ))
                            )}
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
    heroSection: {
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 6,
    },
    heroImage: {
        width: '100%',
        borderRadius: 12,
        height: 200,
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    heroSubtitle: {
        fontSize: 16,
        marginTop: 4,
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 24,
        paddingHorizontal: 15,
        fontWeight: '400',
    },
    featuresContainer: {
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    featureIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    featureText: {
        fontSize: 15,
        flex: 1,
    },
    faqSection: {
        marginBottom: 20,
    },
    faqItem: {
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    faqQuestion: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestionText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        letterSpacing: 0.3,
    },
    faqAnswer: {
        padding: 16,
        borderTopWidth: 1,
    },
    faqAnswerText: {
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0.2,
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
});