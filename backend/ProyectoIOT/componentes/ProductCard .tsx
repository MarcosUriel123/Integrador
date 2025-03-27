import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Product = {
    id: string;
    name: string;
    image: string;
    price: number;
};

type Props = {
    product: Product;
    onPress: () => void;
    onAddToCart: (product: Product) => void;
};

export default function ProductCard({ product, onPress, onAddToCart }: Props) {
    return (
        <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.card} onPress={onPress}>
                <Image source={{ uri: product.image }} style={styles.image} />
                <View style={styles.info}>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => onAddToCart(product)}
            >
                <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Añadir al carrito</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFF',
        marginBottom: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        overflow: 'hidden',
        width: '100%', // Añadir explícitamente width: 100%
    },
    card: {
        flexDirection: 'row',
        padding: 12,
        width: '100%', // Asegurar que también ocupe todo el ancho
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 10,
        marginRight: 10,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    addButton: {
        backgroundColor: '#007bff',
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Asegurar que el botón ocupe todo el ancho
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    }
});