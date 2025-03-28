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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Header from './Header';
import Footer from './Footer';
import { LinearGradient } from 'expo-linear-gradient';

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
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Mi Carrito" />

                    {/* Sección Principal del Carrito */}
                    <Animated.View
                        style={[
                            styles.cartSection,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Mi Carrito de Compras</Text>

                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <MaterialCommunityIcons name="cart-outline" size={36} color="#3182CE" />
                                <Text style={styles.loadingText}>Cargando tu carrito...</Text>
                            </View>
                        ) : cartItems.length === 0 ? (
                            <View style={styles.emptyCartContainer}>
                                <View style={styles.emptyCartIconContainer}>
                                    <MaterialCommunityIcons name="cart-off" size={64} color="#3182CE" />
                                </View>
                                <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
                                <Text style={styles.emptyText}>
                                    Añade productos de nuestra tienda para comenzar tu compra
                                </Text>
                                <TouchableOpacity
                                    style={styles.continueShoppingButton}
                                    onPress={() => router.push('/CatalogoProductosScreen')}
                                    activeOpacity={0.7}
                                >
                                    <FontAwesome5 name="shopping-bag" size={16} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.continueShoppingText}>Explorar productos</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {cartItems.map((item, index) => (
                                    <Animated.View
                                        key={item.id}
                                        style={[
                                            styles.cartItemContainer,
                                            {
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
                                            style={styles.itemImage}
                                        />
                                        <View style={styles.itemDetails}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                                            <View style={styles.quantityContainer}>
                                                <TouchableOpacity
                                                    style={styles.quantityButton}
                                                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.quantityButtonText}>-</Text>
                                                </TouchableOpacity>
                                                <View style={styles.quantityTextContainer}>
                                                    <Text style={styles.quantityText}>{item.quantity}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.quantityButton}
                                                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.quantityButtonText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={styles.itemActions}>
                                            <TouchableOpacity
                                                style={styles.removeButton}
                                                onPress={() => removeItem(item.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="trash-outline" size={22} color="#FC8181" />
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                ))}

                                <View style={styles.summaryContainer}>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryText}>Subtotal:</Text>
                                        <Text style={styles.summaryValue}>${calculateTotal().toFixed(2)}</Text>
                                    </View>

                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryText}>Envío:</Text>
                                        <Text style={styles.summaryValue}>$0.00</Text>
                                    </View>

                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalText}>Total:</Text>
                                        <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.checkoutButton}
                                        onPress={handleCheckout}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#3182CE', '#2C5282']}
                                            style={styles.checkoutButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.checkoutButtonText}>Realizar compra</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
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
    cartSection: {
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
    emptyCartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        paddingHorizontal: 20,
    },
    emptyCartIconContainer: {
        backgroundColor: '#EBF8FF',
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
        color: '#2D3748',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#4A5568',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    continueShoppingButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    continueShoppingText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    cartItemContainer: {
        flexDirection: 'row',
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: "rgba(0,0,0,0.06)",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    itemImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: '#EDF2F7',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
        color: '#2D3748',
        letterSpacing: 0.3,
    },
    itemPrice: {
        fontSize: 16,
        color: '#3182CE',
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        backgroundColor: '#EBF8FF',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#BEE3F8',
    },
    quantityButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3182CE',
    },
    quantityTextContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    quantityText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
    },
    itemActions: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButton: {
        padding: 10,
        backgroundColor: '#FFF5F5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FED7D7',
    },
    summaryContainer: {
        marginTop: 24,
        padding: 20,
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
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
        borderTopColor: '#E2E8F0',
        marginTop: 6,
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4A5568',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3182CE',
    },
    checkoutButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#2C5282",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
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