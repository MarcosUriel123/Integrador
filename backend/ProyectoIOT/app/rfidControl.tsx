import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function RFIDControlScreen() {
    const [rfidUID, setRfidUID] = useState<string | null>(null);
    const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const ESP32_IP = "http://192.168.8.8"; // Cambia por la IP real de tu ESP32

    const handleScanRFID = async () => {
        setLoading(true);
        setRfidUID(null); // Limpiar el UID anterior
        setAccessGranted(null); // Limpiar el estado de acceso anterior

        try {
            const response = await fetch(`${ESP32_IP}/leerRFID`);
            const text = await response.text();

            if (response.status === 200) {
                setRfidUID(text);
                // Aquí puedes agregar lógica para validar si el UID es permitido
                const isUIDValid = true; // Cambia esto según tu lógica de validación
                setAccessGranted(isUIDValid);

                if (isUIDValid) {
                    Alert.alert("Acceso Concedido", `UID: ${text}`);
                } else {
                    Alert.alert("Acceso Denegado", `UID: ${text} no está autorizado.`);
                }
            } else {
                setRfidUID("No se detectó tarjeta");
                setAccessGranted(false);
                Alert.alert("Error", "No se detectó ninguna tarjeta RFID.");
            }
        } catch (error) {
            console.error("Error al leer RFID:", error);
            setRfidUID("Error de conexión");
            setAccessGranted(false);
            Alert.alert("Error", "No se pudo conectar al servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = () => {
        router.push('/');
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix RFID</Text>
                        <TouchableOpacity onPress={handleReturn}>
                            <Text style={styles.backText}>←</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>Control RFID</Text>

                        {loading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : rfidUID ? (
                            <>
                                <Text style={styles.uidText}>UID: {rfidUID}</Text>
                                {accessGranted ? (
                                    <Text style={styles.accessGranted}>Acceso Concedido</Text>
                                ) : (
                                    <Text style={styles.accessDenied}>Acceso Denegado</Text>
                                )}
                            </>
                        ) : (
                            <Text style={styles.promptText}>Presiona el botón para leer RFID</Text>
                        )}

                        <TouchableOpacity style={styles.scanButton} onPress={handleScanRFID} disabled={loading}>
                            <Text style={styles.scanButtonText}>
                                {loading ? "Leyendo..." : "Leer RFID"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#CFE2FF' },
    scrollContent: { flexGrow: 1, justifyContent: 'center' },
    cardContainer: {
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', marginBottom: 20, paddingBottom: 10 },
    logo: { fontSize: 24, fontWeight: 'bold', color: '#1E1E1E' },
    backText: { fontSize: 24, color: '#1E1E1E' },
    contentContainer: { alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1E1E1E' },
    promptText: { fontSize: 16, color: '#1E1E1E', marginBottom: 20, textAlign: 'center' },
    uidText: { fontSize: 18, color: '#1E1E1E', marginBottom: 10 },
    accessGranted: { fontSize: 20, color: 'green', fontWeight: 'bold', marginBottom: 20 },
    accessDenied: { fontSize: 20, color: 'red', fontWeight: 'bold', marginBottom: 20 },
    scanButton: { backgroundColor: '#1E1E1E', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, marginTop: 10 },
    scanButtonText: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', fontWeight: '600' },
});
