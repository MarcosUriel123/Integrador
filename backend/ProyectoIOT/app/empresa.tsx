import React, { useState, useRef, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../componentes/Header';
import Footer from '../componentes/Footer';
import BotonVolver from '../componentes/BotonVolver';

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

export default function EmpresaScreen() {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const menuAnim = useRef(new Animated.Value(0)).current;

    // Funciones para cada apartado
    const handleMision = () => {
        router.push('/mision');
    };

    const handleVision = () => {
        router.push('/vision');
    };

    const handleValores = () => {
        router.push('/valores');
    };

    const handlePoliticas = () => {
        router.push('/politicas');
    };

    // Función para alternar la visibilidad del menú desplegable con animación
    const toggleMenu = () => {
        if (menuVisible) {
            // Cerrar menú con animación
            Animated.timing(menuAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start(() => {
                setMenuVisible(false);
            });
        } else {
            // Mostrar menú y animar
            setMenuVisible(true);
            Animated.timing(menuAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }).start();
        }
    };

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

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Nuestra Empresa" />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/" />
                    </View>

                    <Animated.View
                        style={[
                            styles.contentSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>¿Quiénes Somos?</Text>

                        {/* Sección Hero (Imagen) con animación */}
                        <Animated.View
                            style={[
                                styles.heroSection,
                                { transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <Image
                                source={require('../assets/images/puertaIOT-empresa.png')}
                                style={styles.heroImage}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        {/* Contenido principal */}
                        <View style={styles.mainContent}>
                            <Text style={styles.description}>
                                Somos una empresa innovadora especializada en soluciones IoT para el control
                                de acceso y seguridad. Nuestra tecnología permite a hogares y negocios
                                controlar sus sistemas de seguridad de manera inteligente y eficiente.
                            </Text>

                            <View style={styles.featuresContainer}>
                                <View style={styles.featureItem}>
                                    <View style={styles.featureIconContainer}>
                                        <Ionicons name="shield-checkmark" size={22} color="#3182CE" />
                                    </View>
                                    <Text style={styles.featureText}>Soluciones de seguridad innovadoras</Text>
                                </View>

                                <View style={styles.featureItem}>
                                    <View style={styles.featureIconContainer}>
                                        <Ionicons name="wifi" size={22} color="#3182CE" />
                                    </View>
                                    <Text style={styles.featureText}>Tecnología IoT de vanguardia</Text>
                                </View>

                                <View style={styles.featureItem}>
                                    <View style={styles.featureIconContainer}>
                                        <Ionicons name="people" size={22} color="#3182CE" />
                                    </View>
                                    <Text style={styles.featureText}>Equipo profesional y comprometido</Text>
                                </View>
                            </View>

                            {/* Tarjeta de navegación a secciones */}
                            <View style={styles.navSection}>
                                <Text style={styles.navTitle}>Nuestra Identidad Corporativa</Text>
                                <Text style={styles.navDescription}>
                                    Descubre lo que nos define como empresa y nuestra filosofía de trabajo
                                </Text>

                                {/* Botón para desplegar el menú */}
                                <TouchableOpacity
                                    style={styles.dropdownButtonContainer}
                                    onPress={toggleMenu}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#3182CE', '#2C5282']}
                                        style={styles.dropdownButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.dropdownButtonText}>
                                            Conoce más sobre nosotros
                                        </Text>
                                        <Ionicons
                                            name={menuVisible ? "chevron-up" : "chevron-down"}
                                            size={18}
                                            color="#FFFFFF"
                                            style={{ marginLeft: 8 }}
                                        />
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Menú desplegable con animación */}
                                {menuVisible && (
                                    <Animated.View
                                        style={[
                                            styles.dropdownMenu,
                                            {
                                                opacity: menuAnim,
                                                transform: [
                                                    {
                                                        translateY: menuAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [-20, 0]
                                                        })
                                                    }
                                                ]
                                            }
                                        ]}
                                    >
                                        <TouchableOpacity
                                            style={styles.menuItem}
                                            onPress={handleMision}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.menuIconContainer}>
                                                <MaterialCommunityIcons name="target" size={20} color="#3182CE" />
                                            </View>
                                            <View style={styles.menuItemContent}>
                                                <Text style={styles.menuItemTitle}>Misión</Text>
                                                <Text style={styles.menuItemDescription}>
                                                    Nuestro propósito y compromiso
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color="#3182CE" />
                                        </TouchableOpacity>

                                        <View style={styles.menuDivider} />

                                        <TouchableOpacity
                                            style={styles.menuItem}
                                            onPress={handleVision}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.menuIconContainer}>
                                                <Ionicons name="eye-outline" size={20} color="#3182CE" />
                                            </View>
                                            <View style={styles.menuItemContent}>
                                                <Text style={styles.menuItemTitle}>Visión</Text>
                                                <Text style={styles.menuItemDescription}>
                                                    Hacia dónde nos dirigimos
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color="#3182CE" />
                                        </TouchableOpacity>

                                        <View style={styles.menuDivider} />

                                        <TouchableOpacity
                                            style={styles.menuItem}
                                            onPress={handleValores}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.menuIconContainer}>
                                                <Ionicons name="star-outline" size={20} color="#3182CE" />
                                            </View>
                                            <View style={styles.menuItemContent}>
                                                <Text style={styles.menuItemTitle}>Valores</Text>
                                                <Text style={styles.menuItemDescription}>
                                                    Los principios que nos guían
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color="#3182CE" />
                                        </TouchableOpacity>

                                        <View style={styles.menuDivider} />

                                        <TouchableOpacity
                                            style={styles.menuItem}
                                            onPress={handlePoliticas}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.menuIconContainer}>
                                                <Ionicons name="shield-outline" size={20} color="#3182CE" />
                                            </View>
                                            <View style={styles.menuItemContent}>
                                                <Text style={styles.menuItemTitle}>Políticas</Text>
                                                <Text style={styles.menuItemDescription}>
                                                    Nuestros lineamientos y normativas
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color="#3182CE" />
                                        </TouchableOpacity>
                                    </Animated.View>
                                )}
                            </View>
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
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        lineHeight: 26,
        color: '#4A5568',
        marginBottom: 24,
        textAlign: 'justify',
    },
    featuresContainer: {
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    featureIconContainer: {
        backgroundColor: '#EBF8FF',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    featureText: {
        fontSize: 15,
        color: '#2D3748',
        flex: 1,
    },
    navSection: {
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    navTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 6,
    },
    navDescription: {
        fontSize: 14,
        color: '#4A5568',
        marginBottom: 18,
    },
    dropdownButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    dropdownButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropdownButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    dropdownMenu: {
        marginTop: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    menuIconContainer: {
        backgroundColor: '#EBF8FF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemContent: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 2,
    },
    menuItemDescription: {
        fontSize: 13,
        color: '#718096',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 8,
    },
});
