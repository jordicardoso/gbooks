<!-- src/components/AddAssetDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="closeDialog"
    persistent
    @hide="resetForm"
  >
    <q-card class="bg-grey-9 text-white" style="width: 500px; max-width: 90vw">
      <q-form @submit.prevent="onSubmit" ref="formRef">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ $t('addAssetDialog.title') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeDialog" />
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <!-- Campo para el fichero -->
          <q-file
            v-model="file"
            :label="$t('addAssetDialog.fileLabel')"
            dark
            standout="bg-grey-8"
            accept="image/*"
            :rules="[(val) => !!val || $t('addAssetDialog.fileRequired')]"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>

          <!-- Campo para el nombre del asset -->
          <q-input
            v-model="assetName"
            :label="$t('addAssetDialog.nameLabel')"
            dark
            standout="bg-grey-8"
            :rules="[(val) => (val && val.length > 0) || $t('addAssetDialog.nameRequired')]"
            lazy-rules
          />

          <!-- [NUEVO] Campo para la categoría ahora es un q-select -->
          <q-select
            v-model="assetCategory"
            :options="categoryOptions"
            :label="$t('addAssetDialog.categoryLabel')"
            dark
            dense
            standout="bg-grey-8"
            :rules="[(val) => !!val || $t('addAssetDialog.categoryRequired')]"
            lazy-rules
          />
        </q-card-section>

        <q-separator dark />

        <q-card-actions align="right">
          <q-btn flat :label="$t('addAssetDialog.cancelButton')" @click="closeDialog" />
          <q-btn color="primary" :label="$t('addAssetDialog.submitButton')" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { QForm } from 'quasar';

// Props y Emits
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue', 'submit']);

// Referencias del formulario
const formRef = ref<QForm | null>(null);
const file = ref<File | null>(null);
const assetName = ref('');
const assetCategory = ref('');

// [NUEVO] Opciones fijas para la categoría
const categoryOptions = ['General', 'Personaje', 'Mapa', 'Objecto'];

const closeDialog = () => {
  emit('update:modelValue', false);
};

const resetForm = () => {
  file.value = null;
  assetName.value = '';
  assetCategory.value = '';
  formRef.value?.resetValidation();
};

const onSubmit = () => {
  if (file.value && assetName.value && assetCategory.value) {
    emit('submit', {
      file: file.value,
      name: assetName.value,
      category: assetCategory.value,
    });
  }
};
</script>
