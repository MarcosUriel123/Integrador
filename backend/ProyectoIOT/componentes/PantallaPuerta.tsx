import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios'; // Para hacer solicitudes HTTP
import { router } from 'expo-router';

export default function PantallaPuerta() {
    // Estado para saber si la puerta está abierta (true) o cerrada (false)
    const [puertaAbierta, setPuertaAbierta] = useState(false);

    // Función para abrir o cerrar la puerta
    const handleTogglePuerta = async () => {
        try {
            // Realizamos la solicitud al backend para abrir o cerrar la puerta
            const url = puertaAbierta
                ? 'http://localhost:8082/api/door/cerrar' //ip de IPCONFIG
                : 'http://localhost:8082/api/door/abrir';
            const response = await axios.get(url);  // Llamada al backend

            // Si la respuesta es exitosa, actualizamos el estado de la puerta
            setPuertaAbierta(!puertaAbierta);
            alert(response.data);  // Muestra el mensaje recibido del backend
        } catch (error) {
            console.error("Error al controlar la puerta:", error);
            alert('Error al controlar la puerta');
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                {/* Tarjeta principal */}
                <View style={styles.cardContainer}>

                    {/* Barra Superior */}
                    <View style={styles.topBar}>
                        {/* Texto "Segurix" como enlace */}
                        <TouchableOpacity onPress={() => router.push('/Principal')}>
                            <Text style={styles.logo}>Segurix</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Contenido principal */}
                    <View style={styles.contentContainer}>
                        <Text style={styles.encabezado}>Dispositivo IOT</Text>

                        {/* Ícono de la puerta */}
                        <FontAwesome5
                            name={puertaAbierta ? "door-open" : "door-closed"}
                            size={150}
                            color="#1E1E1E"
                            style={{ marginBottom: 30 }}
                        />

                        {/* Botón para abrir/cerrar */}
                        <TouchableOpacity style={styles.botonPuerta} onPress={handleTogglePuerta}>
                            <Text style={styles.textoBoton}>
                                {puertaAbierta ? "Cerrar puerta" : "Abrir puerta"}
                            </Text>
                        </TouchableOpacity>

                        {/* Botones de Configuración y Registros */}
                        <View style={styles.bottomButtons}>
                            <TouchableOpacity style={styles.configButton} onPress={() => router.push('/configuracionDispositivo')}>
                                <FontAwesome5 name="file-alt" size={20} color="#1E1E1E" style={styles.buttonIcon} />
                                <Text style={styles.configButtonText}>Configuración</Text>
                            </TouchableOpacity>

                            {/* Botón Registros */}
                            <TouchableOpacity style={styles.configButton} onPress={() => router.push('/registros')}>
                                <FontAwesome5 name="file-alt" size={20} color="#1E1E1E" style={styles.buttonIcon} />
                                <Text style={styles.configButtonText}>Registros</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

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
    botonPuerta: {
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
    bottomButtons: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        width: '100%',
    },
    configButton: {
        backgroundColor: '#E0E0E0',
        borderRadius: 15,
        paddingVertical: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        width: '40%',
        justifyContent: 'center',
    },
    buttonIcon: {
        marginRight: 8,
    },
    configButtonText: {
        fontSize: 16,
        color: '#1E1E1E',
        fontWeight: '500',
    },
});