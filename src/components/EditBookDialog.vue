<!-- src/components/EditBookDialog.vue -->
<template>
  <q-dialog :model-value="modelValue" @update:model-value="updateModelValue" persistent>
    <q-card style="min-width: 350px" class="bg-grey-9 text-white">
      <q-card-section>
        <div class="text-h6">{{ t('editBookDialog.title') }}</div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit">
        <q-card-section class="q-pt-none">
          <q-input
            dark
            dense
            v-model="name"
            :label="t('editBookDialog.nameLabel')"
            autofocus
            :rules="[(val) => !!val || t('editBookDialog.nameRequired')]"
            lazy-rules
          />
          <q-input
            dark
            dense
            v-model="description"
            :label="t('editBookDialog.descriptionLabel')"
            type="textarea"
            class="q-mt-sm"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat :label="t('editBookDialog.cancelButton')" @click="closeDialog" />
          <q-btn flat :label="t('editBookDialog.submitButton')" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Book } from 'src/components/models';

const props = defineProps<{
  modelValue: boolean;
  initialData: Book | null;
}>();

const emit = defineEmits(['update:modelValue', 'submit']);

const { t } = useI18n();

const name = ref('');
const description = ref('');

// Rellenar el formulario cuando los datos iniciales cambien
watchEffect(() => {
  if (props.initialData) {
    name.value = props.initialData.name;
    description.value = props.initialData.description;
  }
});

const updateModelValue = (value: boolean) => {
  emit('update:modelValue', value);
};

const closeDialog = () => {
  updateModelValue(false);
};

const onSubmit = () => {
  if (name.value) {
    emit('submit', { name: name.value, description: description.value });
    closeDialog();
  }
};
</script>
