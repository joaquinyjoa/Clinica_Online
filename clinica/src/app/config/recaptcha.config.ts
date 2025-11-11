// Configuración de reCAPTCHA para la aplicación
export const RECAPTCHA_CONFIG = {
  // Clave pública de prueba de Google (funciona en localhost)
  // En producción, reemplazar con tu clave real de Google reCAPTCHA
  siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Clave de prueba de Google
  
  // Configuración adicional
  size: 'normal' as const, // 'normal', 'compact', 'invisible'
  theme: 'light' as const,  // 'light', 'dark'
  type: 'image' as const,   // 'image', 'audio'
};

// NOTA IMPORTANTE:
// La clave '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' es una clave de PRUEBA
// proporcionada por Google que SIEMPRE retorna éxito.
// 
// Para producción:
// 1. Ir a https://www.google.com/recaptcha/admin
// 2. Crear un nuevo sitio
// 3. Elegir reCAPTCHA v2 ("I'm not a robot" Checkbox)
// 4. Agregar tus dominios (ej: localhost, tu-dominio.com)
// 5. Reemplazar la clave arriba con tu clave real
// 6. Implementar verificación en el backend con la clave secreta