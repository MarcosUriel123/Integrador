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
import { Ionicons } from '@expo/vector-icons';
import Header from '../componentes/Header';
import Footer from '../componentes/Footer';
import BotonVolver from '../componentes/BotonVolver';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

export default function MisionScreen() {
    const router = useRouter();
    const API_BASE = 'http://192.168.1.133:8082/api';
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
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Nuestra Misión" />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/empresa" />
                    </View>

                    <Animated.View
                        style={[
                            styles.contentSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Nuestra Misión</Text>

                        {/* Sección Hero (Imagen) con animación */}
                        <Animated.View
                            style={[
                                styles.heroSection,
                                { transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <Image
                                source={require('../assets/images/puertaIOT-mision.png')}
                                style={styles.heroImage}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        {/* Contenido principal: Misión */}
                        <View style={styles.mainContent}>
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#3182CE" />
                                    <Text style={styles.loadingText}>Cargando nuestra misión...</Text>
                                </View>
                            ) : error ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={32} color="#FC8181" />
                                    <Text style={styles.errorText}>{error}</Text>
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
                                    <View style={styles.misionCard}>
                                        <View style={styles.quoteContainer}>
                                            <Ionicons name="quote" size={32} color="#3182CE" />
                                        </View>
                                        <Text style={styles.misionText}>{mision}</Text>
                                    </View>

                                    <View style={styles.misionInfo}>
                                        <Text style={styles.misionInfoText}>
                                            Nuestra misión define quiénes somos y hacia dónde nos dirigimos como empresa.
                                            Representa nuestro compromiso con nuestros clientes y la sociedad.
                                        </Text>
                                    </View>
                                </Animated.View>
                            )}
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
    heroSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    heroImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        backgroundColor: '#EBF8FF',
    },
    mainContent: {
        minHeight: 200,
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        color: '#C53030',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.3,
        marginLeft: 10,
        flex: 1,
    },
    misionCard: {
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: "rgba(0,0,0,0.06)",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    quoteContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    misionText: {
        fontSize: 18,
        lineHeight: 28,
        color: '#2D3748',
        textAlign: 'center',
        fontStyle: 'italic',
        letterSpacing: 0.3,
    },
    misionInfo: {
        backgroundColor: '#EBF8FF',
        borderRadius: 16,
        padding: 16,
    },
    misionInfoText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#2C5282',
        textAlign: 'center',
    },
});
