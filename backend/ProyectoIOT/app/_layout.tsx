import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CartProvider } from '../componentes/CartContext';

// Función para verificar la validez del token
const verifyToken = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return false;

    // Intentar verificar el token con el backend
    const response = await axios.post('http://192.168.8.2:8082/api/users/verify-token', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.status === 200;
  } catch (error) {
    console.log('Token inválido o expirado');
    // Limpiar datos de sesión si el token no es válido
    await AsyncStorage.multiRemove(['userToken', 'userId', 'user']);
    return false;
  }
};

export default function Layout() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    // Verificar el token al cargar la aplicación
    const checkToken = async () => {
      try {
        const isValid = await verifyToken();
        console.log('¿Token válido?', isValid);
        setIsTokenValid(isValid);
      } catch (error) {
        console.error('Error verificando token:', error);
      } finally {
        // Siempre terminar la verificación, independientemente del resultado
        setIsVerifying(false);
      }
    };

    checkToken();
  }, []);

  useEffect(() => {
    // Preparar listener para cambios de estado de la app
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('App pasó a segundo plano, limpiando sesión...');
      // Sin condición - eliminar siempre
      AsyncStorage.removeItem('userToken')
        .then(() => console.log('Token eliminado al cerrar app'))
        .catch(e => console.error('Error al eliminar token:', e));
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Mientras verifica, mostrar una pantalla de carga
  if (isVerifying) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 20, fontSize: 16 }}>Verificando sesión...</Text>
      </View>
    );
  }

  // Una vez verificado, renderizar el stack de navegación
  return (
    <CartProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* La pantalla index ahora redirigirá a principal */}
        <Stack.Screen name="index" />

        {/* Pantalla principal como destino inicial */}
        <Stack.Screen name="principal" />

        {/* Pantallas de autenticación */}
        <Stack.Screen name="login" options={{
          // Podemos usar el estado de token para configurar opciones específicas
          animation: isTokenValid ? 'slide_from_right' : 'fade'
        }} />
        <Stack.Screen name="registro" />

        {/* Pantallas de perfil */}
        <Stack.Screen name="Datosperfil" />
        <Stack.Screen name="ActualizarPerfil" />

        {/* Pantallas existentes */}
        <Stack.Screen name="puerta" />
        <Stack.Screen name="empresa" />

        {/* Otras pantallas de tu aplicación */}
        <Stack.Screen name="registroDispositivo" />
        <Stack.Screen name="carrito" />

        {/* Pantalla de selección de dispositivo */}
        <Stack.Screen
          name="seleccionDispositivo"
          options={{
            title: "Seleccionar Dispositivo",
            headerShown: false
          }}
        />
      </Stack>
    </CartProvider>
  );
}
