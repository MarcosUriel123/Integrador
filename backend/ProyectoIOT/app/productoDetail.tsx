import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    StyleSheet
} from 'react-native';

type Product = {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
};

export default function ProductDetail() {
    const { product } = useLocalSearchParams<{ product: string }>();
    const productData: Product = JSON.parse(product || '{}');

    if (!productData._id) {
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

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                    </View>
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>Detalle de {productData.name}</Text>
                        <Image source={{ uri: productData.image }} style={styles.image} />
                        <View style={styles.detailsRow}>
                            <Text style={styles.label}>Precio:</Text>
                            <Text style={styles.value}>${productData.price}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                            <Text style={styles.label}>Categoría:</Text>
                            <Text style={styles.value}>{productData.category}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                            <Text style={styles.label}>Descripción:</Text>
                            <Text style={styles.value}>
                                {productData.description || 'Sin descripción disponible.'}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos (igual que antes)

const styles = StyleSheet.create({
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
});