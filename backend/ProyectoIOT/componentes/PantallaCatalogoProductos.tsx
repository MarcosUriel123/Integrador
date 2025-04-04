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
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useCart } from './CartContext';
import ProductCard from './ProductCard ';
import IPS from '../config/IPS';
import { useAppTheme } from '../hooks/useAppTheme'; // Importar el hook de tema

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
    const { colors, styles: baseStyles, isDarkMode } = useAppTheme(); // Obtener colores y estilos del tema
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
                const response = await axios.get<ProductResponse[]>(`${IPS.SERVER_URL}/api/products/get`);
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

    // Renderizar producto adaptado al tema
    const renderProductItem = ({ item }: { item: Product }) => (
        <Animated.View
            style={[
                localStyles.productCardContainer,
                {
                    opacity: fadeAnim,
                    backgroundColor: isDarkMode ? colors.card : '#F7FAFC',
                    borderColor: colors.border
                }
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
        <SafeAreaView style={baseStyles.screen}>
            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
            >
                <View style={baseStyles.contentContainer}>
                    <Animated.View
                        style={[
                            {
                                width: '100%',
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        {loading ? (
                            <View style={baseStyles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[baseStyles.normalText, { marginTop: 15 }]}>
                                    Cargando productos...
                                </Text>
                            </View>
                        ) : error ? (
                            <View style={baseStyles.errorContainer}>
                                <Feather name="alert-triangle" size={24} color={colors.error} style={{ marginBottom: 8 }} />
                                <Text style={[baseStyles.normalText, { color: colors.error }]}>{error}</Text>
                            </View>
                        ) : (
                            <View style={[localStyles.productsSection, {
                                backgroundColor: 'transparent',
                                borderWidth: 0,
                                shadowOpacity: 0,
                                elevation: 0
                            }]}>
                                <Text style={[localStyles.sectionTitle, {
                                    color: colors.text,
                                    borderBottomColor: colors.primary
                                }]}>Catálogo de Productos</Text>

                                {products.length === 0 ? (
                                    <Text style={[baseStyles.secondaryText, { textAlign: 'center', marginVertical: 20 }]}>
                                        No hay productos disponibles
                                    </Text>
                                ) : (
                                    <>
                                        <FlatList
                                            data={getCurrentPageProducts()}
                                            renderItem={renderProductItem}
                                            keyExtractor={(item) => item.id}
                                            scrollEnabled={false}
                                            contentContainerStyle={localStyles.listContent}
                                        />

                                        {/* Controles de paginación */}
                                        <View style={localStyles.paginationContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    localStyles.paginationButton,
                                                    {
                                                        backgroundColor: currentPage === 1
                                                            ? 'transparent'
                                                            : colors.primaryLight
                                                    }
                                                ]}
                                                onPress={goToPreviousPage}
                                                disabled={currentPage === 1}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name="chevron-back"
                                                    size={22}
                                                    color={currentPage === 1 ? colors.secondaryText : colors.primary}
                                                />
                                                <Text style={[
                                                    localStyles.paginationButtonText,
                                                    {
                                                        color: currentPage === 1
                                                            ? colors.secondaryText
                                                            : colors.primary
                                                    }
                                                ]}>Anterior</Text>
                                            </TouchableOpacity>

                                            <Text style={[localStyles.paginationInfo, { color: colors.secondaryText }]}>
                                                Página {currentPage} de {totalPages}
                                            </Text>

                                            <TouchableOpacity
                                                style={[
                                                    localStyles.paginationButton,
                                                    {
                                                        backgroundColor: currentPage === totalPages
                                                            ? 'transparent'
                                                            : colors.primaryLight
                                                    }
                                                ]}
                                                onPress={goToNextPage}
                                                disabled={currentPage === totalPages}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    localStyles.paginationButtonText,
                                                    {
                                                        color: currentPage === totalPages
                                                            ? colors.secondaryText
                                                            : colors.primary
                                                    }
                                                ]}>Siguiente</Text>
                                                <Ionicons
                                                    name="chevron-forward"
                                                    size={22}
                                                    color={currentPage === totalPages ? colors.secondaryText : colors.primary}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos locales específicos para este componente
const localStyles = StyleSheet.create({
    productsSection: {
        width: '100%',
        padding: 10,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 24,
        borderBottomWidth: 3,
        paddingBottom: 12,
        width: '65%',
        letterSpacing: 0.5,
    },
    listContent: {
        width: '100%',
    },
    productCardContainer: {
        width: '100%',
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
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
    },
    paginationButtonText: {
        fontWeight: '600',
        fontSize: 14,
        marginHorizontal: 4,
        letterSpacing: 0.2,
    },
    paginationInfo: {
        fontSize: 14,
        fontWeight: '500',
    },
});
