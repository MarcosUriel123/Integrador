import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';

type Product = {
    id: string;
    name: string;
    image: string;
    price: number;
};

type Props = {
    product: Product;
    onPress: () => void;
};

export default function ProductCard({ product, onPress }: Props) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: product.image }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.price}>${product.price}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginBottom: 10,
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 10,
        marginRight: 10,
    },
    info: {
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E1E1E',
    },
    price: {
        fontSize: 14,
        color: '#555',
    },
});