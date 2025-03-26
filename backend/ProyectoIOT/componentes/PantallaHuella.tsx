import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';

export default function PantallaHuella() {
    const handleRegistrarHuella = async () => {
        try {
            const response = await axios.get('http://192.168.8.6:8082/api/huella/registrar'); //(IPCONFIG)
            alert(response.data);
        } catch (error) {
            console.error("Error al registrar huella:", error);
            alert('Error al registrar huella');
        }



    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                    </View>

                    <View style={styles.contentContainer}>
                        <Text style={styles.encabezado}>Registro de Huella</Text>

                        <FontAwesome5
                            name="fingerprint"
                            size={150}
                            color="#1E1E1E"
                            style={{ marginBottom: 30 }}
                        />

                        <TouchableOpacity
                            style={styles.boton}
                            onPress={handleRegistrarHuella}
                        >
                            <Text style={styles.textoBoton}>Registrar Huella</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Reutiliza los mismos estilos de PantallaPuerta.tsx con ajustes menores
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
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 10,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E1E1E',
    },
    contentContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    encabezado: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginBottom: 20,
    },
    boton: {
        backgroundColor: '#1E1E1E',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginBottom: 30,
    },
    textoBoton: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});