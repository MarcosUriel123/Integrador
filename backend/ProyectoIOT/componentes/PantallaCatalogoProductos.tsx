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
import { Ionicons } from '@expo/vector-icons'; // Asegúrate de tener esta dependencia

// Tipos existentes...
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
    
    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get<ProductResponse[]>('http://192.168.8.3:8082/api/products/get');
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
                    
                    // Calcular el número total de páginas
                    setTotalPages(Math.ceil(formattedProducts.length / productsPerPage));
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Error al cargar los productos');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [productsPerPage]);

    const handleProductPress = (product: Product) => {
        // Navegar a la pantalla de detalles y pasar los datos del producto
        router.push({
            pathname: '/productoDetail',
            params: { product: JSON.stringify(product) },
        });
    };

    // Función para ir a la página anterior
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            // Desplazar hacia arriba al cambiar de página
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }
        }
    };

    // Función para ir a la página siguiente
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            // Desplazar hacia arriba al cambiar de página
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }
        }
    };

    // Obtener los productos para la página actual
    const getCurrentPageProducts = () => {
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        return products.slice(indexOfFirstProduct, indexOfLastProduct);
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

    // Referencia para el ScrollView
    const scrollViewRef = React.useRef<ScrollView>(null);

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView 
                ref={scrollViewRef}
                style={{ flex: 1 }}
            >
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
                            
                            {products.length === 0 ? (
                                <Text style={styles.emptyText}>No hay productos disponibles</Text>
                            ) : (
                                <>
                                    <FlatList
                                        data={getCurrentPageProducts()}
                                        renderItem={renderProductItem}
                                        keyExtractor={(item) => item.id}
                                        scrollEnabled={false}
                                        contentContainerStyle={styles.listContent}
                                    />
                                    
                                    {/* Controles de paginación */}
                                    <View style={styles.paginationContainer}>
                                        <TouchableOpacity 
                                            style={[
                                                styles.paginationButton, 
                                                currentPage === 1 && styles.paginationButtonDisabled
                                            ]}
                                            onPress={goToPreviousPage}
                                            disabled={currentPage === 1}
                                        >
                                            <Ionicons name="chevron-back" size={22} color={currentPage === 1 ? "#999" : "#007bff"} />
                                            <Text style={[
                                                styles.paginationButtonText,
                                                currentPage === 1 && styles.paginationButtonTextDisabled
                                            ]}>Anterior</Text>
                                        </TouchableOpacity>
                                        
                                        <Text style={styles.paginationInfo}>
                                            Página {currentPage} de {totalPages}
                                        </Text>
                                        
                                        <TouchableOpacity 
                                            style={[
                                                styles.paginationButton, 
                                                currentPage === totalPages && styles.paginationButtonDisabled
                                            ]}
                                            onPress={goToNextPage}
                                            disabled={currentPage === totalPages}
                                        >
                                            <Text style={[
                                                styles.paginationButtonText,
                                                currentPage === totalPages && styles.paginationButtonTextDisabled
                                            ]}>Siguiente</Text>
                                            <Ionicons name="chevron-forward" size={22} color={currentPage === totalPages ? "#999" : "#007bff"} />
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    <Footer showContactInfo={true} showTerms={true} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos existentes más los nuevos...
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
        minHeight: 300,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginVertical: 15,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 20,
    },
    // Estilos existentes...
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
    // Nuevos estilos para paginación
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
        paddingHorizontal: 10,
    },
    paginationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0f8ff',
    },
    paginationButtonDisabled: {
        backgroundColor: '#f5f5f5',
    },
    paginationButtonText: {
        color: '#007bff',
        fontWeight: '600',
        fontSize: 14,
    },
    paginationButtonTextDisabled: {
        color: '#999',
    },
    paginationInfo: {
        fontSize: 14,
        color: '#555',
    },
    // Mantén el resto de estilos aquí...
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
});
