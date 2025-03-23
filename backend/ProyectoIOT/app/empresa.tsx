import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../componentes/Header';
import Footer from '../componentes/Footer';

export default function EmpresaScreen() {
    const router = useRouter();

    // Estado para controlar el menú desplegable
    const [menuVisible, setMenuVisible] = useState(false);

    // Funciones para cada apartado
    const handleMision = () => {
        router.push('/mision');
    };
    const handleVision = () => {
        router.push('/vision');
    };
    const handleValores = () => {
        router.push('/valores');
    };
    const handlePoliticas = () => {
        router.push('/politicas');
    };

    // Función para alternar la visibilidad del menú desplegable
    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                {/* Tarjeta principal */}
                <View style={styles.cardContainer}>
                    {/* Usar el componente Header */}
                    <Header title="Empresa" showProfileIcon={true} />

                    {/* Sección Hero con imagen */}
                    <View style={styles.heroSection}>
                        <Image
                            source={require('../assets/images/puertaIOT-empresa.png')}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Contenido principal */}
                    <View style={styles.mainContent}>
                        <Text style={styles.title}>¿Quiénes somos?</Text>
                        <Text style={styles.parrafo}>
                            Lorem ipsum is simply dummy text of the printing and typesetting industry.
                        </Text>

                        {/* Botón para mostrar el menú */}
                        <TouchableOpacity style={styles.dropdownButton} onPress={toggleMenu}>
                            <Text style={styles.dropdownButtonText}>¿Quiénes somos?</Text>
                        </TouchableOpacity>

                        {/* Menú desplegable */}
                        {menuVisible && (
                            <View style={styles.dropdownMenu}>
                                <TouchableOpacity style={styles.menuItem} onPress={handleMision}>
                                    <Text style={styles.menuItemText}>Misión</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuItem} onPress={handleVision}>
                                    <Text style={styles.menuItemText}>Visión</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuItem} onPress={handleValores}>
                                    <Text style={styles.menuItemText}>Valores</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuItem} onPress={handlePoliticas}>
                                    <Text style={styles.menuItemText}>Políticas</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Usar el componente Footer */}
                    <Footer showContactInfo={true} showTerms={true} />
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
        height: 250,
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
    dropdownButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginVertical: 8,
        width: '60%',
        alignSelf: 'center',
        alignItems: 'center',
    },
    dropdownButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    dropdownMenu: {
        marginTop: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    menuItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    menuItemText: {
        fontSize: 16,
        color: '#1E1E1E',
        fontWeight: '600',
    }
});
