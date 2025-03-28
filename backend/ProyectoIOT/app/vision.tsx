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
import { Ionicons } from '@expo/vector-icons';
import Header from '../componentes/Header';
import Footer from '../componentes/Footer';
import BotonVolver from '../componentes/BotonVolver';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

export default function VisionScreen() {
    const router = useRouter();
    const API_BASE = 'http://192.168.1.133:8082/api';
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
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Nuestra Visión" />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/empresa" />
                    </View>

                    <Animated.View
                        style={[
                            styles.contentSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Nuestra Visión</Text>

                        {/* Sección Hero (Imagen) con animación */}
                        <Animated.View
                            style={[
                                styles.heroSection,
                                { transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <Image
                                source={require('../assets/images/puertaIOT-vision.jpg')}
                                style={styles.heroImage}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        {/* Contenido principal: Visión */}
                        <View style={styles.mainContent}>
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#3182CE" />
                                    <Text style={styles.loadingText}>Cargando nuestra visión...</Text>
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
                                    <View style={styles.visionCard}>
                                        <View style={styles.iconContainer}>
                                            <Ionicons name="eye" size={32} color="#3182CE" />
                                        </View>
                                        <Text style={styles.visionTitle}>Proyección de Futuro</Text>
                                        <Text style={styles.visionText}>{vision}</Text>
                                    </View>

                                    <View style={styles.visionInfoContainer}>
                                        <View style={styles.visionInfoItem}>
                                            <View style={styles.visionInfoIconContainer}>
                                                <Ionicons name="telescope" size={20} color="#3182CE" />
                                            </View>
                                            <Text style={styles.visionInfoText}>
                                                Nuestra visión guía nuestro rumbo y nuestras decisiones estratégicas.
                                            </Text>
                                        </View>

                                        <View style={styles.visionInfoItem}>
                                            <View style={styles.visionInfoIconContainer}>
                                                <Ionicons name="trending-up" size={20} color="#3182CE" />
                                            </View>
                                            <Text style={styles.visionInfoText}>
                                                Aspiramos a transformar la vida cotidiana a través de soluciones IoT innovadoras.
                                            </Text>
                                        </View>
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
    visionCard: {
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: "rgba(0,0,0,0.06)",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    visionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 12,
        textAlign: 'center',
    },
    visionText: {
        fontSize: 16,
        lineHeight: 26,
        color: '#4A5568',
        textAlign: 'justify',
        letterSpacing: 0.2,
    },
    visionInfoContainer: {
        backgroundColor: '#EBF8FF',
        borderRadius: 16,
        padding: 18,
    },
    visionInfoItem: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    visionInfoIconContainer: {
        backgroundColor: '#BEE3F8',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    visionInfoText: {
        fontSize: 14,
        color: '#2C5282',
        flex: 1,
        lineHeight: 20,
    },
});
