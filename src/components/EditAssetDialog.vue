<!-- src/components/EditAssetDialog.vue -->
<template>
  <q-dialog :model-value="modelValue" @update:model-value="closeDialog" persistent>
    <q-card class="bg-grey-9 text-white" style="width: 500px; max-width: 90vw;">
      <q-form @submit="onSubmit">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Editar Asset</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeDialog" />
        </q-card-section>

        <q-card-section>
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
          <q-btn color="primary" label="Guardar Cambios" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { Asset } from 'src/stores/assets-store';

// Props y Emits para la comunicación con el padre
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  asset: {
    type: Object as PropType<Asset | null>,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue', 'submit']);

// Estado del formulario
const assetName = ref('');
const assetCategory = ref('');

// Observador para rellenar el formulario cuando el asset cambie
watch(() => props.asset, (newAsset) => {
  if (newAsset) {
    assetName.value = newAsset.name;
    assetCategory.value = newAsset.category;
  }
}, { immediate: true }); // `immediate` para que se ejecute al montar

const closeDialog = () => {
  emit('update:modelValue', false);
};

const onSubmit = () => {
  if (!props.asset) return;

  // Emitimos los datos actualizados al componente padre
  emit('submit', {
    id: props.asset.id, // Pasamos el ID para saber qué asset actualizar
    name: assetName.value,
    category: assetCategory.value,
  });
};
</script>
