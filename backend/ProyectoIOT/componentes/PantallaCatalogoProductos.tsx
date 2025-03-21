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
    Image
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Entypo } from '@expo/vector-icons';

type Product = {
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

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://192.168.8.9:8082/api/products/get');
                if (response.status === 200) {
                    setProducts(response.data as Product[]);
                }
            } catch (err) {
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
            params: { product: JSON.stringify(product) }, // Pasar el producto como string
        });
    };

    const renderProductItem = ({ item }: { item: Product }) => (
        <TouchableOpacity onPress={() => handleProductPress(item)}>
            <View style={styles.productCard}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDescription}>{item.description}</Text>
                <View style={styles.detailsContainer}>
                    <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                        <View style={styles.nav}>
                            <TouchableOpacity onPress={() => router.push('/empresa')}>
                                <Text style={styles.navText}>Empresa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/CatalogoProductosScreen')}>
                                <Text style={styles.navText}>Productos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/huella')}>
                                <Text style={styles.navText}>Huella</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/puerta')}>
                                <Text style={styles.navText}>Dispositivo IOT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/rfidControl' as any)}>
                                <Text style={styles.navText}>RFID</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/perfil')}>
                                <Text style={styles.navText}>Perfil</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/Aggprod' as any)}>
                                <Text style={styles.navText}>Admin(agg prod)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.title}>Catálogo de Productos</Text>
                    <FlatList
                        data={products}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item._id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.listContent}
                    />

                    <View style={styles.footer}>
                        <View style={styles.footerLeft}>
                            <TouchableOpacity onPress={() => console.log('Términos y condiciones')}>
                                <Text style={styles.footerText}>Términos y condiciones</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => console.log('Privacidad')}>
                                <Text style={styles.footerText}>Privacidad</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.footerRight}>
                            <Text style={[styles.footerText, styles.footerTitle]}>Contáctanos</Text>
                            <Text style={styles.footerText}>Col. Horacio Camargo</Text>
                            <Text style={styles.footerText}>segurix@mail.com</Text>
                            <Text style={styles.footerText}>+52 774 545 8510</Text>
                            <Text style={[styles.footerText, styles.footerTitle]}>Redes sociales</Text>
                            <View style={styles.socialIcons}>
                                <TouchableOpacity onPress={() => console.log('Instagram')}>
                                    <Entypo
                                        name="instagram-with-circle"
                                        size={28}
                                        color="#1E1E1E"
                                        style={styles.socialIcon}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => console.log('Facebook')}>
                                    <Entypo
                                        name="facebook-with-circle"
                                        size={28}
                                        color="#1E1E1E"
                                        style={styles.socialIcon}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos combinados y actualizados
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
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 10,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E1E1E',
    },
    nav: {
        flexDirection: 'row',
    },
    navText: {
        fontSize: 16,
        color: '#1E1E1E',
        marginLeft: 20,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#dc3545',
        fontSize: 16,
    },
    listContent: {
        width: '100%',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 10,
    },
    footerLeft: {
        flex: 1,
    },
    footerRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    footerText: {
        fontSize: 14,
        color: '#1E1E1E',
        marginBottom: 4,
    },
    footerTitle: {
        fontWeight: 'bold',
        marginTop: 8,
    },
    socialIcons: {
        flexDirection: 'row',
        marginTop: 8,
    },
    socialIcon: {
        marginRight: 15,
    },
});
