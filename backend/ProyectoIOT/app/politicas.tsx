// app/politicas.tsx
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

export default function PoliticasScreen() {
    const router = useRouter();
    const API_BASE = 'http://192.168.8.3:8082/api'; // Update with your actual IP address (use ipconfig)
    const [politica, setPolitica] = useState('');

    // useEffect para cargar la última política desde el backend
    useEffect(() => {
        const fetchPolitica = async () => {
            try {
                const response = await axios.get(`${API_BASE}/empresa/politicas`);
                const data = response.data as { descripcion: string }[];
                const lastPolitica = data[data.length - 1]; // Toma la última política
                setPolitica(lastPolitica?.descripcion || 'No hay políticas definidas.');
            } catch (error) {
                console.error("Error fetching política:", error);
                setPolitica('Error al obtener política.');
            }
        };
        fetchPolitica();
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
                            source={require('../assets/images/puertaIOT-politicas.png')}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Contenido principal: Políticas */}
                    <View style={styles.mainContent}>
                        <Text style={styles.title}>Última Política</Text>
                        <Text style={styles.parrafo}>{politica}</Text>
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
