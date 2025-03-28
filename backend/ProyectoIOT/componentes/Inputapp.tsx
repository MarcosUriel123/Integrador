import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextStyle
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PasswordInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    label?: string;
    errorMessage?: string;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    showValidation?: boolean;
    onValidationChange?: (isValid: boolean) => void;
}

interface ValidationState {
    minLength: boolean;
    hasLowerCase: boolean;
    hasUpperCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
}

export default function PasswordInput({
    value,
    onChangeText,
    placeholder = 'Ingresa tu contraseña',
    label = 'Contraseña',
    errorMessage,
    containerStyle,
    inputStyle,
    showValidation = true,
    onValidationChange
}: PasswordInputProps) {
    const [visible, setVisible] = useState(false);
    const [validations, setValidations] = useState<ValidationState>({
        minLength: false,
        hasLowerCase: false,
        hasUpperCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });

    // Función para validar la contraseña
    const validatePassword = (password: string) => {
        const newValidations = {
            minLength: password.length >= 8,
            hasLowerCase: /[a-z]/.test(password),
            hasUpperCase: /[A-Z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        setValidations(newValidations);

        // Verificar si todas las validaciones son verdaderas
        const isValid = Object.values(newValidations).every(v => v);
        if (onValidationChange) {
            onValidationChange(isValid);
        }
    };

    // Validar la contraseña cada vez que cambia
    useEffect(() => {
        validatePassword(value);
    }, [value]);

    const toggleVisibility = () => {
        setVisible(!visible);
    };

    // Función para renderizar cada criterio de validación
    const renderValidationItem = (
        key: keyof ValidationState,
        text: string
    ) => {
        const isValid = validations[key];
        return (
            <View style={styles.validationItem}>
                <Feather
                    name={isValid ? 'check-circle' : 'circle'}
                    size={16}
                    color={isValid ? '#4CAF50' : '#9E9E9E'}
                />
                <Text
                    style={[
                        styles.validationText,
                        isValid ? styles.validText : styles.invalidText
                    ]}
                >
                    {text}
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
                    secureTextEntry={!visible}
                    value={value}
                    onChangeText={(text) => {
                        onChangeText(text);
                    }}
                    autoCapitalize="none"
                />
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
            </View>

            {errorMessage ? (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}

            {showValidation && value.length > 0 && (
                <View style={styles.validationContainer}>
                    {renderValidationItem('minLength', 'Al menos 8 caracteres')}
                    {renderValidationItem('hasLowerCase', 'Una letra minúscula')}
                    {renderValidationItem('hasUpperCase', 'Una letra mayúscula')}
                    {renderValidationItem('hasNumber', 'Un número')}
                    {renderValidationItem('hasSpecialChar', 'Un caracter especial')}
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
        alignSelf: 'flex-start',
        fontSize: 16,
        marginBottom: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
    },
    input: {
        flex: 1,
        height: 40,
        paddingHorizontal: 10,
    },
    visibilityToggle: {
        padding: 10,
    },
    errorMessage: {
        color: 'red',
        marginTop: 5,
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