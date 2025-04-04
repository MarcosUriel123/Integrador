import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Importar para el gradiente
import { useAppTheme } from '../hooks/useAppTheme';

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
    const { colors, isDarkMode } = useAppTheme();
    
    // Definir un color más claro para el contenedor
    const lighterCardColor = isDarkMode 
        ? 'rgba(37, 48, 67, 0.6)' // Un gris oscuro más claro para tema oscuro 
        : '#FFFFFF'; // Blanco puro para tema claro
        
    // Definir colores del gradiente para el botón como en login/registro
    const buttonGradientColors = isDarkMode
        ? [colors.primary, '#1e3a8a'] // Primario a azul oscuro para tema oscuro
        : [colors.primary, '#2C5282']; // Primario a azul medio para tema claro

    return (
        <View style={[
            styles.cardContainer, 
            { 
                backgroundColor: lighterCardColor, // Usar el color más claro
                borderColor: colors.border,
                shadowOpacity: isDarkMode ? 0.3 : 0.1,
                elevation: isDarkMode ? 2 : 1,
            }
        ]}>
            <TouchableOpacity 
                style={styles.card} 
                onPress={onPress}
                activeOpacity={0.7}
            >
                <Image source={{ uri: product.image }} style={styles.image} />
                <View style={styles.info}>
                    <Text style={[styles.name, { color: colors.text }]}>
                        {product.name}
                    </Text>
                    <Text style={[styles.price, { color: colors.secondaryText }]}>
                        ${product.price.toFixed(2)}
                    </Text>
                </View>
            </TouchableOpacity>
            
            {/* Botón con gradiente similar a login/registro */}
            <TouchableOpacity
                style={styles.addButtonContainer}
                onPress={() => onAddToCart(product)}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={buttonGradientColors}
                    style={styles.addButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Añadir al carrito</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        overflow: 'hidden',
        width: '100%',
    },
    card: {
        flexDirection: 'row',
        padding: 12,
        width: '100%',
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
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        fontWeight: '500',
    },
    addButtonContainer: {
        width: '100%',
        overflow: 'hidden',
    },
    addButton: {
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    }
});