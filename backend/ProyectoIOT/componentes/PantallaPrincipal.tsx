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
                const response = await axios.get<FAQ[]>('http://192.168.8.3:8082/api/preguntasFrecuentes');
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
        backgroundColor: '#CFE2FF',
    },
    cardContainer: {
        margin: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    /* Sección Hero */
    heroSection: {
        marginTop: 10,
        alignItems: 'center',
    },
    heroImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginTop: 15,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#2C2C2C',
        marginTop: 8,
        textAlign: 'center',
        marginBottom: 10,
    },
    /* Sección Preguntas Frecuentes */
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1E1E1E',
    },
    faqSection: {
        marginTop: 30,
    },
    faqItem: {
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        marginBottom: 10,
        overflow: 'hidden',
    },
    faqQuestion: {
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E1E1E',
        flex: 1,
    },
    faqAnswer: {
        backgroundColor: '#F0F0F0',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    faqAnswerText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        padding: 20,
        backgroundColor: '#ffebee',
        borderRadius: 8,
    },
    errorText: {
        color: '#c62828',
        textAlign: 'center',
    }
});