import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Product = {
    id: string;
    name: string;
    image: string;
    price: number;
    // Otros campos opcionales...
    description?: string;
    category?: string;
};

type CartProduct = Product & {
    quantity: number;
};

type CartContextType = {
    items: CartProduct[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
};

const CartContext = createContext<CartContextType>({
    items: [],
    addToCart: () => { },
    removeFromCart: () => { },
    updateQuantity: () => { },
    clearCart: () => { },
    totalItems: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartProduct[]>([]);
    // Computed value para totalItems
    const [totalItems, setTotalItems] = useState(0);

    // Calcular totalItems cada vez que items cambie
    useEffect(() => {
        const newTotalItems = items.reduce((total, item) => total + item.quantity, 0);
        setTotalItems(newTotalItems);
    }, [items]);

    // Cargar carrito desde storage cuando se inicia la app
    useEffect(() => {
        const loadCart = async () => {
            try {
                const cartData = await AsyncStorage.getItem('userCart');
                if (cartData) {
                    const parsedItems = JSON.parse(cartData);
                    setItems(parsedItems);
                }
            } catch (error) {
                console.error('Error al cargar el carrito:', error);
            }
        };

        loadCart();
    }, []);

    // Guardar carrito en storage cuando cambia
    useEffect(() => {
        const saveCart = async () => {
            try {
                await AsyncStorage.setItem('userCart', JSON.stringify(items));
            } catch (error) {
                console.error('Error al guardar el carrito:', error);
            }
        };

        saveCart();
    }, [items]);

    const addToCart = (product: Product) => {
        setItems(currentItems => {
            // Verificar si el producto ya está en el carrito
            const existingItem = currentItems.find(item => item.id === product.id);

            if (existingItem) {
                // Incrementar cantidad si ya existe
                return currentItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                // Añadir nuevo producto con cantidad 1
                return [...currentItems, { ...product, quantity: 1 }];
            }
        });
    };

    const removeFromCart = (productId: string) => {
        setItems(currentItems => currentItems.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) return;

        setItems(currentItems =>
            currentItems.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
        AsyncStorage.removeItem('userCart');
    };

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            totalItems,
        }}>
            {children}
        </CartContext.Provider>
    );
};