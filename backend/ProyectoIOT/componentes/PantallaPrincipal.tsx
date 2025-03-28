import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Entypo, Feather } from '@expo/vector-icons'; // Añadir Feather
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Añadir AsyncStorage
import Header from './Header';
import Footer from './Footer';

// Interfaz para las FAQs
interface FAQ {
    _id: string;
    pregunta: string;
    respuesta: string;
}

export default function PantallaPrincipal() {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loadingFaqs, setLoadingFaqs] = useState(true);
    const [error, setError] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    // Cargar preguntas frecuentes al montar el componente
    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                setLoadingFaqs(true);
                const response = await axios.get<FAQ[]>('http://192.168.1.133:8082/api/preguntasFrecuentes');
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
                setMenuVisible(false);
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
        } finally {
            // Cerrar el menú
            setMenuVisible(false);
        }
    };

    // Función para manejar el botón de perfil - modificada
    const handleProfilePress = async () => {
        try {
            // Verificar si hay una sesión activa
            const token = await AsyncStorage.getItem('userToken');

            if (token) {
                // Si hay sesión activa, navegar al perfil
                router.push('/Datosperfil');
            } else {
                // Si no hay sesión activa, redirigir al login
                // Cambiamos replace por push para mantener la navegación hacia atrás
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
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    {/* Usar el componente Header */}
                    <Header />

                    {/* Sección Hero */}
                    <View style={styles.heroSection}>
                        <Image
                            source={require('../assets/images/puertaIOT-pantallaPrincipal.jpg')}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                        <Text style={styles.heroTitle}>Bienvenido a Segurix</Text>
                        <Text style={styles.heroSubtitle}>
                            La solución inteligente para controlar y asegurar tus dispositivos IoT.
                        </Text>
                    </View>

                    {/* Sección de Preguntas Frecuentes */}
                    <View style={styles.faqSection}>
                        <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>

                        {loadingFaqs ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#007bff" />
                                <Text style={styles.loadingText}>Cargando preguntas...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : (
                            faqs.map((faq) => (
                                <View key={faq._id} style={styles.faqItem}>
                                    <TouchableOpacity
                                        style={styles.faqQuestion}
                                        onPress={() => toggleFaqExpansion(faq._id)}
                                    >
                                        <Text style={styles.faqQuestionText}>{faq.pregunta}</Text>
                                        <Entypo
                                            name={expandedFaq === faq._id ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color="#1E1E1E"
                                        />
                                    </TouchableOpacity>

                                    {expandedFaq === faq._id && (
                                        <View style={styles.faqAnswer}>
                                            <Text style={styles.faqAnswerText}>{faq.respuesta}</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>

                    {/* Usar el componente Footer */}
                    <Footer />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f0f4f8', // Fondo más suave
    },
    cardContainer: {
        padding: 20,
    },
    /* Sección Hero */
    heroSection: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        shadowColor: "rgba(0,0,0,0.2)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
        padding: 16,
        marginBottom: 30,
        marginTop: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    heroImage: {
        width: '100%',
        borderRadius: 20,
        height: 240,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: 'rgba(226,232,240,0.6)',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1A365D', // Azul más profundo
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    heroSubtitle: {
        fontSize: 17,
        color: '#4A5568',
        marginTop: 4,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24,
        paddingHorizontal: 15,
        fontWeight: '400',
    },
    /* Sección Preguntas Frecuentes */
    faqSection: {
        marginTop: 25,
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
    faqItem: {
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: "rgba(0,0,0,0.06)",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    faqQuestion: {
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
    },
    faqQuestionText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#2C5282', // Azul más profundo para las preguntas
        flex: 1,
        letterSpacing: 0.3,
    },
    faqAnswer: {
        backgroundColor: '#EBF8FF', // Fondo azul claro para las respuestas
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#BEE3F8',
    },
    faqAnswerText: {
        fontSize: 16,
        color: '#2D3748',
        lineHeight: 24,
        letterSpacing: 0.2,
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
        shadowColor: "rgba(0,0,0,0.05)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
    },
    errorText: {
        color: '#C53030',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.3,
    }
});