import { StyleSheet } from 'react-native';

// Tipos para nuestro sistema de temas
export type ThemeColors = {
    background: string;
    card: string;
    text: string;
    secondaryText: string;
    border: string;
    primary: string;
    primaryLight: string;
    error: string;
    errorBg: string;
    success: string;
    input: string;
    divider: string;
};

// Paleta de colores por tema
export const lightColors: ThemeColors = {
    background: '#F7FAFC',
    card: '#FFFFFF',
    text: '#2D3748',
    secondaryText: '#718096',
    border: '#E2E8F0',
    primary: '#3182CE',
    primaryLight: '#EBF8FF',
    error: '#FC8181',
    errorBg: '#FFF5F5',
    success: '#38A169',
    input: '#F7FAFC',
    divider: '#E2E8F0',
};

export const darkColors: ThemeColors = {
    background: '#0d1117',
    card: '#161b22',
    text: '#c9d1d9',
    secondaryText: '#8b949e',
    border: '#30363d',
    primary: '#58a6ff',
    primaryLight: '#1f2937',
    error: '#f85149',
    errorBg: '#3c1618',
    success: '#56d364',
    input: '#21262d',
    divider: '#30363d',
};

// Función para obtener colores según el tema
export const getColors = (isDarkMode: boolean): ThemeColors => {
    return isDarkMode ? darkColors : lightColors;
};

// Estilos base comunes para todas las pantallas
export const createBaseStyles = (colors: ThemeColors) => StyleSheet.create({
    // Contenedores principales
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        padding: 20,
        borderWidth: 0,
    },

    // Contenedores de secciones
    section: {
        backgroundColor: 'transparent',
        marginBottom: 20,
        paddingHorizontal: 0,
    },
    sectionWithBorder: {
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        paddingBottom: 20,
        marginBottom: 20,
    },

    // Textos
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
    },
    normalText: {
        fontSize: 16,
        color: colors.text,
    },
    secondaryText: {
        fontSize: 14,
        color: colors.secondaryText,
    },

    // Elementos de lista
    listItem: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    listItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        marginRight: 12,
    },
    listItemContent: {
        flex: 1,
    },

    // Inputs
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.input,
        color: colors.text,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },

    // Botones
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    dangerButton: {
        backgroundColor: colors.error,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    dangerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // Estados de carga y errores
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        padding: 22,
        borderLeftWidth: 5,
        borderLeftColor: colors.error,
        backgroundColor: colors.errorBg,
        marginVertical: 10,
        alignItems: 'center',
    },

    // Añadir estilos de edición
    editField: {
        marginBottom: 16,
    },
    editLabel: {
        fontSize: 14,
        marginBottom: 4,
        color: colors.secondaryText,
    },
    editInput: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        // Los colores se aplicarán dinámicamente en el componente
    },
});