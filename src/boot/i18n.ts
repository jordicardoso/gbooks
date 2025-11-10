// src/boot/i18n.ts

import { createI18n } from 'vue-i18n';
import { boot } from 'quasar/wrappers';

import messages from 'src/i18n';

// --- INICIO DE LA MEJORA ---
// Función para obtener el idioma guardado o el por defecto
function getStartingLocale() {
  const savedLocale = localStorage.getItem('user-locale');
  // Comprobamos si el idioma guardado es uno de los que soportamos
  if (savedLocale && Object.keys(messages).includes(savedLocale)) {
    return savedLocale;
  }
  return 'es-ES'; // Idioma por defecto si no hay nada guardado o no es válido
}
// --- FIN DE LA MEJORA ---

const i18n = createI18n({
  locale: getStartingLocale(), // Usamos la nueva función aquí
  fallbackLocale: 'en-US',
  legacy: false,
  globalInjection: true,
  messages,
});

export default boot(({ app }) => {
  app.use(i18n);
});

export { i18n };
