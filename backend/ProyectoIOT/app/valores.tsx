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
import BotonVolver from '../componentes/BotonVolver';

export default function ValoresScreen() {
    const router = useRouter();
    const API_BASE = 'http://192.168.8.6:8082/api'; // Update with your actual IP address (use ipconfig)
    const [valor, setValor] = useState(''); // Usamos una variable para almacenar solo el último valor

    // useEffect para cargar el último valor desde el backend
    useEffect(() => {
        const fetchValor = async () => {
            try {
                const response = await axios.get(`${API_BASE}/empresa/valores`);
                // Suponiendo que los valores están ordenados por la fecha de creación y tomamos el último
                const data = response.data as { contenido: string }[]; // Aseguramos el tipo de los datos
                const lastValue = data[data.length - 1]; // Toma el último valor
                setValor(lastValue?.contenido || 'No hay valores definidos.');
            } catch (error) {
                console.error("Error fetching valor:", error);
                setValor('Error al obtener valor.');
            }
        };
        fetchValor();
    }, []);

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    {/* Replace static topBar with Header component */}
                    <Header />

                    <BotonVolver destino="/empresa" />

                    {/* Sección Hero (Imagen) */}
                    <View style={styles.heroSection}>
                        <Image
                            source={require('../assets/images/puertaIOT-valores.png')}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Contenido principal: Valor */}
                    <View style={styles.mainContent}>
                        <Text style={styles.title}>Último Valor</Text>
                        <Text style={styles.parrafo}>{valor}</Text>
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
