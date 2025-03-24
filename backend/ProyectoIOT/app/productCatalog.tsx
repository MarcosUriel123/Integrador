import React from 'react';
import { SafeAreaView, ScrollView, View, FlatList, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

// Suponiendo que tienes un ProductCard en ../components/ProductCard
import ProductCard from '@/componentes/ProductCard ';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
}

// Datos de ejemplo (puedes reemplazarlos con los datos de tu API)
const products = [
    {
        _id: '67d48bbd20a3a3c81ac8d741',
        name: 'Cerveza',
        description: 'Fría',
        price: 40,
        category: 'Bebidas',
        image: 'https://blog.homedepot.com.mx/wp-content/uploads/2022/08/CerradurasInt…',
    },
    {
        _id: '67d48bbd20a3a3c81ac8d742',
        name: 'Pizza',
        description: 'Con queso',
        price: 120,
        category: 'Comida',
        image: 'https://example.com/pizza.jpg',
    },
];

export default function ProductCatalogScreen() {
    const router = useRouter();

    // Mapear los productos para convertir _id a id
    const formattedProducts = products.map(product => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
    }));

    // Función para manejar el clic en un producto
    const handleProductPress = (product: Product) => {
        router.push({
            pathname: '/productoDetail',
            params: { product: JSON.stringify(product) },
        });
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Tarjeta blanca */}
                <View style={styles.cardContainer}>
                    {/* Barra Superior */}
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                    </View>

                    {/* Contenido principal */}
                    <View style={styles.contentContainer}>
                        <Feather name="shopping-cart" size={60} color="black" style={styles.icon} />
                        <Text style={styles.title}>Catálogo de Productos</Text>

                        {/* Lista de productos */}
                        <FlatList
                            data={formattedProducts}
                            keyExtractor={(item) => item.id}
                            style={styles.list}
                            renderItem={({ item }) => (
                                <ProductCard
                                    product={item}
                                    onPress={() => handleProductPress(item)}
                                    onAddToCart={() => console.log('Add to cart', item)}
                                />
                            )}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Fondo azul, igual que en tus otras pantallas
    screen: {
        flex: 1,
        backgroundColor: '#CFE2FF',
    },
    // Centra la tarjeta verticalmente
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    // Tarjeta blanca con sombra
    cardContainer: {
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        // Sombra iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        // Sombra Android
        elevation: 6,
    },
    // Barra Superior
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
    // Contenido de la tarjeta
    contentContainer: {
        alignItems: 'center',
    },
    icon: {
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginBottom: 20,
    },
    list: {
        width: '100%',
    },
});