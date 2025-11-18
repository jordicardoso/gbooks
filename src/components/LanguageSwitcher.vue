<!-- src/components/LanguageSwitcher.vue -->
<template>
  <q-select
    v-model="locale"
    :options="languageOptions"
    dense
    borderless
    emit-value
    map-options
    options-dense
    dark
    style="min-width: 130px"
    class="q-ml-md"
  >
    <template #prepend>
      <q-icon name="language" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { watch } from 'vue';

// Usamos 'useScope: global' para asegurarnos de que estamos cambiando el idioma de toda la app
const { locale } = useI18n({ useScope: 'global' });

// Opciones de idioma disponibles
const languageOptions = [
  { value: 'es-ES', label: 'Español' },
  { value: 'ca-ES', label: 'Català' },
  { value: 'en-US', label: 'English' },
  { value: 'ru-RU', label: 'Русский' },
];

// Observamos cambios en la variable 'locale'
watch(locale, (newLocale) => {
  // Guardamos el nuevo idioma en el localStorage para que se recuerde
  // en futuras visitas.
  localStorage.setItem('user-locale', newLocale);
  console.log(`Idioma cambiado a: ${newLocale}`);
});
</script>

<style scoped>
/* Ajustes para que el selector se vea bien en la barra de herramientas */
.q-select {
  color: white;
}
</style>
