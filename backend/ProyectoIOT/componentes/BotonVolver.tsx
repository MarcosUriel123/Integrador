import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BotonVolverProps {
    // Destino al que navegar, si se omite usa router.back()
    destino?: string;
    // Si se muestra el texto "Volver" junto al ícono
    mostrarTexto?: boolean;
    // Estilo adicional personalizado
    estiloAdicional?: object;
    // Estilo para el contenedor
    estiloContenedor?: object;
}

export default function BotonVolver({
    destino,
    mostrarTexto = true,
    estiloAdicional,
    estiloContenedor
}: BotonVolverProps) {
    const router = useRouter();

    const handlePress = () => {
        if (destino) {
            router.push(destino as any);
        } else {
            router.back();
        }
    };

    return (
        <View style={[styles.contenedor, estiloContenedor]}>
            <TouchableOpacity
                style={[styles.botonVolver, estiloAdicional]}
                onPress={handlePress}
            >
                <Feather name="arrow-left" size={24} color="#007bff" />
                {mostrarTexto && (
                    <Text style={styles.textoVolver}>Volver</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'transparent',
        marginTop: 10,
    },
    botonVolver: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        width: 'auto',
        alignSelf: 'flex-start',
    },
    textoVolver: {
        marginLeft: 5,
        fontSize: 16,
        color: '#007bff',
        fontWeight: '500',
    }
});