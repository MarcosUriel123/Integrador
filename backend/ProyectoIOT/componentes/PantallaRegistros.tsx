import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

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
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchRegistros = async () => {
        try {
            console.log("Obteniendo registros...");
            setLoading(true);
            const response = await axios.get<Registro[]>('http://192.168.8.5:8082/api/registros/get');
            if (response.status === 200) {
                const registrosData = response.data as Registro[];
                console.log(`Registros recibidos: ${registrosData.length}`);
                if ((response.data as Registro[]).length > 0) {
                    console.log(`Último registro: ${JSON.stringify(response.data[0])}`);
                } else {
                    console.log("No hay registros disponibles");
                }
                setRegistros(response.data as Registro[]);
            }
        } catch (err: any) {
            console.error("Error al cargar registros:", err.message);
            setError('Error al cargar los registros');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRegistros();

        const interval = setInterval(fetchRegistros, 5000);
        return () => clearInterval(interval);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRegistros();
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

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay registros disponibles</Text>
            <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchRegistros}
            >
                <Text style={styles.refreshButtonText}>Actualizar</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Cargando registros...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push('/puerta')}
            >
                <Feather name="arrow-left" size={24} color="#007bff" />
                <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>

            <View style={styles.contentContainer}>
                <Text style={styles.title}>Registros de Acceso</Text>

                <FlatList
                    data={registros}
                    renderItem={renderRegistroItem}
                    keyExtractor={(item) => item._id}
                    scrollEnabled={true} // Habilitar el scroll
                    contentContainerStyle={[
                        styles.listContent,
                        registros.length === 0 && styles.emptyList
                    ]}
                    ListEmptyComponent={renderEmptyList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#007bff"]}
                        />
                    }
                />
            </View>

            {error ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error}</Text>
                </View>
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
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
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6c757d',
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
    errorBanner: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#dc3545',
        padding: 10,
    },
    errorBannerText: {
        color: 'white',
        textAlign: 'center',
    },
    listContent: {
        width: '100%',
        paddingBottom: 20,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        marginBottom: 20,
    },
    refreshButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    refreshButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        zIndex: 10,
    },
    backButtonText: {
        marginLeft: 5,
        fontSize: 16,
        color: '#007bff',
    },
    contentContainer: {
        flex: 1,
        padding: 20,
    },
});