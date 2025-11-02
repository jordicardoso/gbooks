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
          <!--<q-item-section avatar>
            <q-icon :name="section.icon || 'o_view_quilt'" />
          </q-item-section>-->
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
        <q-btn-dropdown split dark color="primary" label="Añadir Sección" @click="addSection('stats')">
          <q-list>
            <q-item clickable v-close-popup @click="addSection('stats')">
              <q-item-section avatar><q-icon name="analytics" /></q-item-section>
              <q-item-section>
                <q-item-label>Estadísticas</q-item-label>
              </q-item-section>
            </q-item>
            <!-- Descomenta cuando tengas los componentes para estas secciones -->
            <q-item clickable v-close-popup @click="addSection('equipment')">
              <q-item-section avatar><q-icon name="checkroom" /></q-item-section>
              <q-item-section>
                <q-item-label>Equipamiento</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="addSection('itemList')">
              <q-item-section avatar><q-icon name="inventory_2" /></q-item-section>
              <q-item-section>
                <q-item-label>Inventario</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </q-card-section>

    <q-separator dark />

    <q-card-actions align="right">
      <q-btn flat label="Cancelar" @click="emit('close')" />
      <q-btn color="primary" label="Guardar Cambios" @click="saveSchema" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useBookStore, type CharacterSheetSchema, type CharacterSheetSectionSchema } from 'src/stores/book-store';

const emit = defineEmits(['close']);
const $q = useQuasar();
const bookStore = useBookStore();

// Creamos una copia local profunda del schema para poder editarla sin afectar al store directamente.
const localSchema = ref<CharacterSheetSchema>(
  JSON.parse(JSON.stringify(bookStore.characterSheetSchema))
);

function removeSection(index: number) {
  localSchema.value.layout.splice(index, 1);
}

function addSection(type: CharacterSheetSectionSchema['type']) {
  // Pedimos al usuario un título para la nueva sección
  $q.dialog({
    title: 'Nueva Sección',
    message: 'Introduce un título para la nueva sección.',
    prompt: {
      model: '',
      type: 'text',
      isValid: val => val.length > 0,
    },
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk((title: string) => {
    const dataKey = type; // Por ahora, la clave es igual al tipo. Podría ser más complejo.

    // Verificamos que la clave no esté ya en uso
    if (localSchema.value.layout.some(s => s.dataKey === dataKey)) {
      $q.notify({
        type: 'negative',
        message: `Ya existe una sección del tipo "${type}". Solo se permite una de cada tipo por ahora.`,
      });
      return;
    }

    const newSection: CharacterSheetSectionSchema = {
      type,
      title,
      icon: getIconForType(type),
      dataKey,
    };
    localSchema.value.layout.push(newSection);
  });
}

function getIconForType(type: CharacterSheetSectionSchema['type']): string {
  switch (type) {
    case 'stats': return 'o_analytics';
    case 'equipment': return 'o_checkroom';
    case 'itemList': return 'o_inventory_2';
    default: return 'o_view_quilt';
  }
}

function saveSchema() {
  // Llamamos a la nueva acción del store con nuestra copia local modificada
  bookStore.updateCharacterSheetSchema(localSchema.value);
  // Cerramos el diálogo
  emit('close');
}
</script>
