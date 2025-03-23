import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from './Header';
import Footer from './Footer';

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

    // Cargar items del carrito cuando la pantalla se monta
    useEffect(() => {
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
        const updatedCart = cartItems.filter(item => item.id !== productId);
        setCartItems(updatedCart);
        saveCartItems(updatedCart);
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

        // Aquí iría la lógica de procesamiento de pago
        Alert.alert(
            'Compra exitosa',
            'Gracias por su compra. Su pedido ha sido procesado correctamente.',
            [
                {
                    text: 'OK',
                    onPress: async () => {
                        // Limpiar el carrito
                        await AsyncStorage.removeItem('userCart');
                        setCartItems([]);
                        // Redirigir al inicio
                        router.push('/');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Mi Carrito" />

                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>Mi Carrito de Compras</Text>

                        {isLoading ? (
                            <Text style={styles.emptyText}>Cargando...</Text>
                        ) : cartItems.length === 0 ? (
                            <View style={styles.emptyCartContainer}>
                                <Ionicons name="cart-outline" size={64} color="#cccccc" />
                                <Text style={styles.emptyText}>Tu carrito está vacío</Text>
                                <TouchableOpacity
                                    style={styles.continueShoppingButton}
                                    onPress={() => router.push('/CatalogoProductosScreen')}
                                >
                                    <Text style={styles.continueShoppingText}>Ir a la tienda</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {cartItems.map((item) => (
                                    <View key={item.id} style={styles.cartItemContainer}>
                                        <Image source={{ uri: item.image }} style={styles.itemImage} />
                                        <View style={styles.itemDetails}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                                            <View style={styles.quantityContainer}>
                                                <TouchableOpacity
                                                    style={styles.quantityButton}
                                                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <Text style={styles.quantityButtonText}>-</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.quantityText}>{item.quantity}</Text>
                                                <TouchableOpacity
                                                    style={styles.quantityButton}
                                                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <Text style={styles.quantityButtonText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => removeItem(item.id)}
                                        >
                                            <Ionicons name="trash-outline" size={24} color="#dc3545" />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                <View style={styles.summaryContainer}>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryText}>Subtotal:</Text>
                                        <Text style={styles.summaryValue}>${calculateTotal().toFixed(2)}</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.checkoutButton}
                                        onPress={handleCheckout}
                                    >
                                        <Text style={styles.checkoutButtonText}>Realizar compra</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

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
    contentContainer: {
        flex: 1,
        paddingVertical: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginBottom: 20,
        textAlign: 'center',
    },
    emptyCartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    continueShoppingButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 20,
    },
    continueShoppingText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cartItemContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 15,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    itemPrice: {
        fontSize: 15,
        color: '#28a745',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        backgroundColor: '#e9ecef',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    quantityText: {
        marginHorizontal: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    removeButton: {
        padding: 8,
    },
    summaryContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    summaryText: {
        fontSize: 16,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    checkoutButton: {
        backgroundColor: '#28a745',
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    checkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});