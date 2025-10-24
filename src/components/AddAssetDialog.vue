<!-- src/components/AddAssetDialog.vue -->
<template>
  <q-dialog :model-value="modelValue" @update:model-value="closeDialog" persistent>
    <q-card class="bg-grey-9 text-white" style="width: 500px; max-width: 90vw;">
      <q-form @submit="onSubmit">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Añadir Nuevo Asset</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeDialog" />
        </q-card-section>

        <q-card-section>
          <!-- Campo para seleccionar el archivo -->
          <q-file
            v-model="file"
            label="Seleccionar imagen"
            dark
            standout="bg-grey-8"
            accept="image/*"
            :rules="[val => !!val || 'Debes seleccionar un archivo']"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>

          <!-- Campo para el nombre del asset -->
          <q-input
            v-model="assetName"
            label="Nombre del Asset"
            class="q-mt-md"
            dark
            standout="bg-grey-8"
            :rules="[val => (val && val.length > 0) || 'El nombre es requerido']"
            lazy-rules
          />

          <!-- Campo para la categoría -->
          <q-input
            v-model="assetCategory"
            label="Categoría"
            class="q-mt-md"
            dark
            standout="bg-grey-8"
            :rules="[val => (val && val.length > 0) || 'La categoría es requerida']"
            lazy-rules
            hint="Ej: personaje, mapa, objeto, etc."
          />
        </q-card-section>

        <q-separator dark />

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="closeDialog" />
          <q-btn color="primary" label="Guardar Asset" type="submit" :loading="isSubmitting" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

// Props y Emits para la comunicación con el padre
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue', 'submit']);

// Estado del formulario
const file = ref<File | null>(null);
const assetName = ref('');
const assetCategory = ref('general');
const isSubmitting = ref(false);

// UX: Cuando se selecciona un archivo, rellenamos el nombre automáticamente
watch(file, (newFile) => {
  if (newFile) {
    // Quita la extensión del nombre del archivo
    assetName.value = newFile.name.replace(/\.[^/.]+$/, '');
  }
});

const closeDialog = () => {
  emit('update:modelValue', false);
};

const onSubmit = async () => {
  if (!file.value) return;

  isSubmitting.value = true;
  try {
    // Emitimos los datos al componente padre para que los procese
    emit('submit', {
      file: file.value,
      name: assetName.value,
      category: assetCategory.value,
    });
    // El padre se encargará de cerrar el diálogo si todo va bien
  } finally {
    // En caso de que el padre no cierre el diálogo (por un error),
    // dejamos de mostrar el estado de carga.
    isSubmitting.value = false;
  }
};
</script>
