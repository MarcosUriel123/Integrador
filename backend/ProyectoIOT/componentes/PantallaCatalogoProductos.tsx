import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Alert
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import Header from './Header';
import Footer from './Footer';
// Importación corregida - asumiendo que CartContext está en la raíz del proyecto
import { useCart } from './CartContext';
// Importación faltante de ProductCard
import ProductCard from './ProductCard ';

// Tipo actualizado para que coincida con lo que espera ProductCard
type Product = {
    id: string; // Cambiado de _id a id
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
};

// Tipo para la respuesta de la API
type ProductResponse = {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
};

export default function PantallaCatalogoProductos() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get<ProductResponse[]>('http://192.168.8.6:8082/api/products/get');
                if (response.status === 200) {
                    // Mapear la respuesta para convertir _id a id
                    const formattedProducts = response.data.map(product => ({
                        id: product._id, // Convertir _id a id
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        category: product.category,
                        image: product.image
                    }));
                    setProducts(formattedProducts);
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Error al cargar los productos');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleProductPress = (product: Product) => {
        // Navegar a la pantalla de detalles y pasar los datos del producto
        router.push({
            pathname: '/productoDetail',
            params: { product: JSON.stringify(product) },
        });
    };

    const renderProductItem = ({ item }: { item: Product }) => (
        <ProductCard
            product={item}
            onPress={() => handleProductPress(item)}
            onAddToCart={(product) => {
                addToCart(product);
                Alert.alert('Producto añadido', `${product.name} se añadió al carrito`);
            }}
        />
    );

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header title="Catálogo de Productos" />

                    {loading ? (
                        <View style={styles.contentContainer}>
                            <ActivityIndicator size="large" color="#007bff" />
                            <Text style={styles.loadingText}>Cargando productos...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.contentContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : (
                        <View style={styles.contentContainer}>
                            <Text style={styles.title}>Catálogo de Productos</Text>
                            <FlatList
                                data={products}
                                renderItem={renderProductItem}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                                contentContainerStyle={styles.listContent}
                            />
                        </View>
                    )}

                    <Footer showContactInfo={true} showTerms={true} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Los estilos se mantienen iguales...
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        minHeight: 300, // Asegura espacio suficiente para mostrar carga/error
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginVertical: 15,
        textAlign: 'center',
    },
    productCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
    },
    productImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 10,
    },
    productName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 5,
    },
    productDescription: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 8,
    },
    detailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#28a745',
    },
    categoryText: {
        fontSize: 14,
        color: '#fff',
        backgroundColor: '#007bff',
        borderRadius: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#6c757d',
    },
    errorText: {
        color: '#dc3545',
        fontSize: 18,
        textAlign: 'center',
    },
    listContent: {
        width: '100%',
    },
});
