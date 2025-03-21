import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Switch,
    StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ConfiguracionDispositivo() {
    const router = useRouter();

    // Estado para los switches
    const [seguroActivo, setSeguroActivo] = useState(false);  // Switch de seguros
    const [alarmaActiva, setAlarmaActiva] = useState(false);  // Switch de alarma

    // Funciones para manejar el cambio de estado
    const toggleSeguro = () => setSeguroActivo(!seguroActivo);
    const toggleAlarma = () => setAlarmaActiva(!alarmaActiva);

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                
                {/* Tarjeta principal */}
                <View style={styles.cardContainer}>
                
                    {/* Barra Superior */}
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>
                        <View style={styles.nav}>
                            <TouchableOpacity onPress={() => router.push('/empresa')}>
                                <Text style={styles.navText}>Empresa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => console.log('Ver productos')}>
                                <Text style={styles.navText}>Productos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/puerta')}>
                                <Text style={styles.navText}>Dispositivo IOT</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Contenido principal */}
                    <View style={styles.mainContent}>
                        <Text style={styles.title}>Configuración de mi dispositivo</Text>

                        {/* ID del dispositivo */}
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>ID del dispositivo</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="XXX XXX XXXX"
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Desactivar todos los seguros */}
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Desactivar todos los seguros</Text>
                            <Switch
                                value={seguroActivo}
                                onValueChange={toggleSeguro}
                                trackColor={{ false: "#767577", true: "#81b0ff" }}
                                thumbColor={seguroActivo ? "#4CAF50" : "#f4f3f4"}
                            />
                        </View>

                        {/* Desactivar alarma sonora */}
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Desactivar alarma sonora</Text>
                            <Switch
                                value={alarmaActiva}
                                onValueChange={toggleAlarma}
                                trackColor={{ false: "#767577", true: "#81b0ff" }}
                                thumbColor={alarmaActiva ? "#4CAF50" : "#f4f3f4"}
                            />
                        </View>

                        {/* Opciones extra */}
                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => router.push('/gestionarUsuarios')}>
                            <Text style={styles.optionText}>Gestionar perfiles del dispositivo IoT</Text>
                            <Ionicons name="chevron-forward-outline" size={20} color="#1E1E1E" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionRow} onPress={() => console.log('Cambiar PIN')}>
                            <Text style={styles.optionText}>Cambiar PIN de seguridad del dispositivo</Text>
                            <Ionicons name="chevron-forward-outline" size={20} color="#1E1E1E" />
                        </TouchableOpacity>

                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    /* Fondo azul suave */
    screen: {
        flex: 1,
        backgroundColor: '#CFE2FF',
    },
    cardContainer: {
        margin: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        // Sombra en iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        // Sombra en Android
        elevation: 6,
    },
    /* Barra Superior */
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
    nav: {
        flexDirection: 'row',
    },
    navText: {
        fontSize: 16,
        color: '#1E1E1E',
        marginLeft: 20,
    },
    /* Contenido principal */
    mainContent: {
        marginTop: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginBottom: 20,
    },
    /* Fila con etiqueta e input */
    inputRow: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#1E1E1E',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        color: '#1E1E1E',
    },
    /* Fila con etiqueta y toggle */
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    toggleLabel: {
        fontSize: 16,
        color: '#1E1E1E',
    },
    /* Opciones extra (con flecha a la derecha) */
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 14,
        marginBottom: 10,
    },
    optionText: {
        fontSize: 16,
        color: '#1E1E1E',
    },
});
