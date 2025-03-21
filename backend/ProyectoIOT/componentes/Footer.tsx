import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Footer() {
    return (
        <View style={styles.footer}>
            <View style={styles.footerLeft}>
                <TouchableOpacity onPress={() => console.log('Términos y condiciones')}>
                    <Text style={styles.footerText}>Términos y condiciones</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => console.log('Privacidad')}>
                    <Text style={styles.footerText}>Privacidad</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.footerRight}>
                <Text style={[styles.footerText, styles.footerTitle]}>Contáctanos</Text>
                <Text style={styles.footerText}>Col. Horacio Camargo</Text>
                <Text style={styles.footerText}>segurix@mail.com</Text>
                <Text style={styles.footerText}>+52 774 545 8510</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 10,
    },
    footerLeft: {
        flex: 1,
    },
    footerRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    footerText: {
        fontSize: 14,
        color: '#1E1E1E',
        marginBottom: 4,
    },
    footerTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 8,
    },
});