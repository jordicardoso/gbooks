<!-- src/components/AddBookDialog.vue -->
<template>
  <q-dialog :model-value="modelValue" @update:model-value="updateModelValue" persistent>
    <q-card style="min-width: 350px" class="bg-grey-9 text-white">
      <q-card-section>
        <div class="text-h6">{{ t('addBookDialog.title') }}</div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit">
        <q-card-section class="q-pt-none">
          <q-input
            dark
            dense
            v-model="name"
            :label="t('addBookDialog.nameLabel')"
            autofocus
            :rules="[(val) => !!val || t('addBookDialog.nameRequired')]"
            lazy-rules
          />
          <q-input
            dark
            dense
            v-model="description"
            :label="t('addBookDialog.descriptionLabel')"
            type="textarea"
            class="q-mt-sm"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat :label="t('addBookDialog.cancelButton')" @click="closeDialog" />
          <q-btn flat :label="t('addBookDialog.submitButton')" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue', 'submit']);

const { t } = useI18n();

const name = ref('');
const description = ref('');

const updateModelValue = (value: boolean) => {
  emit('update:modelValue', value);
};

const closeDialog = () => {
  updateModelValue(false);
};

const onSubmit = () => {
  if (name.value) {
    emit('submit', { name: name.value, description: description.value });
    name.value = '';
    description.value = '';
    closeDialog();
  }
};
</script>
