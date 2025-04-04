import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as NavigationBar from 'expo-navigation-bar';

export default function StatusBarManager() {
    const { isDarkMode } = useTheme();

    useEffect(() => {
        // Configurar barra de estado
        StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');

        // En Android, también podemos establecer el color de fondo
        if (Platform.OS === 'android') {
            StatusBar.setBackgroundColor(isDarkMode ? '#0d1117' : '#ffffff');

            // Configurar la barra de navegación en Android
            configureNavigationBar();
        }
    }, [isDarkMode]);

    // Configurar barra de navegación (solo Android)
    const configureNavigationBar = async () => {
        if (Platform.OS === 'android') {
            try {
                await NavigationBar.setBackgroundColorAsync(isDarkMode ? '#0d1117' : '#ffffff');
                await NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
            } catch (error) {
                console.warn('Error al configurar la barra de navegación:', error);
            }
        }
    };

    return null;
}