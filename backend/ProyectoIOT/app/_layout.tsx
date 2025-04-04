import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, AppState, StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CartProvider } from '../componentes/CartContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext'; // Importar useTheme también
import HeaderBar from '../components/HeaderBar';
import TabBar from '../components/TabBar';
import IPS from '../config/IPS';

// Función para verificar la validez del token
const verifyToken = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return false;

    const response = await axios.post(`${IPS.SERVER_URL}${IPS.API.USER_URL}/verify-token`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.status === 200;
  } catch (error) {
    console.log('Token inválido o expirado');
    await AsyncStorage.multiRemove(['userToken', 'userId', 'user']);
    return false;
  }
};

// Componente interno que usa ThemeContext
const LayoutContent = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const { isDarkMode } = useTheme(); // Ahora es seguro usar useTheme aquí

  useEffect(() => {
    const checkToken = async () => {
      try {
        const isValid = await verifyToken();
        console.log('¿Token válido?', isValid);
        setIsTokenValid(isValid);
      } catch (error) {
        console.error('Error verificando token:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    checkToken();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('App pasó a segundo plano, limpiando sesión...');
      AsyncStorage.removeItem('userToken')
        .then(() => console.log('Token eliminado al cerrar app'))
        .catch(e => console.error('Error al eliminar token:', e));
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isVerifying) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#0d1117' : '#f5f5f5'
      }}>
        <ActivityIndicator size="large" color={isDarkMode ? '#58a6ff' : '#0969da'} />
        <Text style={{
          marginTop: 20,
          fontSize: 16,
          color: isDarkMode ? '#c9d1d9' : '#24292f'
        }}>
          Verificando sesión...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar />
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Rutas existentes */}
          <Stack.Screen name="index" />
          <Stack.Screen name="principal" />
          <Stack.Screen
            name="login"
            options={{
              animation: isTokenValid ? 'slide_from_right' : 'fade'
            }}
          />
          <Stack.Screen name="registro" />
          <Stack.Screen name="Datosperfil" />
          <Stack.Screen name="ActualizarPerfil" />
          <Stack.Screen name="puerta" />
          <Stack.Screen name="empresa" />
          <Stack.Screen name="registroDispositivo" />
          <Stack.Screen name="carrito" />
          <Stack.Screen
            name="seleccionDispositivo"
            options={{
              title: "Seleccionar Dispositivo",
            }}
          />
          <Stack.Screen name="menu" />
          <Stack.Screen name="Login1" />
          <Stack.Screen name="registro1" />
          <Stack.Screen name="registroUsuarios" />
          <Stack.Screen name="registros" />
          <Stack.Screen name="recovery" />
          <Stack.Screen name="mision" />
          <Stack.Screen name="vision" />
          <Stack.Screen name="valores" />
          <Stack.Screen name="politicas" />
        </Stack>
      </View>
      <TabBar />
    </View>
  );
};

// Componente principal que envuelve todo con los providers necesarios
export default function Layout() {
  // Usar el tema del sistema solo para la primera carga
  const colorScheme = useColorScheme();
  const initialIsDark = colorScheme === 'dark';

  return (
    <ThemeProvider>
      <CartProvider>
        <LayoutContent />
      </CartProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 60, // Espacio para el TabBar
  },
});
