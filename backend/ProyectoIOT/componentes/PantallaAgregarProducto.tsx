import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';

export default function PantallaAgregarProducto() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState('');

    const handleAddProduct = async () => {
        try {
            const response = await axios.post('http://localhost:8082/api/products/add', {
                name,
                description,
                price,
                category,
                image,
            });
            if (response.status === 201) {
                console.log('Producto agregado:', response.data);
            }
        } catch (error) {
            console.error('Error al agregar el producto:', error);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                    </View>
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>Agregar Producto</Text>
                        <Text style={styles.label}>Nombre</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa el nombre del producto"
                            value={name}
                            onChangeText={setName}
                        />
                        <Text style={styles.label}>Descripción</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa la descripción del producto"
                            value={description}
                            onChangeText={setDescription}
                        />
                        <Text style={styles.label}>Precio</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa el precio del producto"
                            value={price}
                            onChangeText={setPrice}
                        />
                        <Text style={styles.label}>Categoría</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa la categoría del producto"
                            value={category}
                            onChangeText={setCategory}
                        />
                        <Text style={styles.label}>Imagen (URL)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa la URL de la imagen"
                            value={image}
                            onChangeText={setImage}
                        />
                        <TouchableOpacity style={styles.button} onPress={handleAddProduct}>
                            <Text style={styles.buttonText}>Agregar Producto</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    topBar: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    contentContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        alignSelf: 'flex-start',
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        width: '100%',
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#007bff',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});