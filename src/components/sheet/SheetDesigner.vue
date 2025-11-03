<!-- src/components/sheet/SheetDesigner.vue (NUEVO FICHERO) -->
<template>
  <q-card class="bg-grey-10 text-white" style="width: 600px; max-width: 90vw;">
    <q-card-section>
      <div class="text-h6">Diseñador de Ficha</div>
      <div class="text-subtitle2 text-grey-5">Añade, elimina y reordena las secciones de tu ficha.</div>
    </q-card-section>

    <q-separator dark />

    <q-card-section>
      <q-list dark separator>
        <q-item v-for="(section, index) in localSchema.layout" :key="index">
          <q-item-section avatar>
            <q-icon :name="section.icon || 'view_quilt'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ section.title }}</q-item-label>
            <q-item-label caption class="text-grey-5">Tipo: {{ section.type }} / Clave: {{ section.dataKey }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="delete" color="negative" @click="removeSection(index)" />
          </q-item-section>
        </q-item>
      </q-list>

      <div class="q-mt-md">
        <q-btn
          color="primary"
          label="Añadir Sección"
          icon="add"
          @click="openAddDialog"
        />
      </div>
    </q-card-section>

    <q-separator dark />

    <q-card-actions align="right">
      <q-btn flat label="Cancelar" @click="emit('close')" />
      <q-btn color="primary" label="Guardar Cambios" @click="saveSchema" />
    </q-card-actions>
    <q-dialog v-model="isAddDialogOpen" persistent>
      <q-card class="bg-grey-9 text-white" style="width: 400px;">
        <q-card-section>
          <div class="text-h6">Nueva Sección</div>
        </q-card-section>

        <q-form @submit.prevent="saveNewSection">
          <q-card-section class="q-gutter-y-md">
            <q-input
              v-model="newSectionData.title"
              label="Título de la sección"
              filled dark autofocus
              :rules="[val => !!val || 'El título es obligatorio']"
            />
            <q-select
              v-model="newSectionData.type"
              :options="availableTypes"
              label="Tipo de componente"
              filled dark emit-value map-options
              :rules="[val => !!val || 'El tipo es obligatorio']"
            />
            <!-- El selector de modo solo aparece si el tipo es 'itemSection' -->
            <q-select
              v-if="newSectionData.type === 'itemSection'"
              v-model="newSectionData.mode"
              :options="['slots', 'list']"
              label="Modo de la sección"
              filled dark emit-value map-options
              :rules="[val => !!val || 'El modo es obligatorio para este tipo']"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn color="primary" label="Añadir" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useBookStore, type CharacterSheetSchema, type CharacterSheetSectionSchema } from 'src/stores/book-store';

const props = defineProps<{
  availableTypes: string[];
}>();

const emit = defineEmits(['close']);
const $q = useQuasar();
const bookStore = useBookStore();

// Creamos una copia local profunda del schema para poder editarla sin afectar al store directamente.
const localSchema = ref<CharacterSheetSchema>(
  JSON.parse(JSON.stringify(bookStore.characterSheetSchema))
);

function openAddDialog() {
  // Reseteamos el formulario
  newSectionData.value = { title: '', type: null, mode: null };
  isAddDialogOpen.value = true;
}

function saveNewSection() {
  const { title, type, mode } = newSectionData.value;
  if (!title || !type) return;

  const dataKey = `${type}_${mode || 'default'}_${Date.now()}`;

  if (localSchema.value.layout.some(s => s.dataKey === dataKey)) {
    $q.notify({ type: 'negative', message: 'Error al generar clave única. Inténtalo de nuevo.' });
    return;
  }

  const newSection: CharacterSheetSectionSchema = {
    type,
    title,
    icon: getIconForType(type, mode),
    dataKey: dataKey as any, // Usamos 'any' porque la clave es dinámica
    mode: mode || undefined,
  };

  localSchema.value.layout.push(newSection);
  isAddDialogOpen.value = false; // Cerramos el diálogo
}

function removeSection(index: number) {
  localSchema.value.layout.splice(index, 1);
}

const isAddDialogOpen = ref(false);
const newSectionData = ref({
  title: '',
  type: null as string | null,
  mode: null as 'slots' | 'list' | null,
});

function getIconForType(type: string, mode?: string): string {
  if (type === 'itemSection') {
    return mode === 'slots' ? 'checkroom' : 'inventory_2';
  }
  switch (type) {
    case 'stats': return 'analytics';
    default: return 'view_quilt';
  }
}

function saveSchema() {
  // Llamamos a la nueva acción del store con nuestra copia local modificada
  bookStore.updateCharacterSheetSchema(localSchema.value);
  // Cerramos el diálogo
  emit('close');
}
</script>
