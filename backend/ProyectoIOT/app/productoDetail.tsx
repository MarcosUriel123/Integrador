import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import BotonVolver from '../componentes/BotonVolver';
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
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../componentes/Header';
import Footer from '../componentes/Footer';

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

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    console.log("Parámetros recibidos:", params);
    console.log("Product param:", productParam);

    let product: Product | null = null;

    try {
        if (productParam) {
            product = JSON.parse(productParam);
            console.log("Producto parseado:", product);
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
            console.log('La pantalla recibió el foco');
            checkLoginStatus();
        }, [])
    );

    const handlePurchase = async () => {
        console.log("Botón de compra presionado");  // Añadir para depuración

        // Verificar si el usuario tiene la sesión iniciada
        const token = await AsyncStorage.getItem('userToken');

        if (token) {
            // Usuario con sesión iniciada
            // Mostrar mensaje de compra exitosa
            Alert.alert(
                "¡Compra Exitosa, ahora puedes dar de alta tu dispositivo!",
                `Has comprado ${product?.name} correctamente.`,
                [
                    {
                        text: "OK",
                        onPress: () => {
                            console.log("Redirigiendo a registro de dispositivo");
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
                            console.log("Redirigiendo a pantalla de login");
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
            <SafeAreaView style={styles.screen}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.cardContainer}>
                        <Header />
                        <Animated.View
                            style={[
                                styles.errorContainer,
                                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                            ]}
                        >
                            <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#FC8181" />
                            <Text style={styles.errorTitle}>Producto no encontrado</Text>
                            <Text style={styles.errorText}>
                                El producto solicitado no está disponible o ha sido eliminado.
                            </Text>
                            <TouchableOpacity
                                style={styles.backToProductsButton}
                                onPress={() => router.push('/CatalogoProductosScreen')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.backToProductsText}>Ver catálogo de productos</Text>
                            </TouchableOpacity>
                        </Animated.View>
                        <Footer />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // El renderizado principal
    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <Header title="Detalle de Producto" />

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/CatalogoProductosScreen" />
                    </View>

                    <Animated.View
                        style={[
                            styles.productSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: product.image }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{product.category}</Text>
                            </View>
                        </View>

                        <View style={styles.productInfoContainer}>
                            <Text style={styles.productTitle}>{product.name}</Text>

                            <View style={styles.priceContainer}>
                                <Text style={styles.priceLabel}>Precio:</Text>
                                <Text style={styles.priceValue}>${product.price.toFixed(2)}</Text>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.descriptionLabel}>Descripción</Text>
                            <Text style={styles.descriptionText}>
                                {product.description || 'Sin descripción disponible.'}
                            </Text>

                            {/* Características del producto */}
                            <View style={styles.featuresContainer}>
                                <View style={styles.featureItem}>
                                    <View style={styles.featureIconContainer}>
                                        <MaterialCommunityIcons name="shield-check" size={20} color="#3182CE" />
                                    </View>
                                    <Text style={styles.featureText}>Garantía de 12 meses</Text>
                                </View>

                                <View style={styles.featureItem}>
                                    <View style={styles.featureIconContainer}>
                                        <MaterialCommunityIcons name="truck-delivery" size={20} color="#3182CE" />
                                    </View>
                                    <Text style={styles.featureText}>Envío gratuito</Text>
                                </View>
                            </View>

                            {/* Información de instalación */}
                            <Animated.View
                                style={[
                                    styles.installInfoContainer,
                                    { transform: [{ translateY: slideAnim }] }
                                ]}
                            >
                                <View style={styles.installInfoIconContainer}>
                                    <Ionicons name="information-circle" size={24} color="#3182CE" />
                                </View>
                                <Text style={styles.installInfoText}>
                                    Después de la compra, podrás registrar este dispositivo en tu cuenta.
                                </Text>
                            </Animated.View>

                            {/* Botón de Compra mejorado */}
                            <TouchableOpacity
                                style={styles.purchaseButtonContainer}
                                onPress={handlePurchase}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={isLoggedIn ? ['#3182CE', '#2C5282'] : ['#ED8936', '#DD6B20']}
                                    style={styles.purchaseButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <FontAwesome5
                                        name={isLoggedIn ? "shopping-cart" : "sign-in-alt"}
                                        size={16}
                                        color="#FFFFFF"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.purchaseButtonText}>
                                        {isLoggedIn ? "Comprar Ahora" : "Iniciar sesión para comprar"}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {!isLoggedIn && (
                                <Text style={styles.loginNote}>
                                    Debes iniciar sesión para realizar una compra
                                </Text>
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
    scrollContent: {
        flexGrow: 1,
    },
    cardContainer: {
        padding: 20,
    },
    buttonBackContainer: {
        marginBottom: 15,
        marginTop: 5,
    },
    productSection: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        shadowColor: "rgba(0,0,0,0.2)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        marginBottom: 25,
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
    },
    image: {
        width: '100%',
        height: 260,
    },
    categoryBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(49, 130, 206, 0.85)',
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
        padding: 24,
    },
    productTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1A365D',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    priceLabel: {
        fontSize: 18,
        color: '#4A5568',
        marginRight: 8,
    },
    priceValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#3182CE',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: 20,
    },
    descriptionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 16,
        color: '#4A5568',
        lineHeight: 24,
        marginBottom: 20,
    },
    featuresContainer: {
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    featureIconContainer: {
        backgroundColor: '#EBF8FF',
        padding: 8,
        borderRadius: 8,
        marginRight: 12,
    },
    featureText: {
        fontSize: 14,
        color: '#2D3748',
    },
    installInfoContainer: {
        backgroundColor: '#EBF8FF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    installInfoIconContainer: {
        marginRight: 12,
    },
    installInfoText: {
        fontSize: 14,
        color: '#2D3748',
        flex: 1,
        lineHeight: 20,
    },
    purchaseButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "rgba(0,0,0,0.3)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
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
        color: '#718096',
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Estilos para la pantalla de error
    errorContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        shadowColor: "rgba(0,0,0,0.2)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3748',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    backToProductsButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    backToProductsText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    }
});