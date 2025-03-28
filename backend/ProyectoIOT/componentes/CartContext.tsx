import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CartProduct = {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
};

type Product = {
    id: string;
    name: string;
    image: string;
    price: number;
};

type CartContextType = {
    totalItems: number;
    updateCartCount: () => Promise<void>;
    resetCart: () => Promise<void>;
    addToCart: (product: Product) => Promise<void>;
};

const CartContext = createContext<CartContextType>({
    totalItems: 0,
    updateCartCount: async () => {},
    resetCart: async () => {},
    addToCart: async () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [totalItems, setTotalItems] = useState(0);

    const updateCartCount = async () => {
        try {
            const cartData = await AsyncStorage.getItem('userCart');
            if (cartData) {
                const cart = JSON.parse(cartData);
                const count = cart.reduce((total: number, item: any) => total + item.quantity, 0);
                setTotalItems(count);
            } else {
                setTotalItems(0);
            }
        } catch (error) {
            console.error('Error al actualizar contador del carrito:', error);
        }
    };

    const resetCart = async () => {
        try {
            await AsyncStorage.setItem('userCart', JSON.stringify([]));
            setTotalItems(0);
        } catch (error) {
            console.error('Error al reiniciar el carrito:', error);
        }
    };

    // Nueva función para añadir productos al carrito
    const addToCart = async (product: Product) => {
        try {
            const cartData = await AsyncStorage.getItem('userCart');
            let cart: CartProduct[] = [];
            
            if (cartData) {
                cart = JSON.parse(cartData);
                
                // Verificar si el producto ya está en el carrito
                const existingItemIndex = cart.findIndex(item => item.id === product.id);
                
                if (existingItemIndex !== -1) {
                    // Si el producto ya existe, incrementar la cantidad
                    cart[existingItemIndex].quantity += 1;
                } else {
                    // Si el producto no existe, añadirlo con cantidad 1
                    cart.push({
                        ...product,
                        quantity: 1
                    });
                }
            } else {
                // Si el carrito está vacío, añadir el primer producto
                cart = [{
                    ...product,
                    quantity: 1
                }];
            }
            
            // Guardar el carrito actualizado
            await AsyncStorage.setItem('userCart', JSON.stringify(cart));
            
            // Actualizar el contador
            await updateCartCount();
        } catch (error) {
            console.error('Error al añadir producto al carrito:', error);
        }
    };

    // Actualizar contador cuando el componente se monta
    useEffect(() => {
        updateCartCount();
    }, []);

    return (
        <CartContext.Provider value={{ totalItems, updateCartCount, resetCart, addToCart }}>
            {children}
        </CartContext.Provider>
    );
};