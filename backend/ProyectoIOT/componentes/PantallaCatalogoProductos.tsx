import React, { useEffect, useState, useRef } from 'react';
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
    Alert,
    Animated,
    Dimensions
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Header from './Header';
import Footer from './Footer';
import { useCart } from './CartContext';
import ProductCard from './ProductCard ';
import BotonVolver from '../componentes/BotonVolver';

// Tipos existentes...
type Product = {
    id: string;
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

// Obtener dimensiones de pantalla
const { width } = Dimensions.get('window');

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

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

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

        const fetchProducts = async () => {
            try {
                const response = await axios.get<ProductResponse[]>('http://192.168.1.133:8082/api/products/get');
                if (response.status === 200) {
                    // Mapear la respuesta para convertir _id a id
                    const formattedProducts = response.data.map(product => ({
                        id: product._id,
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

    // Modificar la función renderProductItem para manejar el ancho de las cards
    const renderProductItem = ({ item }: { item: Product }) => (
        <Animated.View
            style={[
                styles.productCardContainer,
                { opacity: fadeAnim }
            ]}
        >
            <ProductCard
                product={item}
                onPress={() => handleProductPress(item)}
                onAddToCart={(product) => {
                    addToCart(product);
                    Alert.alert('Producto añadido', `${product.name} se añadió al carrito`);
                }}
            />
        </Animated.View>
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

                    <View style={styles.buttonBackContainer}>
                        <BotonVolver destino="/" />
                    </View>

                    <Animated.View
                        style={[
                            styles.contentContainer,
                            { transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3182CE" />
                                <Text style={styles.loadingText}>Cargando productos...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : (
                            <View style={styles.productsSection}>
                                <Text style={styles.sectionTitle}>Catálogo de Productos</Text>

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
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="chevron-back" size={22} color={currentPage === 1 ? "#A0AEC0" : "#3182CE"} />
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
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    styles.paginationButtonText,
                                                    currentPage === totalPages && styles.paginationButtonTextDisabled
                                                ]}>Siguiente</Text>
                                                <Ionicons name="chevron-forward" size={22} color={currentPage === totalPages ? "#A0AEC0" : "#3182CE"} />
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}
                    </Animated.View>

                    <Footer showContactInfo={true} showTerms={true} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f0f4f8', // Mismo fondo que PantallaPrincipal
    },
    cardContainer: {
        padding: 20,
    },
    buttonBackContainer: {
        marginBottom: 15,
        marginTop: 5,
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
    },
    productsSection: {
        width: '100%',
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
        marginBottom: 30,
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
    emptyText: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        marginVertical: 10,
        shadowColor: "rgba(0,0,0,0.05)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EDF2F7',
        width: '100%',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#4A5568',
        fontWeight: '500',
    },
    errorContainer: {
        padding: 22,
        backgroundColor: '#FFF5F5',
        borderRadius: 16,
        borderLeftWidth: 5,
        borderLeftColor: '#FC8181',
        marginVertical: 10,
        shadowColor: "rgba(0,0,0,0.05)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
        width: '100%',
    },
    errorText: {
        color: '#C53030',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    listContent: {
        width: '100%',
    },
    productCardContainer: {
        width: '100%',
        marginBottom: 16,
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: "rgba(0,0,0,0.06)",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 25,
        width: '100%',
        paddingHorizontal: 5,
    },
    paginationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#EBF8FF',
        shadowColor: "rgba(0,0,0,0.05)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 1,
    },
    paginationButtonDisabled: {
        backgroundColor: '#F7FAFC',
        shadowOpacity: 0,
        elevation: 0,
    },
    paginationButtonText: {
        color: '#3182CE',
        fontWeight: '600',
        fontSize: 14,
        marginHorizontal: 4,
        letterSpacing: 0.2,
    },
    paginationButtonTextDisabled: {
        color: '#A0AEC0',
    },
    paginationInfo: {
        fontSize: 14,
        color: '#4A5568',
        fontWeight: '500',
    },
});
