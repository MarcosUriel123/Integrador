import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextStyle,
    KeyboardType
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Tipos de input soportados
type InputType = 'telefono' | 'nombre' | 'correo' | 'contrasenna' | 'texto';

interface InputProps {
    value: string;
    onChangeText: (text: string) => void;
    tipo: InputType;
    placeholder?: string;
    label?: string;
    errorMessage?: string;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    showValidation?: boolean;
    onValidationChange?: (isValid: boolean) => void;
    maxLength?: number;
}

interface ValidationState {
    isValid: boolean;
    messages: { text: string; isValid: boolean }[];
}

export default function InputApp({
    value,
    onChangeText,
    tipo,
    placeholder = '',
    label = '',
    errorMessage,
    containerStyle,
    inputStyle,
    showValidation = true,
    onValidationChange,
    maxLength
}: InputProps) {
    const [visible, setVisible] = useState(false);
    const [validationState, setValidationState] = useState<ValidationState>({
        isValid: false,
        messages: []
    });

    // Configurar placeholder y label por defecto según el tipo
    useEffect(() => {
        if (!placeholder) {
            switch (tipo) {
                case 'telefono':
                    placeholder = 'Ingresa tu número de teléfono';
                    break;
                case 'nombre':
                    placeholder = 'Ingresa tu nombre';
                    break;
                case 'correo':
                    placeholder = 'Ingresa tu correo electrónico';
                    break;
                case 'contrasenna':
                    placeholder = 'Ingresa tu contraseña';
                    break;
                default:
                    placeholder = 'Ingresa texto';
            }
        }

        if (!label) {
            switch (tipo) {
                case 'telefono':
                    label = 'Teléfono';
                    break;
                case 'nombre':
                    label = 'Nombre';
                    break;
                case 'correo':
                    label = 'Correo electrónico';
                    break;
                case 'contrasenna':
                    label = 'Contraseña';
                    break;
                default:
                    label = 'Texto';
            }
        }
    }, [tipo]);

    // Determinar el tipo de teclado según el tipo de input
    const getKeyboardType = (): KeyboardType => {
        switch (tipo) {
            case 'telefono':
                return 'phone-pad';
            case 'correo':
                return 'email-address';
            case 'contrasenna':
                return 'default';
            default:
                return 'default';
        }
    };

    // Función para validar según el tipo - MODIFICADA PARA CORREO
    const validateInput = (text: string) => {
        let messages: { text: string; isValid: boolean }[] = [];
        let isValid = false;

        switch (tipo) {
            case 'telefono':
                // Validación de teléfono sin cambios
                const isOnlyNumbers = /^\d+$/.test(text);
                const isCorrectLength = text.length === 10;

                messages = [
                    { text: 'Debe contener solo números', isValid: isOnlyNumbers },
                    { text: 'Debe tener exactamente 10 dígitos', isValid: isCorrectLength }
                ];

                isValid = isOnlyNumbers && isCorrectLength;
                break;

            case 'nombre':
                // Validación de nombre sin cambios
                const hasOnlyLetters = /^[a-zA-Z\s]+$/.test(text);
                const isUnderMaxLength = text.length <= (maxLength || 20);

                messages = [
                    { text: 'Solo debe contener letras', isValid: hasOnlyLetters },
                    { text: `Máximo ${maxLength || 20} caracteres`, isValid: isUnderMaxLength }
                ];

                isValid = hasOnlyLetters && isUnderMaxLength;
                break;

            case 'correo':
                // MODIFICACIÓN: Una única validación integral para correo
                // La expresión regular verifica:
                // - Que tenga texto antes del @
                // - Que tenga un @ en medio
                // - Que tenga texto después del @
                // - Que termine en .com
                const isValidEmail = /^[^\s@]+@[^\s@]+\.com$/i.test(text);

                messages = [
                    { text: 'Debe ser un correo válido', isValid: isValidEmail }
                ];

                isValid = isValidEmail;
                break;

            case 'contrasenna':
                // Validación de contraseña sin cambios
                const hasMinLength = text.length >= 8;
                const hasLowerCase = /[a-z]/.test(text);
                const hasUpperCase = /[A-Z]/.test(text);
                const hasNumber = /\d/.test(text);
                const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(text);

                messages = [
                    { text: 'Al menos 8 caracteres', isValid: hasMinLength },
                    { text: 'Una letra minúscula', isValid: hasLowerCase },
                    { text: 'Una letra mayúscula', isValid: hasUpperCase },
                    { text: 'Un número', isValid: hasNumber },
                    { text: 'Un caracter especial', isValid: hasSpecialChar }
                ];

                isValid = hasMinLength && hasLowerCase && hasUpperCase && hasNumber && hasSpecialChar;
                break;

            default:
                isValid = true;
                break;
        }

        setValidationState({ isValid, messages });

        if (onValidationChange) {
            onValidationChange(isValid);
        }
    };

    // Validar cada vez que cambia el valor
    useEffect(() => {
        validateInput(value);
    }, [value]);

    const toggleVisibility = () => {
        setVisible(!visible);
    };

    // Renderiza cada elemento de validación
    const renderValidationItem = (item: { text: string; isValid: boolean }, index: number) => {
        return (
            <View key={index} style={styles.validationItem}>
                <Feather
                    name={item.isValid ? 'check-circle' : 'circle'}
                    size={16}
                    color={item.isValid ? '#4CAF50' : '#9E9E9E'}
                />
                <Text
                    style={[
                        styles.validationText,
                        item.isValid ? styles.validText : styles.invalidText
                    ]}
                >
                    {item.text}
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, inputStyle]}
                    placeholder={placeholder}
                    secureTextEntry={tipo === 'contrasenna' && !visible}
                    value={value}
                    onChangeText={(text) => {
                        // Aplicar filtros según el tipo
                        let filteredText = text;

                        if (tipo === 'telefono') {
                            // Solo permitir números para teléfono
                            filteredText = text.replace(/[^0-9]/g, '');
                        } else if (tipo === 'nombre') {
                            // Solo permitir letras y espacios para nombres
                            filteredText = text.replace(/[^a-zA-Z\s]/g, '');
                        }

                        onChangeText(filteredText);
                    }}
                    keyboardType={getKeyboardType()}
                    autoCapitalize={tipo === 'correo' ? 'none' : 'sentences'}
                    maxLength={tipo === 'telefono' ? 10 : (maxLength || undefined)}
                />

                {tipo === 'contrasenna' && (
                    <TouchableOpacity
                        style={styles.visibilityToggle}
                        onPress={toggleVisibility}
                    >
                        <Feather
                            name={visible ? 'eye-off' : 'eye'}
                            size={24}
                            color="#007bff"
                        />
                    </TouchableOpacity>
                )}
            </View>

            {errorMessage ? (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}

            {showValidation && value.length > 0 && validationState.messages.length > 0 && (
                <View style={styles.validationContainer}>
                    {validationState.messages.map(renderValidationItem)}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '500',
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        backgroundColor: 'white',
    },
    input: {
        flex: 1,
        height: 45,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    visibilityToggle: {
        padding: 10,
    },
    errorMessage: {
        color: 'red',
        marginTop: 5,
        fontSize: 14,
    },
    validationContainer: {
        marginTop: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 5,
        padding: 10,
    },
    validationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    validationText: {
        marginLeft: 8,
        fontSize: 14,
    },
    validText: {
        color: '#4CAF50',
    },
    invalidText: {
        color: '#9E9E9E',
    },
});