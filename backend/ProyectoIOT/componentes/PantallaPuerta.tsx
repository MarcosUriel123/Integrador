import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { router } from 'expo-router';

export default function PantallaPuerta() {
    // Estado para saber si la puerta está abierta (true) o cerrada (false)
    const [puertaAbierta, setPuertaAbierta] = useState(false);

    // Estado para el sensor magnético (estado real de la puerta)
    const [estadoRealPuerta, setEstadoRealPuerta] = useState<string>('desconocido');
    const [cargandoEstado, setCargandoEstado] = useState<boolean>(true);

    // Para la animación del indicador cuando la puerta está abierta
    const opacidadDot = useRef(new Animated.Value(1)).current;

    // Para controlar cuándo hacer polling (menos frecuente)
    const [errorConexion, setErrorConexion] = useState<boolean>(false);

    // Función para obtener el estado real de la puerta desde el sensor
    const obtenerEstadoRealPuerta = async () => {
        try {
            // Verificar IP del Arduino en la consola del ESP32
            const response = await axios.get<{ status: string }>('http://192.168.8.2/api/arduino/doorstatus');

            // Depurar la respuesta
            console.log('Respuesta del sensor:', response.data);

            // Actualizar estado solo si hay un cambio para evitar re-renders innecesarios
            if (response.data && typeof response.data.status === 'string' &&
                response.data.status !== estadoRealPuerta) {
                setEstadoRealPuerta(response.data.status);
            }

            // Restablecer bandera de error si había un error previo
            if (errorConexion) {
                setErrorConexion(false);
            }

            setCargandoEstado(false);
        } catch (error) {
            console.error("Error al obtener estado real de la puerta:", error);
            setErrorConexion(true);
            setCargandoEstado(false);
        }
    };

    // Función para abrir o cerrar la puerta
    const handleTogglePuerta = async () => {
        try {
            // Al momento de enviar el comando, actualizar también el estado
            obtenerEstadoRealPuerta();

            // Realizamos la solicitud al backend para abrir o cerrar la puerta
            const url = puertaAbierta
                ? 'http://192.168.8.3:8082/api/door/cerrar'
                : 'http://192.168.8.3:8082/api/door/abrir';

            const response = await axios.get(url);

            // Si la respuesta es exitosa, actualizamos el estado de la puerta
            setPuertaAbierta(!puertaAbierta);
            alert(response.data);

            // Actualizamos el estado después de la acción para reflejar el cambio
            setTimeout(obtenerEstadoRealPuerta, 1000);
        } catch (error) {
            console.error("Error al controlar la puerta:", error);
            alert('Error al controlar la puerta');
        }
    };

    // Animación para el indicador cuando la puerta está abierta
    useEffect(() => {
        if (estadoRealPuerta === 'open') {
            // Crear animación de parpadeo
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(opacidadDot, {
                        toValue: 0.3,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacidadDot, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    })
                ])
            );

            animation.start();

            // Limpiar animación al desmontar o cambiar estado
            return () => {
                animation.stop();
            };
        }
    }, [estadoRealPuerta]);

    // Consultar inicialmente y configurar intervalo para consultas menos frecuentes
    useEffect(() => {
        // Verificar inmediatamente al cargar el componente
        obtenerEstadoRealPuerta();

        // Intervalo de respaldo para verificar cada 10 segundos
        // (solo como respaldo en caso de problemas de conectividad)
        const intervalo = setInterval(obtenerEstadoRealPuerta, 10000);

        // Limpiar el intervalo cuando el componente se desmonte
        return () => clearInterval(intervalo);
    }, []);

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>
                    {/* Barra Superior */}
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => router.push('/Principal')}>
                            <Text style={styles.logo}>Segurix</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Contenido principal */}
                    <View style={styles.contentContainer}>
                        <Text style={styles.encabezado}>Dispositivo IOT</Text>

                        {/* Ícono de la puerta basado en el estado real */}
                        <FontAwesome5
                            name={estadoRealPuerta === 'open' ? "door-open" : "door-closed"}
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

                        {/* Estado real de la puerta desde el sensor magnético */}
                        <View style={[
                            styles.estadoRealContainer,
                            estadoRealPuerta === 'open' ? styles.estadoAbierto :
                                estadoRealPuerta === 'closed' ? styles.estadoCerrado :
                                    styles.estadoDesconocido
                        ]}>
                            <Animated.View
                                style={[
                                    styles.indicadorDot,
                                    estadoRealPuerta === 'open' ? styles.dotAbierto :
                                        estadoRealPuerta === 'closed' ? styles.dotCerrado :
                                            styles.dotDesconocido,
                                    { opacity: estadoRealPuerta === 'open' ? opacidadDot : 1 }
                                ]}
                            />
                            <Text style={styles.textoEstadoReal}>
                                {cargandoEstado ? "Consultando estado..." :
                                    errorConexion ? "ERROR DE CONEXIÓN" :
                                        estadoRealPuerta === 'open' ? "PUERTA ABIERTA" :
                                            estadoRealPuerta === 'closed' ? "PUERTA CERRADA" :
                                                "ESTADO DESCONOCIDO"}
                            </Text>
                        </View>

                        {/* Botones de Configuración y Registros */}
                        <View style={styles.bottomButtons}>
                            <TouchableOpacity style={styles.configButton} onPress={() => router.push('../configurarDispositivo')}>
                                <FontAwesome5 name="cog" size={20} color="#1E1E1E" style={styles.buttonIcon} />
                                <Text style={styles.configButtonText}>Configuración</Text>
                            </TouchableOpacity>

                            {/* Botón Registros */}
                            <TouchableOpacity style={styles.configButton} onPress={() => router.push('/registros')}>
                                <FontAwesome5 name="file-alt" size={20} color="#1E1E1E" style={styles.buttonIcon} />
                                <Text style={styles.configButtonText}>Registros</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Botón Gestionar Usuarios - Nuevo */}
                        <TouchableOpacity
                            style={styles.usersButton}
                            onPress={() => router.push('/registroUsuarios')}
                        >
                            <FontAwesome5 name="users" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.usersButtonText}>Gestionar Usuarios</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // ...existing styles...
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
        marginBottom: 20, // Reducido para hacer espacio para el indicador de estado
    },
    textoBoton: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Nuevos estilos para el estado real de la puerta
    estadoRealContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        marginBottom: 30,
        width: '100%',
        justifyContent: 'center',
    },
    estadoAbierto: {
        backgroundColor: '#FFEBEE',
    },
    estadoCerrado: {
        backgroundColor: '#E8F5E9',
    },
    estadoDesconocido: {
        backgroundColor: '#EEEEEE',
    },
    indicadorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    dotAbierto: {
        backgroundColor: '#D32F2F',
    },
    dotCerrado: {
        backgroundColor: '#2E7D32',
    },
    dotDesconocido: {
        backgroundColor: '#9E9E9E',
    },
    textoEstadoReal: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    // Resto de estilos existentes
    bottomButtons: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        width: '100%',
        marginBottom: 20,
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
    usersButton: {
        backgroundColor: '#007BFF',
        borderRadius: 15,
        paddingVertical: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    usersButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    buttonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});