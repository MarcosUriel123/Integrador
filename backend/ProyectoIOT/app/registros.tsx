import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Entypo, Feather, MaterialIcons } from '@expo/vector-icons';
import BotonVolver from '../componentes/BotonVolver';
import IPS from '../config/IPS'; // Importamos la configuración centralizada

interface Registro {
    _id: string;
    mensaje: string;
    descripcion: string;
    fecha: string;
}

export default function PantallaRegistros() {
    const router = useRouter();
    const [registros, setRegistros] = useState<Registro[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [eliminando, setEliminando] = useState(false);

    const fetchRegistros = async () => {
        try {
            // Usar la configuración centralizada en lugar de IPs hardcodeadas
            const response = await axios.get(`${IPS.SERVER_URL}${IPS.API.REGISTRO_URL}/get`);
            if (response.status === 200) {
                setRegistros(response.data as Registro[]);
            }
        } catch (err) {
            setError('Error al cargar los registros');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistros();
        // Actualizar cada 5 segundos
        const interval = setInterval(fetchRegistros, 5000);
        return () => clearInterval(interval);
    }, []);

    // Función para eliminar todos los registros
    const handleEliminarRegistros = () => {
        Alert.alert(
            "Confirmar eliminación",
            "¿Estás seguro de que deseas eliminar todos los registros?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setEliminando(true);
                            // Usar la configuración centralizada en lugar de IPs hardcodeadas
                            const response = await axios.delete(`${IPS.SERVER_URL}${IPS.API.REGISTRO_URL}/deleteAll`);
                            if (response.status === 200) {
                                setRegistros([]);
                                Alert.alert("Éxito", "Todos los registros han sido eliminados");
                            }
                        } catch (err) {
                            Alert.alert("Error", "No se pudieron eliminar los registros");
                        } finally {
                            setEliminando(false);
                        }
                    }
                }
            ]
        );
    };

    const renderRegistroItem = ({ item }: { item: Registro }) => (
        <View style={styles.registroCard}>
            <Text style={styles.registroMensaje}>{item.mensaje}</Text>
            <Text style={styles.registroDescripcion}>{item.descripcion}</Text>
            <Text style={styles.registroFecha}>
                {new Date(item.fecha).toLocaleString()}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            {/* Botón para volver */}
            <BotonVolver destino="/puerta" />

            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Registros de Alertas</Text>

                        {/* Botón para eliminar todos los registros */}
                        {registros.length > 0 && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={handleEliminarRegistros}
                                disabled={eliminando}
                            >
                                {eliminando ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <MaterialIcons name="delete" size={20} color="#fff" />
                                        <Text style={styles.deleteButtonText}>Eliminar todo</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {registros.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No hay registros disponibles</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={registros}
                            renderItem={renderRegistroItem}
                            keyExtractor={(item) => item._id}
                            scrollEnabled={false}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
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
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        flex: 1,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dc3545',
        borderRadius: 8,
        padding: 8,
        paddingHorizontal: 12,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 5,
    },
    registroCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
    },
    registroMensaje: {
        fontSize: 18,
        fontWeight: '600',
        color: '#dc3545',
        marginBottom: 5,
    },
    registroDescripcion: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 8,
    },
    registroFecha: {
        fontSize: 12,
        color: '#495057',
        textAlign: 'right',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#dc3545',
        fontSize: 16,
    },
    listContent: {
        width: '100%',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 10,
    },
});