import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Entypo } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Header() {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchUserName = async () => {
            const name = await AsyncStorage.getItem('userName');
            if (name) {
                setUserName(name);
            }
        };
        fetchUserName();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userName');
        await AsyncStorage.removeItem('userToken');
        router.push('/Login1');
        setMenuVisible(false);
    };

    return (
        <>
            <View style={styles.topBar}>
                <Text style={styles.logo}>Segurix</Text>
                {userName ? <Text style={styles.userName}>Bienvenido, {userName}</Text> : null}
                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                    <Entypo name="menu" size={28} color="#1E1E1E" />
                </TouchableOpacity>
            </View>

            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setMenuVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Opciones</Text>
                        <TouchableOpacity onPress={() => { router.push('/empresa'); setMenuVisible(false); }}>
                            <Text style={styles.modalText}>Empresa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { router.push('/CatalogoProductosScreen'); setMenuVisible(false); }}>
                            <Text style={styles.modalText}>Productos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { router.push('/huella'); setMenuVisible(false); }}>
                            <Text style={styles.modalText}>Huella</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { router.push('/puerta'); setMenuVisible(false); }}>
                            <Text style={styles.modalText}>Dispositivo IoT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { router.push('/rfidControl'); setMenuVisible(false); }}>
                            <Text style={styles.modalText}>RFID</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { router.push('/perfil'); setMenuVisible(false); }}>
                            <Text style={styles.modalText}>Perfil</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { router.push('/Aggprod'); setMenuVisible(false); }}>
                            <Text style={styles.modalText}>Admin (agg prod)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { router.push('/AggDatosEmp'); setMenuVisible(false); }}>
                            <Text style={styles.modalText}>Admin (datos empresa)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { router.push('/registroDispositivo'); setMenuVisible(false); }}>
                            <Text style={styles.modalText}>Alta del dispositivo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout}>
                            <Text style={styles.modalText}>Cerrar sesión</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
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
    userName: {
        fontSize: 16,
        color: '#1E1E1E',
        marginRight: 10,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 18,
        paddingVertical: 10,
    },
    closeButton: {
        marginTop: 15,
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#FFF',
        fontSize: 16,
    },
});