import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const verifyToken = async (): Promise<boolean> => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return false;

        const response = await axios.post('http://192.168.1.133:8082/api/users/verify-token', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.status === 200;
    } catch (error) {
        console.log('Token inválido o expirado:', error);
        // Limpiar datos de sesión si el token no es válido
        await AsyncStorage.multiRemove(['userToken', 'userId', 'user']);
        return false;
    }
};

export const logout = async (): Promise<void> => {
    try {
        // Obtener el token
        const token = await AsyncStorage.getItem('userToken');

        if (token) {
            try {
                // Llamar al endpoint de logout para invalidar el token en el servidor
                await axios.post('http://192.168.1.133:8082/api/users/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Token invalidado en el servidor');
            } catch (apiError) {
                console.error('Error al invalidar token en el servidor:', apiError);
                // Continuamos con la limpieza local aunque falle la API
            }
        }

        // Limpiar datos de sesión localmente
        await AsyncStorage.multiRemove(['userToken', 'userId', 'user', 'redirectAfterLogin']);

        console.log('Datos de sesión eliminados localmente');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        throw error;
    }
};

// Otras funciones de utilidad que puedes necesitar
export const isAuthenticated = async (): Promise<boolean> => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        return !!token; // Devuelve true si hay token, false si no
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        return false;
    }
};