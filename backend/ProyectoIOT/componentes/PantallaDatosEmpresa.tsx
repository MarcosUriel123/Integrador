import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function PantallaDatosEmpresa() {
    const router = useRouter();
    const API_BASE = 'http://192.168.8.6:8082/api'; //(IPCONFIG)

    // Estado para almacenar los datos del formulario
    const [formData, setFormData] = useState({
        empresa: { ubicacion: '', telefono: '' },
        pregunta: { pregunta: '', respuesta: '' },
        mision: '',
        vision: '',
        valor: '',
        politica: ''
    });

    // Estados para almacenar los datos listados desde la base de datos
    const [empresaData, setEmpresaData] = useState<any>(null);
    const [preguntasList, setPreguntasList] = useState<any[]>([]);
    const [misionsList, setMisionsList] = useState<any[]>([]);
    const [visionsList, setVisionsList] = useState<any[]>([]);
    const [valoresList, setValoresList] = useState<any[]>([]);
    const [politicasList, setPoliticasList] = useState<any[]>([]);

    // useEffect para obtener los datos al montar el componente
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    empresaRes,
                    preguntasRes,
                    misionesRes,
                    visionesRes,
                    valoresRes,
                    politicasRes
                ] = await Promise.all([
                    axios.get<any>(`${API_BASE}/empresa`),
                    axios.get<any[]>(`${API_BASE}/empresa/preguntas`),
                    axios.get<any[]>(`${API_BASE}/empresa/misiones`),
                    axios.get<any[]>(`${API_BASE}/empresa/visiones`),
                    axios.get<any[]>(`${API_BASE}/empresa/valores`),
                    axios.get<any[]>(`${API_BASE}/empresa/politicas`)
                ]);
                setEmpresaData(empresaRes.data);
                setPreguntasList(preguntasRes.data);
                setMisionsList(misionesRes.data);
                setVisionsList(visionesRes.data);
                setValoresList(valoresRes.data);
                setPoliticasList(politicasRes.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async () => {
        try {
            // Actualiza los datos de la empresa
            await axios.put(`${API_BASE}/empresa/actualizar-todos`, formData.empresa);

            // Crea o actualiza los demás elementos (pregunta, misión, visión, valores y políticas)
            await Promise.all([
                formData.pregunta.pregunta && axios.post(`${API_BASE}/empresa/preguntas`, formData.pregunta),
                formData.mision && axios.post(`${API_BASE}/empresa/misiones`, { contenido: formData.mision }),
                formData.vision && axios.post(`${API_BASE}/empresa/visiones`, { contenido: formData.vision }),
                formData.valor && axios.post(`${API_BASE}/empresa/valores`, { contenido: formData.valor }),
                formData.politica && axios.post(`${API_BASE}/empresa/politicas`, { descripcion: formData.politica })
            ]);

            router.push('/AggDatosEmp'); // Redirige a la pantalla de configuración
        } catch (error) {
            console.error('Error guardando datos:', error);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.cardContainer}>
                    <Text style={styles.title}>Configuración Empresarial</Text>

                    {/* Sección Datos de la Empresa */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Datos Generales</Text>
                        <TextInput
                            placeholder="Ubicación"
                            value={formData.empresa.ubicacion}
                            onChangeText={t => setFormData(prev => ({
                                ...prev,
                                empresa: { ...prev.empresa, ubicacion: t }
                            }))}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Teléfono"
                            value={formData.empresa.telefono}
                            onChangeText={t => setFormData(prev => ({
                                ...prev,
                                empresa: { ...prev.empresa, telefono: t }
                            }))}
                            style={styles.input}
                            keyboardType="phone-pad"
                        />
                    </View>
                    {/* Listado de Datos de la Empresa */}
                    {empresaData && (
                        <View style={styles.listContainer}>
                            <Text style={styles.listTitle}>Datos de la Empresa:</Text>
                            <Text>Ubicación: {empresaData.ubicacion}</Text>
                            <Text>Teléfono: {empresaData.telefono}</Text>
                        </View>
                    )}

                    {/* Sección Preguntas Frecuentes */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Nueva Pregunta</Text>
                        <TextInput
                            placeholder="Pregunta"
                            value={formData.pregunta.pregunta}
                            onChangeText={t => setFormData(prev => ({
                                ...prev,
                                pregunta: { ...prev.pregunta, pregunta: t }
                            }))}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Respuesta"
                            value={formData.pregunta.respuesta}
                            onChangeText={t => setFormData(prev => ({
                                ...prev,
                                pregunta: { ...prev.pregunta, respuesta: t }
                            }))}
                            style={styles.input}
                        />
                    </View>
                    {/* Listado de Preguntas Frecuentes */}
                    {preguntasList.length > 0 && (
                        <View style={styles.listContainer}>
                            <Text style={styles.listTitle}>Preguntas Frecuentes:</Text>
                            {preguntasList.map(item => (
                                <View key={item._id} style={styles.listItem}>
                                    <Text>Pregunta: {item.pregunta}</Text>
                                    <Text>Respuesta: {item.respuesta}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Sección Misión */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Misión</Text>
                        <TextInput
                            placeholder="Ingrese la misión de la empresa"
                            value={formData.mision}
                            onChangeText={t => setFormData(prev => ({
                                ...prev,
                                mision: t
                            }))}
                            style={styles.input}
                            multiline
                        />
                    </View>
                    {/* Listado de Misiones */}
                    {misionsList.length > 0 && (
                        <View style={styles.listContainer}>
                            <Text style={styles.listTitle}>Misiones:</Text>
                            {misionsList.map(item => (
                                <View key={item._id} style={styles.listItem}>
                                    <Text>{item.contenido}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Sección Visión */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Visión</Text>
                        <TextInput
                            placeholder="Ingrese la visión de la empresa"
                            value={formData.vision}
                            onChangeText={t => setFormData(prev => ({
                                ...prev,
                                vision: t
                            }))}
                            style={styles.input}
                            multiline
                        />
                    </View>
                    {/* Listado de Visiones */}
                    {visionsList.length > 0 && (
                        <View style={styles.listContainer}>
                            <Text style={styles.listTitle}>Visiones:</Text>
                            {visionsList.map(item => (
                                <View key={item._id} style={styles.listItem}>
                                    <Text>{item.contenido}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Sección Valores */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Valores</Text>
                        <TextInput
                            placeholder="Ingrese los valores de la empresa"
                            value={formData.valor}
                            onChangeText={t => setFormData(prev => ({
                                ...prev,
                                valor: t
                            }))}
                            style={styles.input}
                            multiline
                        />
                    </View>
                    {/* Listado de Valores */}
                    {valoresList.length > 0 && (
                        <View style={styles.listContainer}>
                            <Text style={styles.listTitle}>Valores:</Text>
                            {valoresList.map(item => (
                                <View key={item._id} style={styles.listItem}>
                                    <Text>{item.contenido}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Sección Políticas */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Políticas</Text>
                        <TextInput
                            placeholder="Ingrese las políticas de la empresa"
                            value={formData.politica}
                            onChangeText={t => setFormData(prev => ({
                                ...prev,
                                politica: t
                            }))}
                            style={styles.input}
                            multiline
                        />
                    </View>
                    {/* Listado de Políticas */}
                    {politicasList.length > 0 && (
                        <View style={styles.listContainer}>
                            <Text style={styles.listTitle}>Políticas:</Text>
                            {politicasList.map(item => (
                                <View key={item._id} style={styles.listItem}>
                                    <Text>{item.descripcion}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity onPress={handleSubmit} style={styles.button}>
                        <Text style={styles.buttonText}>Guardar Cambios</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    input: {
        width: '100%',
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    button: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    listContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#e9ecef',
        borderRadius: 5,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    listItem: {
        marginBottom: 5,
    },
});
