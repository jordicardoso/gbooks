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
import { watch, computed } from 'vue'; // 1. Importar 'computed'

// 2. Obtener la función de traducción 't'
const { locale, t } = useI18n({ useScope: 'global' });

// 3. Usar una propiedad computada para que las etiquetas se actualicen al cambiar de idioma
const languageOptions = computed(() => [
  { value: 'es-ES', label: t('languages.es') },
  { value: 'ca-ES', label: t('languages.ca') },
  { value: 'en-US', label: t('languages.en') },
  { value: 'ru-RU', label: t('languages.ru') },
]);

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
