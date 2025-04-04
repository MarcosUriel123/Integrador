import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function TabBar() {
    const router = useRouter();
    const pathname = usePathname();
    // Usar el contexto de tema en lugar de useColorScheme
    const { isDarkMode } = useTheme();

    const tabs = [
        { name: 'Tienda', icon: 'home-outline', route: '/' },
        { name: 'Carrito', icon: 'cart-outline', route: '/carrito' },
        { name: 'Perfil', icon: 'person-outline', route: '/Datosperfil' },
        { name: 'Menú', icon: 'menu-outline', route: '/menu' },
    ];

    const isActive = (route: string) => {
        if (route === '/' && (pathname === '/' || pathname === '/index' || pathname === '/(tabs)' || pathname === '/(tabs)/index'))
            return true;
        if (route === '/carrito' && pathname.includes('carrito')) return true;
        if (route === '/Datosperfil' && pathname.includes('perfil')) return true;
        if (route === '/menu' && pathname.includes('menu')) return true;
        return pathname === route;
    };

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
                borderTopColor: isDarkMode ? '#30363d' : '#d0d7de',
            }
        ]}>
            {tabs.map((tab) => {
                const active = isActive(tab.route);

                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={styles.tab}
                        onPress={() => router.push(tab.route as any)}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={30}
                            color={active
                                ? (isDarkMode ? '#58a6ff' : '#0969da')
                                : (isDarkMode ? '#8b949e' : '#57606a')
                            }
                        />
                        {/* <Text
                            style={[
                                styles.tabText,
                                {
                                    color: active
                                        ? (isDarkMode ? '#58a6ff' : '#0969da')
                                        : (isDarkMode ? '#8b949e' : '#57606a')
                                }
                            ]}
                        >
                            {tab.name}
                        </Text> */}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 70,
        // borderTopWidth: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabText: {
        fontSize: 15,
        marginTop: 6,
        fontWeight: 'bold',

    },
});