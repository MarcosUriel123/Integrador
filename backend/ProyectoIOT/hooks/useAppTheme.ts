import { useTheme } from '../context/ThemeContext';
import { getColors, createBaseStyles, ThemeColors } from '../styles/theme';

export const useAppTheme = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const colors = getColors(isDarkMode);
    const styles = createBaseStyles(colors);

    return {
        isDarkMode,
        toggleTheme,
        colors,
        styles,
    };
};