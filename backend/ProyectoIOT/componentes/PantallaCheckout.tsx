import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axios from 'axios';

import Header from './Header';
import Footer from './Footer';
import { useCart } from './CartContext';

type CartProduct = {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
};

export default function PantallaCheckout() {
    const { resetCart } = useCart();
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    // Estado para la información de pago
    const [paymentInfo, setPaymentInfo] = useState({
        name: '',
        cardNumber: '',
        expirationDate: '',
        cvv: '',
    });

    // Cargar items del carrito y correo del usuario al montar la pantalla
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);

                // Cargar carrito
                const cartData = await AsyncStorage.getItem('userCart');
                if (cartData) {
                    setCartItems(JSON.parse(cartData));
                }

                // Cargar email del usuario (asumiendo que se almacena al iniciar sesión)
                const email = await AsyncStorage.getItem('userEmail');
                if (email) {
                    setUserEmail(email);
                } else {
                    // Si no existe, intentar obtenerlo del token de usuario
                    const userId = await AsyncStorage.getItem('userId');
                    if (userId) {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            const response = await axios.get(`http://192.168.8.6:8082/api/users/${userId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const userData = response.data as { email?: string };
                            if (userData && userData.email) {
                                setUserEmail(userData.email);
                                await AsyncStorage.setItem('userEmail', userData.email);
                            }
                        } catch (error) {
                            console.error('Error al obtener datos del usuario:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error al cargar datos:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Calcular totales
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Manejar cambios en los inputs
    const handleInputChange = (field: string, value: string) => {
        setPaymentInfo({
            ...paymentInfo,
            [field]: value
        });
    };

    // Validar formato de tarjeta
    const validateCardNumber = (number: string) => {
        return /^\d{16}$/.test(number.replace(/\s/g, ''));
    };

    // Validar formato de fecha de expiración
    const validateExpirationDate = (date: string) => {
        return /^(0[1-9]|1[0-2])\/\d{2}$/.test(date);
    };

    // Validar CVV
    const validateCVV = (cvv: string) => {
        return /^\d{3,4}$/.test(cvv);
    };

    // Reemplaza tu función handlePayment actual con esta versión corregida:

const handlePayment = async () => {
    // Validaciones básicas de campos 
    if (!paymentInfo.name || !paymentInfo.cardNumber || !paymentInfo.expirationDate || !paymentInfo.cvv) {
        Alert.alert('Error', 'Todos los campos son obligatorios');
        return;
    }

    // Validación de formato de tarjeta
    if (paymentInfo.cardNumber.replace(/\s/g, '').length !== 16) {
        Alert.alert('Error', 'El número de tarjeta debe tener 16 dígitos');
        return;
    }

    // Validación de fecha de expiración
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentInfo.expirationDate)) {
        Alert.alert('Error', 'El formato de fecha debe ser MM/YY');
        return;
    }

    // Validación de CVV
    if (!/^\d{3,4}$/.test(paymentInfo.cvv)) {
        Alert.alert('Error', 'El CVV debe tener 3 o 4 dígitos');
        return;
    }

    // Verificar que hay productos en el carrito
    if (cartItems.length === 0) {
        Alert.alert('Error', 'No hay productos en el carrito');
        return;
    }

    // Verificar que hay un email
    if (!userEmail) {
        Alert.alert('Error', 'No se encontró un correo electrónico');
        return;
    }

    // Mostrar loading
    setIsSending(true);

    try {
        // IMPORTANTE: NO mostramos la alerta de procesamiento aquí porque
        // bloqueará la ejecución hasta que el usuario la cierre
        
        console.log('Iniciando proceso de pago');
        console.log('Enviando correo a:', userEmail);
        console.log('Productos:', cartItems.length);
        
        // Enviar solicitud directamente - usamos la IP local
        const response = await fetch('http://192.168.8.5:8082/api/purchases/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                cart: cartItems
            })
        });
        
        const data = await response.json();
        console.log('Respuesta:', response.status, data);
        
        // Verificar respuesta
        if (response.ok) {
            console.log('Proceso completado exitosamente');
            
            // Limpiar carrito
            await resetCart();
            await AsyncStorage.removeItem('userCart');
            
            // Mostrar mensaje de éxito
            Alert.alert(
                '¡Compra realizada con éxito!',
                `Se ha enviado un correo de confirmación a ${userEmail}`,
                [{ text: 'OK', onPress: () => router.push('/') }]
            );
        } else {
            throw new Error(`Error del servidor: ${data.message || response.status}`);
        }
    } catch (error) {
        console.error('Error en el proceso de pago:', error);
        
        // Mensaje de error simplificado
        Alert.alert(
            'Error en la compra',
            'No se pudo completar la compra. Por favor, intenta nuevamente más tarde.',
            [{ text: 'Entendido' }]
        );
    } finally {
        setIsSending(false);
    }
};

    if (isLoading) {
        return (
            <SafeAreaView style={styles.screen}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loadingText}>Cargando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (cartItems.length === 0) {
        return (
            <SafeAreaView style={styles.screen}>
                <ScrollView>
                    <View style={styles.cardContainer}>
                        <Header title="Checkout" />
                        <View style={styles.contentContainer}>
                            <Text style={styles.title}>No hay productos en el carrito</Text>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.push('/CatalogoProductosScreen')}
                            >
                                <Text style={styles.backButtonText}>Ir a la tienda</Text>
                            </TouchableOpacity>
                        </View>
                        <Footer />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView>
                <View style={styles.cardContainer}>
                    <Header title="Checkout" />

                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>Finalizar Compra</Text>

                        {/* Resumen del pedido */}
                        <View style={styles.summaryContainer}>
                            <Text style={styles.sectionTitle}>Resumen del Pedido</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Productos:</Text>
                                <Text style={styles.summaryValue}>{totalItems}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total:</Text>
                                <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* Formulario de pago */}
                        <View style={styles.paymentContainer}>
                            <Text style={styles.sectionTitle}>Información de Pago</Text>

                            <Text style={styles.inputLabel}>Nombre en la tarjeta:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre como aparece en la tarjeta"
                                value={paymentInfo.name}
                                onChangeText={(value) => handleInputChange('name', value)}
                            />

                            <Text style={styles.inputLabel}>Número de tarjeta:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1234 5678 9012 3456"
                                value={paymentInfo.cardNumber}
                                onChangeText={(value) => handleInputChange('cardNumber', value)}
                                keyboardType="numeric"
                                maxLength={19}
                            />

                            <View style={styles.rowContainer}>
                                <View style={styles.halfWidth}>
                                    <Text style={styles.inputLabel}>Fecha de expiración:</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="MM/AA"
                                        value={paymentInfo.expirationDate}
                                        onChangeText={(value) => handleInputChange('expirationDate', value)}
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />
                                </View>
                                <View style={styles.halfWidth}>
                                    <Text style={styles.inputLabel}>CVV:</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="123"
                                        value={paymentInfo.cvv}
                                        onChangeText={(value) => handleInputChange('cvv', value)}
                                        keyboardType="numeric"
                                        maxLength={4}
                                        secureTextEntry
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Email de confirmación */}
                        <View style={styles.emailContainer}>
                            <Text style={styles.emailLabel}>
                                La confirmación de tu compra será enviada a:
                            </Text>
                            <Text style={styles.emailValue}>{userEmail || 'No disponible'}</Text>
                        </View>

                        {/* Botón de confirmar pago */}
                        <TouchableOpacity
                            style={[styles.confirmButton, isSending && styles.disabledButton]}
                            onPress={handlePayment}
                            disabled={isSending}
                            activeOpacity={0.7}
                        >
                            {isSending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmButtonText}>CONFIRMAR PAGO</Text>
                            )}
                        </TouchableOpacity>

                        {/* Botón para volver al carrito */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.push('/carrito')}
                        >
                            <Text style={styles.backButtonText}>Volver al Carrito</Text>
                        </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#007bff',
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    summaryContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#555',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfWidth: {
        width: '48%',
    },
    emailContainer: {
        marginBottom: 20,
        backgroundColor: '#e9f5ff',
        padding: 15,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
    },
    emailLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
    },
    emailValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    confirmButton: {
        backgroundColor: '#28a745',
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 15,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#6c757d',
        opacity: 0.7,
    },
    backButton: {
        backgroundColor: '#6c757d',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
    }
});