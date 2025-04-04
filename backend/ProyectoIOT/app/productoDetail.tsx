import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAppTheme } from '../hooks/useAppTheme'; // Importar el hook de tema

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
}

export default function ProductDetail() {
    const router = useRouter();
    const currentPath = usePathname();
    const params = useLocalSearchParams();
    const productParam = params.product as string;
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Usar el hook de tema

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    let product: Product | null = null;

    try {
        if (productParam) {
            product = JSON.parse(productParam);
        }
    } catch (error) {
        console.error("Error al parsear el producto:", error);
    }

    // Verificar si el usuario ha iniciado sesión al cargar la pantalla o cuando regrese a ella
    const checkLoginStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            setIsLoggedIn(!!token);
        } catch (error) {
            console.error('Error al verificar el estado de inicio de sesión:', error);
            setIsLoggedIn(false);
        }
    };

    // Obtener colores del gradiente para el botón según el estado de login
    const getButtonGradientColors = () => {
        if (isLoggedIn) {
            return isDarkMode
                ? [colors.primary, '#1e3a8a'] // Primario a azul oscuro para tema oscuro
                : [colors.primary, '#2C5282']; // Primario a azul medio para tema claro
        } else {
            return isDarkMode
                ? ['#ED8936', '#C05621'] // Naranja más oscuro para tema oscuro
                : ['#ED8936', '#DD6B20']; // Naranja para tema claro
        }
    };

    // Animación de entrada
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

        checkLoginStatus();
    }, []);

    // Reemplazamos el hook useEffect con useFocusEffect para detectar cuando la pantalla recibe el foco
    useFocusEffect(
        useCallback(() => {
            checkLoginStatus();
        }, [])
    );

    const handlePurchase = async () => {
        // Verificar si el usuario tiene la sesión iniciada
        const token = await AsyncStorage.getItem('userToken');

        if (token) {
            // Usuario con sesión iniciada
            Alert.alert(
                "¡Compra Exitosa, ahora puedes dar de alta tu dispositivo!",
                `Has comprado ${product?.name} correctamente.`,
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.push('/registroDispositivo');
                        }
                    }
                ]
            );
        } else {
            // Usuario sin sesión iniciada
            Alert.alert(
                "Iniciar sesión requerido",
                "Para completar la compra, necesitas iniciar sesión primero.",
                [
                    {
                        text: "Cancelar",
                        style: "cancel"
                    },
                    {
                        text: "Iniciar sesión",
                        onPress: () => {
                            // Pasar la ruta actual como parámetro para regresar después de login
                            router.push({
                                pathname: '/Login1',
                                params: { returnTo: currentPath, productParam: productParam }
                            });
                        }
                    }
                ]
            );
        }
    };

    // El renderizado condicional para cuando no hay producto
    if (!product) {
        return (
            <SafeAreaView style={baseStyles.screen}>
                <ScrollView style={{ flex: 1 }}>
                    <View style={baseStyles.contentContainer}>
                        <Animated.View
                            style={[
                                baseStyles.errorContainer,
                                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                            ]}
                        >
                            <Feather name="alert-triangle" size={48} color={colors.error} />
                            <Text style={[baseStyles.subtitle, { textAlign: 'center' }]}>Producto no encontrado</Text>
                            <Text style={[baseStyles.normalText, { textAlign: 'center', marginBottom: 20 }]}>
                                El producto solicitado no está disponible o ha sido eliminado.
                            </Text>
                            <TouchableOpacity
                                style={baseStyles.primaryButton}
                                onPress={() => router.push('/CatalogoProductosScreen')}
                                activeOpacity={0.7}
                            >
                                <Text style={baseStyles.primaryButtonText}>Ver catálogo de productos</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // El renderizado principal
    return (
        <SafeAreaView style={baseStyles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={baseStyles.contentContainer}>
                    <View style={localStyles.buttonBackContainer}>
                    </View>

                    <Animated.View
                        style={[
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <View style={localStyles.imageContainer}>
                            <Image
                                source={{ uri: product.image }}
                                style={localStyles.image}
                                resizeMode="cover"
                            />
                            <View style={[localStyles.categoryBadge, { backgroundColor: colors.primary + 'E6' }]}>
                                <Text style={localStyles.categoryText}>{product.category}</Text>
                            </View>
                        </View>

                        <View style={[localStyles.productInfoContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[localStyles.productTitle, { color: colors.text }]}>{product.name}</Text>

                            <View style={localStyles.priceContainer}>
                                <Text style={[localStyles.priceLabel, { color: colors.secondaryText }]}>Precio:</Text>
                                <Text style={[localStyles.priceValue, { color: colors.primary }]}>${product.price.toFixed(2)}</Text>
                            </View>

                            <View style={[localStyles.divider, { backgroundColor: colors.border }]} />

                            <Text style={[localStyles.descriptionLabel, { color: colors.text }]}>Descripción</Text>
                            <Text style={[localStyles.descriptionText, { color: colors.secondaryText }]}>
                                {product.description || 'Sin descripción disponible.'}
                            </Text>

                            {/* Características del producto */}
                            <View style={localStyles.featuresContainer}>
                                <View style={localStyles.featureItem}>
                                    <View style={[localStyles.featureIconContainer, { backgroundColor: colors.primaryLight }]}>
                                        <MaterialCommunityIcons name="shield-check" size={20} color={colors.primary} />
                                    </View>
                                    <Text style={[localStyles.featureText, { color: colors.text }]}>Garantía de 12 meses</Text>
                                </View>

                                <View style={localStyles.featureItem}>
                                    <View style={[localStyles.featureIconContainer, { backgroundColor: colors.primaryLight }]}>
                                        <MaterialCommunityIcons name="truck-delivery" size={20} color={colors.primary} />
                                    </View>
                                    <Text style={[localStyles.featureText, { color: colors.text }]}>Envío gratuito</Text>
                                </View>
                            </View>

                            {/* Información de instalación */}
                            <Animated.View
                                style={[
                                    localStyles.installInfoContainer,
                                    {
                                        backgroundColor: colors.primaryLight,
                                        transform: [{ translateY: slideAnim }]
                                    }
                                ]}
                            >
                                <View style={localStyles.installInfoIconContainer}>
                                    <Ionicons name="information-circle" size={24} color={colors.primary} />
                                </View>
                                <Text style={[localStyles.installInfoText, { color: colors.text }]}>
                                    Después de la compra, podrás registrar este dispositivo en tu cuenta.
                                </Text>
                            </Animated.View>

                            {/* Botón de Compra mejorado */}
                            <TouchableOpacity
                                style={[
                                    localStyles.purchaseButtonContainer,
                                    {
                                        shadowOpacity: isDarkMode ? 0.2 : 0.15,
                                        elevation: isDarkMode ? 3 : 2
                                    }
                                ]}
                                onPress={handlePurchase}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={getButtonGradientColors()}
                                    style={localStyles.purchaseButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <FontAwesome5
                                        name={isLoggedIn ? "shopping-cart" : "sign-in-alt"}
                                        size={16}
                                        color="#FFFFFF"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={localStyles.purchaseButtonText}>
                                        {isLoggedIn ? "Comprar Ahora" : "Iniciar sesión para comprar"}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {!isLoggedIn && (
                                <Text style={[localStyles.loginNote, { color: colors.secondaryText }]}>
                                    Debes iniciar sesión para realizar una compra
                                </Text>
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
    buttonBackContainer: {
        marginBottom: 0,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    image: {
        width: '100%',
        height: 210,
    },
    categoryBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    categoryText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    productInfoContainer: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    productTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    priceLabel: {
        fontSize: 16,
        marginRight: 8,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        marginBottom: 16,
    },
    descriptionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    featuresContainer: {
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    featureIconContainer: {
        padding: 8,
        borderRadius: 8,
        marginRight: 12,
    },
    featureText: {
        fontSize: 14,
    },
    installInfoContainer: {
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    installInfoIconContainer: {
        marginRight: 12,
    },
    installInfoText: {
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    purchaseButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
    },
    purchaseButton: {
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    purchaseButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    loginNote: {
        marginTop: 10,
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});