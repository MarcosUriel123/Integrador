import React, { useEffect, useState, useCallback } from 'react';
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
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    // Reemplazamos el hook useEffect con useFocusEffect para detectar cuando la pantalla recibe el foco
    useFocusEffect(
        useCallback(() => {
            console.log('La pantalla recibió el foco');
            checkLoginStatus();
        }, [])
    );

    // También mantemos un useEffect para la carga inicial (opcional)
    useEffect(() => {
        checkLoginStatus();
    }, []);

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

    // El resto del componente se mantiene igual...

    // El renderizado condicional para cuando no hay producto
    if (!product) {
        return (
            <SafeAreaView style={styles.screen}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.cardContainer}>
                        <View style={styles.topBar}>
                            <Text style={styles.logo}>Segurix</Text>
                        </View>
                        <View style={styles.contentContainer}>
                            <Text style={styles.errorText}>Producto no encontrado</Text>
                        </View>
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
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                    </View>
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>Detalle de {product.name}</Text>
                        <Image source={{ uri: product.image }} style={styles.image} />
                        <View style={styles.detailsRow}>
                            <Text style={styles.label}>Precio:</Text>
                            <Text style={styles.value}>${product.price}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                            <Text style={styles.label}>Categoría:</Text>
                            <Text style={styles.value}>{product.category}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                            <Text style={styles.label}>Descripción:</Text>
                            <Text style={styles.value}>
                                {product.description || 'Sin descripción disponible.'}
                            </Text>
                        </View>

                        {/* Botón de Compra mejorado con estilos ajustados */}
                        <TouchableOpacity
                            style={[
                                styles.purchaseButton,
                                !isLoggedIn && styles.purchaseButtonWithLogin
                            ]}
                            onPress={handlePurchase}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.purchaseButtonText}>
                                {isLoggedIn ? "Comprar Ahora" : "Iniciar sesión para comprar"}
                            </Text>
                        </TouchableOpacity>

                        {!isLoggedIn && (
                            <Text style={styles.loginNote}>
                                Debes iniciar sesión para realizar una compra
                            </Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Los estilos se mantienen iguales...
const styles = StyleSheet.create({
    // Los estilos no cambian
    screen: {
        flex: 1,
        backgroundColor: '#CFE2FF',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
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
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: 20,
        paddingBottom: 10,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E1E1E',
    },
    contentContainer: {
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginBottom: 15,
        textAlign: 'center',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 20,
    },
    detailsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E1E1E',
    },
    value: {
        fontSize: 18,
        color: '#2C2C2C',
        maxWidth: '60%',
        textAlign: 'right',
    },
    // Estilos mejorados para el botón de compra
    purchaseButton: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
        width: '100%',  // Asegura que el botón ocupe todo el ancho disponible
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,  // Altura fija para hacerlo más fácil de presionar
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    purchaseButtonWithLogin: {
        backgroundColor: '#FFA500', // Color naranja para indicar que se requiere login
    },
    purchaseButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loginNote: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});