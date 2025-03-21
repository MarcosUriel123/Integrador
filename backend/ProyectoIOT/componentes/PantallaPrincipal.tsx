import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    StyleSheet,
} from 'react-native';
import Header from './Header';
import Footer from './Footer';

export default function PantallaPrincipal() {
    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <Header />
                    <View style={styles.heroSection}>
                        <Image
                            source={require('../assets/images/puertaIOT-pantallaPrincipal.jpg')}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                        <Text style={styles.heroTitle}>Bienvenido a Segurix</Text>
                        <Text style={styles.heroSubtitle}>
                            La solución inteligente para controlar y asegurar tus dispositivos IoT.
                        </Text>
                    </View>
                    <View style={styles.faqSection}>
                        <View style={styles.faqItem}>
                            <Text style={[styles.faqText, { fontSize: 20, fontWeight: 'bold' }]}>
                                Preguntas Frecuentes
                            </Text>
                            <Text style={styles.faqText}>¿Para qué sirve Segurix?</Text>
                        </View>
                        <View style={styles.faqItem}>
                            <Text style={styles.faqText}>¿Cómo conectar mi dispositivo IoT?</Text>
                        </View>
                    </View>
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
    heroSection: {
        marginTop: 10,
        alignItems: 'center',
    },
    heroImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginTop: 15,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#2C2C2C',
        marginTop: 8,
        textAlign: 'center',
        marginBottom: 10,
    },
    faqSection: {
        marginTop: 30,
    },
    faqItem: {
        backgroundColor: '#F9F9F9',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 6,
    },
    faqText: {
        fontSize: 16,
        color: '#1E1E1E',
    },
});