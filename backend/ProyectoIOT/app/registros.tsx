import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Entypo } from '@expo/vector-icons';

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

    useEffect(() => {
        const fetchRegistros = async () => {
            try {
                const response = await axios.get('http://localhost:8082/api/registros/get'); //(ipconfig)
                if (response.status === 200) {
                    setRegistros(response.data as Registro[]);
                }
            } catch (err) {
                setError('Error al cargar los registros');
            } finally {
                setLoading(false);
            }
        };

        fetchRegistros();
        // Actualizar cada 5 segundos
        const interval = setInterval(fetchRegistros, 5000);
        return () => clearInterval(interval);
    }, []);

    const renderRegistroItem = ({ item }: { item: Registro }) => (
        <View style= { styles.registroCard } >
        <Text style={ styles.registroMensaje }> { item.mensaje } </Text>
            < Text style = { styles.registroDescripcion } > { item.descripcion } </Text>
                < Text style = { styles.registroFecha } >
                    { new Date(item.fecha).toLocaleString() }
                    </Text>
                    </View>
    );

    if (loading) {
        return (
            <View style= { styles.loadingContainer } >
            <ActivityIndicator size="large" color = "#007bff" />
                </View>
        );
    }

    if (error) {
        return (
            <View style= { styles.errorContainer } >
            <Text style={ styles.errorText }> { error } </Text>
                </View>
        );
    }

    return (
        <SafeAreaView style= { styles.screen } >
        <ScrollView style={ { flex: 1 } }>
            <View style={ styles.cardContainer }>
                <View style={ styles.topBar }>
                    <Text style={ styles.logo }> Segurix </Text>
                        < View style = { styles.nav } >
                            <TouchableOpacity onPress={ () => router.push('/empresa') }>
                                <Text style={ styles.navText }> Empresa </Text>
                                    </TouchableOpacity>
                                    < TouchableOpacity onPress = {() => router.push('/CatalogoProductosScreen')
}>
    <Text style={ styles.navText }> Productos </Text>
        </TouchableOpacity>
        < TouchableOpacity onPress = {() => router.push('/registros')}>
            <Text style={ styles.navText }> Registros </Text>
                </TouchableOpacity>
                < TouchableOpacity onPress = {() => router.push('/puerta')}>
                    <Text style={ styles.navText }> Dispositivo IOT </Text>
                        </TouchableOpacity>
                        </View>
                        </View>

                        < Text style = { styles.title } > Registros de Alertas </Text>
                            < FlatList
data = { registros }
renderItem = { renderRegistroItem }
keyExtractor = {(item) => item._id}
scrollEnabled = { false}
contentContainerStyle = { styles.listContent }
    />
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
    nav: {
        flexDirection: 'row',
    },
    navText: {
        fontSize: 16,
        color: '#1E1E1E',
        marginLeft: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginVertical: 15,
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
    }
});