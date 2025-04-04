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
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../hooks/useAppTheme'; // Importar hook de tema

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

export default function EmpresaScreen() {
    const router = useRouter();
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Obtener colores y estilos del tema
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

    // Obtener colores del gradiente para el botón según el tema
    const getButtonGradientColors = () => {
        return isDarkMode
            ? [colors.primary, '#1e3a8a'] // Primario a azul oscuro para tema oscuro
            : [colors.primary, '#2C5282']; // Primario a azul medio para tema claro
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
        <SafeAreaView style={baseStyles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={baseStyles.contentContainer}>
                    <Animated.View
                        style={[
                            {
                                width: '100%',
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        <Text style={[localStyles.sectionTitle, {
                            color: colors.text,
                            borderBottomColor: colors.primary
                        }]}>¿Quiénes Somos?</Text>

                        {/* Sección Hero (Imagen) con animación */}
                        <Animated.View
                            style={[
                                localStyles.heroSection,
                                { transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <Image
                                source={require('../assets/images/puertaIOT-pantallaPrincipal.jpg')}
                                style={localStyles.heroImage}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        {/* Contenido principal */}
                        <View style={localStyles.mainContent}>
                            <Text style={[localStyles.description, { color: colors.secondaryText }]}>
                                Somos una empresa innovadora especializada en soluciones IoT para el control
                                de acceso y seguridad. Nuestra tecnología permite a hogares y negocios
                                controlar sus sistemas de seguridad de manera inteligente y eficiente.
                            </Text>

                            <View style={localStyles.featuresContainer}>
                                <View style={localStyles.featureItem}>
                                    <View style={[localStyles.featureIconContainer, { backgroundColor: colors.primaryLight }]}>
                                        <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
                                    </View>
                                    <Text style={[localStyles.featureText, { color: colors.text }]}>
                                        Soluciones de seguridad innovadoras
                                    </Text>
                                </View>

                                <View style={localStyles.featureItem}>
                                    <View style={[localStyles.featureIconContainer, { backgroundColor: colors.primaryLight }]}>
                                        <Ionicons name="wifi" size={22} color={colors.primary} />
                                    </View>
                                    <Text style={[localStyles.featureText, { color: colors.text }]}>
                                        Tecnología IoT de vanguardia
                                    </Text>
                                </View>

                                <View style={localStyles.featureItem}>
                                    <View style={[localStyles.featureIconContainer, { backgroundColor: colors.primaryLight }]}>
                                        <Ionicons name="people" size={22} color={colors.primary} />
                                    </View>
                                    <Text style={[localStyles.featureText, { color: colors.text }]}>
                                        Equipo profesional y comprometido
                                    </Text>
                                </View>
                            </View>

                            {/* Tarjeta de navegación a secciones */}
                            <View style={[localStyles.navSection, {
                                backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                                borderColor: colors.border
                            }]}>
                                <Text style={[localStyles.navTitle, { color: colors.text }]}>
                                    Nuestra Identidad Corporativa
                                </Text>
                                <Text style={[localStyles.navDescription, { color: colors.secondaryText }]}>
                                    Descubre lo que nos define como empresa y nuestra filosofía de trabajo
                                </Text>

                                {/* Botón para desplegar el menú */}
                                <TouchableOpacity
                                    style={[
                                        localStyles.dropdownButtonContainer,
                                        {
                                            shadowOpacity: isDarkMode ? 0.2 : 0.15,
                                            elevation: isDarkMode ? 3 : 2
                                        }
                                    ]}
                                    onPress={toggleMenu}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={getButtonGradientColors()}
                                        style={localStyles.dropdownButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={localStyles.dropdownButtonText}>
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
                                            localStyles.dropdownMenu,
                                            {
                                                backgroundColor: colors.card,
                                                borderColor: colors.border,
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
                                            style={localStyles.menuItem}
                                            onPress={handleMision}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[localStyles.menuIconContainer, { backgroundColor: colors.primaryLight }]}>
                                                <MaterialCommunityIcons name="target" size={20} color={colors.primary} />
                                            </View>
                                            <View style={localStyles.menuItemContent}>
                                                <Text style={[localStyles.menuItemTitle, { color: colors.text }]}>Misión</Text>
                                                <Text style={[localStyles.menuItemDescription, { color: colors.secondaryText }]}>
                                                    Nuestro propósito y compromiso
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                                        </TouchableOpacity>

                                        <View style={[localStyles.menuDivider, { backgroundColor: colors.divider }]} />

                                        <TouchableOpacity
                                            style={localStyles.menuItem}
                                            onPress={handleVision}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[localStyles.menuIconContainer, { backgroundColor: colors.primaryLight }]}>
                                                <Ionicons name="eye-outline" size={20} color={colors.primary} />
                                            </View>
                                            <View style={localStyles.menuItemContent}>
                                                <Text style={[localStyles.menuItemTitle, { color: colors.text }]}>Visión</Text>
                                                <Text style={[localStyles.menuItemDescription, { color: colors.secondaryText }]}>
                                                    Hacia dónde nos dirigimos
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                                        </TouchableOpacity>

                                        <View style={[localStyles.menuDivider, { backgroundColor: colors.divider }]} />

                                        <TouchableOpacity
                                            style={localStyles.menuItem}
                                            onPress={handleValores}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[localStyles.menuIconContainer, { backgroundColor: colors.primaryLight }]}>
                                                <Ionicons name="star-outline" size={20} color={colors.primary} />
                                            </View>
                                            <View style={localStyles.menuItemContent}>
                                                <Text style={[localStyles.menuItemTitle, { color: colors.text }]}>Valores</Text>
                                                <Text style={[localStyles.menuItemDescription, { color: colors.secondaryText }]}>
                                                    Los principios que nos guían
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                                        </TouchableOpacity>

                                        <View style={[localStyles.menuDivider, { backgroundColor: colors.divider }]} />

                                        <TouchableOpacity
                                            style={localStyles.menuItem}
                                            onPress={handlePoliticas}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[localStyles.menuIconContainer, { backgroundColor: colors.primaryLight }]}>
                                                <Ionicons name="shield-outline" size={20} color={colors.primary} />
                                            </View>
                                            <View style={localStyles.menuItemContent}>
                                                <Text style={[localStyles.menuItemTitle, { color: colors.text }]}>Políticas</Text>
                                                <Text style={[localStyles.menuItemDescription, { color: colors.secondaryText }]}>
                                                    Nuestros lineamientos y normativas
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                                        </TouchableOpacity>
                                    </Animated.View>
                                )}
                            </View>
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
        marginBottom: 25,
    },
    heroImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
    },
    mainContent: {
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        lineHeight: 26,
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
    navSection: {
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
    },
    navTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    navDescription: {
        fontSize: 14,
        marginBottom: 18,
    },
    dropdownButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
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
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
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
        marginBottom: 2,
    },
    menuItemDescription: {
        fontSize: 13,
    },
    menuDivider: {
        height: 1,
        marginVertical: 8,
    },
});
