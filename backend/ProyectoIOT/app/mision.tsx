// app/mision.tsx
import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Header from '../componentes/Header'; // Import Header component
import Footer from '../componentes/Footer'; // Import Footer component

export default function MisionScreen() {
    const router = useRouter();
    const API_BASE = 'http://192.168.0.1:8082/api'; // Update this with your actual IP instead of 192.168.8.4
    const [mision, setMision] = useState('');

    // useEffect para cargar la última misión desde el backend
    useEffect(() => {
        const fetchMision = async () => {
            try {
                const response = await axios.get(`${API_BASE}/empresa/misiones`);
                const data = response.data as { contenido: string }[];
                const lastMision = data[data.length - 1]; // Toma la última misión
                setMision(lastMision?.contenido || 'No hay misión definida.');
            } catch (error) {
                console.error("Error fetching misión:", error);
                setMision('Error al obtener misión.');
            }
        };
        fetchMision();
    }, []);

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    {/* Replace static topBar with Header component */}
                    <Header />

                    {/* Sección Hero (Imagen) */}
                    <View style={styles.heroSection}>
                        <Image
                            source={require('../assets/images/puertaIOT-mision.png')}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Contenido principal: Misión */}
                    <View style={styles.mainContent}>
                        <Text style={styles.title}>Última Misión</Text>
                        <Text style={styles.parrafo}>{mision}</Text>
                    </View>

                    {/* Replace static footer with Footer component */}
                    <Footer />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

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
    // Removed topBar styles
    heroSection: {
        marginTop: 10,
        alignItems: 'center',
    },
    heroImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
    mainContent: {
        marginTop: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginBottom: 10,
        textAlign: 'center',
    },
    parrafo: {
        fontSize: 16,
        color: '#2C2C2C',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 20,
    },
    // Removed footer styles
});
