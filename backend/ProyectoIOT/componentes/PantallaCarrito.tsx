import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Animated,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../hooks/useAppTheme'; // Importar el hook de tema

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

type CartProduct = {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
};

export default function PantallaCarrito() {
    const router = useRouter();
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Obtener colores y estilos del tema
    const [cartItems, setCartItems] = useState<CartProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // Cargar items del carrito cuando la pantalla se monta
    useEffect(() => {
        // Animación de entrada
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
            })
        ]).start();

        loadCartItems();
    }, []);

    const loadCartItems = async () => {
        try {
            setIsLoading(true);
            const cartData = await AsyncStorage.getItem('userCart');
            if (cartData) {
                setCartItems(JSON.parse(cartData));
            }
        } catch (error) {
            console.error('Error al cargar el carrito:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveCartItems = async (items: CartProduct[]) => {
        try {
            await AsyncStorage.setItem('userCart', JSON.stringify(items));
        } catch (error) {
            console.error('Error al guardar el carrito:', error);
        }
    };

    const removeItem = (productId: string) => {
        Alert.alert(
            "Eliminar producto",
            "¿Estás seguro de que deseas eliminar este producto del carrito?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Eliminar",
                    onPress: () => {
                        const updatedCart = cartItems.filter(item => item.id !== productId);
                        setCartItems(updatedCart);
                        saveCartItems(updatedCart);
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        const updatedCart = cartItems.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
        );

        setCartItems(updatedCart);
        saveCartItems(updatedCart);
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    // Obtener colores del gradiente para el botón según el tema
    const getButtonGradientColors = () => {
        return isDarkMode
            ? [colors.primary, '#1e3a8a'] // Primario a azul oscuro para tema oscuro
            : [colors.primary, '#2C5282']; // Primario a azul medio para tema claro
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            Alert.alert('Carrito vacío', 'Agrega productos antes de realizar la compra');
            return;
        }

        // Verificar si el usuario ha iniciado sesión
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
            Alert.alert(
                'Iniciar sesión requerido',
                'Para completar la compra, necesitas iniciar sesión primero.',
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel'
                    },
                    {
                        text: 'Iniciar sesión',
                        onPress: () => router.push('/Login1')
                    }
                ]
            );
            return;
        }

        // Navegar a la pantalla de checkout
        router.push('/checkout' as any);
    };

    return (
        <SafeAreaView style={baseStyles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={baseStyles.contentContainer}>
                    {/* Sección Principal del Carrito */}
                    <Animated.View
                        style={[
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Text style={[localStyles.sectionTitle, {
                            color: colors.text,
                            borderBottomColor: colors.primary
                        }]}>Mi Carrito de Compras</Text>

                        {isLoading ? (
                            <View style={[localStyles.loadingContainer, {
                                backgroundColor: colors.card,
                                borderColor: colors.border
                            }]}>
                                <MaterialCommunityIcons name="cart-outline" size={36} color={colors.primary} />
                                <Text style={[localStyles.loadingText, { color: colors.secondaryText }]}>
                                    Cargando tu carrito...
                                </Text>
                            </View>
                        ) : cartItems.length === 0 ? (
                            <View style={[localStyles.emptyCartContainer, {
                                backgroundColor: colors.card,
                                borderColor: colors.border
                            }]}>
                                <View style={[localStyles.emptyCartIconContainer, {
                                    backgroundColor: colors.primaryLight
                                }]}>
                                    <MaterialCommunityIcons name="cart-off" size={64} color={colors.primary} />
                                </View>
                                <Text style={[localStyles.emptyTitle, { color: colors.text }]}>
                                    Tu carrito está vacío
                                </Text>
                                <Text style={[localStyles.emptyText, { color: colors.secondaryText }]}>
                                    Añade productos de nuestra tienda para comenzar tu compra
                                </Text>
                                <TouchableOpacity
                                    style={[
                                        localStyles.continueShoppingButtonContainer,
                                        {
                                            shadowOpacity: isDarkMode ? 0.2 : 0.15,
                                            elevation: isDarkMode ? 3 : 2
                                        }
                                    ]}
                                    onPress={() => router.push('/CatalogoProductosScreen')}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={getButtonGradientColors()}
                                        style={localStyles.continueShoppingButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <FontAwesome5 name="shopping-bag" size={16} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={localStyles.continueShoppingText}>Explorar productos</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {cartItems.map((item, index) => (
                                    <Animated.View
                                        key={item.id}
                                        style={[
                                            localStyles.cartItemContainer,
                                            {
                                                backgroundColor: colors.card,
                                                borderColor: colors.border,
                                                shadowOpacity: isDarkMode ? 0.2 : 0.1,
                                                elevation: isDarkMode ? 2 : 1,
                                                opacity: fadeAnim,
                                                transform: [{
                                                    translateY: Animated.multiply(fadeAnim, new Animated.Value(-10)).interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [20, 0]
                                                    })
                                                }]
                                            }
                                        ]}
                                    >
                                        <Image
                                            source={{ uri: item.image }}
                                            style={localStyles.itemImage}
                                        />
                                        <View style={localStyles.itemDetails}>
                                            <Text style={[localStyles.itemName, { color: colors.text }]}>
                                                {item.name}
                                            </Text>
                                            <Text style={[localStyles.itemPrice, { color: colors.primary }]}>
                                                ${item.price.toFixed(2)}
                                            </Text>
                                            <View style={localStyles.quantityContainer}>
                                                <TouchableOpacity
                                                    style={[localStyles.quantityButton, {
                                                        backgroundColor: colors.primaryLight,
                                                        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                                    }]}
                                                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[localStyles.quantityButtonText, { color: colors.primary }]}>-</Text>
                                                </TouchableOpacity>
                                                <View style={[localStyles.quantityTextContainer, {
                                                    backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                                                    borderColor: colors.border
                                                }]}>
                                                    <Text style={[localStyles.quantityText, { color: colors.text }]}>
                                                        {item.quantity}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={[localStyles.quantityButton, {
                                                        backgroundColor: colors.primaryLight,
                                                        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                                    }]}
                                                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[localStyles.quantityButtonText, { color: colors.primary }]}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={localStyles.itemActions}>
                                            <TouchableOpacity
                                                style={[localStyles.removeButton, {
                                                    backgroundColor: isDarkMode ? 'rgba(254, 178, 178, 0.1)' : '#FFF5F5',
                                                    borderColor: isDarkMode ? 'rgba(254, 178, 178, 0.3)' : '#FED7D7'
                                                }]}
                                                onPress={() => removeItem(item.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="trash-outline" size={22} color={colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                ))}

                                <View style={[localStyles.summaryContainer, {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border
                                }]}>
                                    <View style={localStyles.summaryRow}>
                                        <Text style={[localStyles.summaryText, { color: colors.secondaryText }]}>
                                            Subtotal:
                                        </Text>
                                        <Text style={[localStyles.summaryValue, { color: colors.text }]}>
                                            ${calculateTotal().toFixed(2)}
                                        </Text>
                                    </View>

                                    <View style={localStyles.summaryRow}>
                                        <Text style={[localStyles.summaryText, { color: colors.secondaryText }]}>
                                            Envío:
                                        </Text>
                                        <Text style={[localStyles.summaryValue, { color: colors.text }]}>
                                            $0.00
                                        </Text>
                                    </View>

                                    <View style={[localStyles.totalRow, { borderTopColor: colors.border }]}>
                                        <Text style={[localStyles.totalText, { color: colors.text }]}>
                                            Total:
                                        </Text>
                                        <Text style={[localStyles.totalValue, { color: colors.primary }]}>
                                            ${calculateTotal().toFixed(2)}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            localStyles.checkoutButtonContainer,
                                            {
                                                shadowOpacity: isDarkMode ? 0.2 : 0.15,
                                                elevation: isDarkMode ? 3 : 2
                                            }
                                        ]}
                                        onPress={handleCheckout}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={getButtonGradientColors()}
                                            style={localStyles.checkoutButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={localStyles.checkoutButtonText}>Realizar compra</Text>
                                            <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
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
    emptyCartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        borderRadius: 16,
        paddingHorizontal: 20,
        borderWidth: 1,
    },
    emptyCartIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    continueShoppingButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
    },
    continueShoppingButton: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueShoppingText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    cartItemContainer: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
    },
    itemImage: {
        width: 70,
        height: 70,
        borderRadius: 10,
        marginRight: 16,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    quantityButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    quantityTextContainer: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    quantityText: {
        fontSize: 14,
        fontWeight: '600',
    },
    itemActions: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButton: {
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    summaryContainer: {
        marginTop: 24,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        marginTop: 6,
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 16,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    checkoutButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
    },
    checkoutButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    checkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});