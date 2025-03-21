import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Entypo } from '@expo/vector-icons';
import axios from 'axios';

// Interfaz para las FAQs
interface FAQ {
    _id: string;
    pregunta: string;
    respuesta: string;
}

export default function PantallaPrincipal() {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loadingFaqs, setLoadingFaqs] = useState(true);
    const [error, setError] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    // Cargar preguntas frecuentes al montar el componente
    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                setLoadingFaqs(true);
                const response = await axios.get<FAQ[]>('http://localhost:8082/api/preguntasFrecuentes');
                setFaqs(response.data);
                setError('');
            } catch (err) {
                console.error('Error al cargar preguntas frecuentes:', err);
                setError('No se pudieron cargar las preguntas frecuentes');
                // Usar algunos datos de respaldo en caso de error
                setFaqs([
                    { _id: '1', pregunta: '¿Para qué sirve Segurix?', respuesta: 'Segurix es una plataforma para gestionar y controlar dispositivos IoT de seguridad.' },
                    { _id: '2', pregunta: '¿Cómo conectar mi dispositivo IoT?', respuesta: 'Ve a la sección de dispositivos y sigue las instrucciones de configuración.' }
                ]);
            } finally {
                setLoadingFaqs(false);
            }
        };

        fetchFAQs();
    }, []);

    // Función para alternar la visibilidad de la respuesta
    const toggleFaqExpansion = (id: string) => {
        if (expandedFaq === id) {
            setExpandedFaq(null);
        } else {
            setExpandedFaq(id);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.cardContainer}>

                    {/* Barra Superior */}
                    <View style={styles.topBar}>
                        <Text style={styles.logo}>Segurix</Text>

                        {/* Menú Desplegable */}
                        <TouchableOpacity onPress={() => setMenuVisible(true)}>
                            <Entypo name="menu" size={28} color="#1E1E1E" />
                        </TouchableOpacity>
                    </View>

                    {/* Modal para el Menú */}
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
                                <TouchableOpacity onPress={() => { router.push('/Datosperfil'); setMenuVisible(false); }}>
                                    <Text style={styles.modalText}>Perfil</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { router.push('/registroUsuarios'); setMenuVisible(false); }}>
                                    <Text style={styles.modalText}>Gestión de Usuarios</Text>
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
                                <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
                                    <Text style={styles.closeButtonText}>Cerrar</Text>
                                </TouchableOpacity>

                            </View>
                        </View>
                    </Modal>

                    {/* Sección Hero */}
                    <View style={styles.heroSection}>
                        <Image
                            source={require('../assets/images/puertaIOT-pantallaPrincipal.jpg')}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                        <Text style={styles.heroTitle}>Bienvenido a Segurix</Text>
                        <Text style={styles.heroSubtitle}>
                            La solución inteligente para controlar y asegurar tus dispositivos IoT.
                        </Text>
                    </View>

                    {/* Sección de Preguntas Frecuentes */}
                    <View style={styles.faqSection}>
                        <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>

                        {loadingFaqs ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#007bff" />
                                <Text style={styles.loadingText}>Cargando preguntas...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : (
                            faqs.map((faq) => (
                                <View key={faq._id} style={styles.faqItem}>
                                    <TouchableOpacity
                                        style={styles.faqQuestion}
                                        onPress={() => toggleFaqExpansion(faq._id)}
                                    >
                                        <Text style={styles.faqQuestionText}>{faq.pregunta}</Text>
                                        <Entypo
                                            name={expandedFaq === faq._id ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color="#1E1E1E"
                                        />
                                    </TouchableOpacity>

                                    {expandedFaq === faq._id && (
                                        <View style={styles.faqAnswer}>
                                            <Text style={styles.faqAnswerText}>{faq.respuesta}</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>

                    {/* Footer */}
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
    /* Sección Hero */
    heroSection: {
        marginTop: 10,
        alignItems: 'center',
    },
    heroImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E1E1E',
        marginTop: 15,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#2C2C2C',
        marginTop: 8,
        textAlign: 'center',
        marginBottom: 10,
    },
    /* Menú Modal */
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
    /* Sección Preguntas Frecuentes */
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1E1E1E',
    },
    faqSection: {
        marginTop: 30,
    },
    faqItem: {
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        marginBottom: 10,
        overflow: 'hidden',
    },
    faqQuestion: {
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E1E1E',
        flex: 1,
    },
    faqAnswer: {
        backgroundColor: '#F0F0F0',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    faqAnswerText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        padding: 20,
        backgroundColor: '#ffebee',
        borderRadius: 8,
    },
    errorText: {
        color: '#c62828',
        textAlign: 'center',
    },

    /* Footer */
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