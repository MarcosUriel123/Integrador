/**
 * Sistema simple de lista negra de tokens para invalidar sesiones
 * En producción, esto debería almacenarse en una base de datos o Redis
 */

// Almacén para tokens invalidados
let tokenBlacklist: Set<string> = new Set();

/**
 * Agrega un token a la lista negra
 * @param token Token JWT a invalidar
 */
export const blacklistToken = (token: string) => {
    console.log(`Token agregado a la lista negra: ${token.substring(0, 10)}...`);
    tokenBlacklist.add(token);
};

/**
 * Verifica si un token está en la lista negra
 * @param token Token JWT a verificar
 * @returns true si el token está invalidado, false si es válido
 */
export const isTokenBlacklisted = (token: string) => {
    return tokenBlacklist.has(token);
};

/**
 * Limpia la lista negra (útil para pruebas)
 */
export const clearBlacklist = () => {
    tokenBlacklist.clear();
    console.log('Lista negra de tokens limpiada');
};

/**
 * Obtiene el tamaño actual de la lista negra (para depuración)
 */
export const getBlacklistSize = () => {
    return tokenBlacklist.size;
};

// Si necesitas persistencia o una solución más robusta, considera:
// 1. Usar Redis para almacenamiento (mejor rendimiento)
// 2. Usar MongoDB para almacenamiento (más simple con tu stack actual)
// 3. Implementar limpieza de tokens expirados para evitar fugas de memoria