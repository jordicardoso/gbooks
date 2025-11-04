<!-- src/components/sheet/SheetDesigner.vue (REFACTORIZADO) -->
<template>
  <q-card class="bg-grey-10 text-white" style="width: 600px; max-width: 90vw;">
    <q-card-section>
      <div class="text-h6">Diseñador de Ficha</div>
      <div class="text-subtitle2 text-grey-5">Añade, elimina y reordena las secciones de tu ficha.</div>
    </q-card-section>

    <q-separator dark />

    <q-card-section>
      <div class="text-subtitle1 q-mb-sm">Secciones Actuales</div>
      <q-list v-if="localSchema.layout.length > 0" dark separator bordered>
        <q-item v-for="(section, index) in localSchema.layout" :key="index">
          <q-item-section avatar>
            <q-icon :name="section.icon || 'view_quilt'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ section.title }}</q-item-label>
            <q-item-label caption class="text-grey-5">
              <!-- Mostramos una descripción más amigable en lugar de los detalles técnicos -->
              {{ getSectionTypeDescription(section) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="delete" color="negative" @click="removeSection(index)" />
          </q-item-section>
        </q-item>
      </q-list>
      <div v-else class="text-grey-6 text-center q-pa-md">
        (No hay secciones. Haz clic en "Añadir Sección" para empezar.)
      </div>

      <div class="q-mt-lg">
        <q-btn
          color="primary"
          label="Añadir Sección"
          icon="add"
          @click="isAddDialogOpen = true"
        />
      </div>
    </q-card-section>

    <q-separator dark />

    <q-card-actions align="right">
      <q-btn flat label="Cancelar" @click="emit('close')" />
      <q-btn color="primary" label="Guardar Cambios" @click="saveSchema" />
    </q-card-actions>

    <!-- === DIÁLOGO MEJORADO PARA AÑADIR SECCIÓN === -->
    <q-dialog v-model="isAddDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 450px;">
        <q-card-section>
          <div class="text-h6">Elige un tipo de sección</div>
        </q-card-section>

        <q-list dark separator>
          <q-item
            v-for="template in sectionTemplates"
            :key="template.label"
            clickable
            v-ripple
            @click="promptForSectionTitle(template)"
          >
            <q-item-section avatar>
              <q-icon :name="template.icon" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ template.label }}</q-item-label>
              <q-item-label caption>{{ template.description }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useBookStore, type CharacterSheetSchema, type CharacterSheetSectionSchema } from 'src/stores/book-store';

// Ya no necesitamos la prop 'availableTypes'
const emit = defineEmits(['close']);
const $q = useQuasar();
const bookStore = useBookStore();

const localSchema = ref<CharacterSheetSchema>(
  JSON.parse(JSON.stringify(bookStore.characterSheetSchema))
);
const isAddDialogOpen = ref(false);

// Plantillas de sección que se mostrarán al usuario.
// Esto oculta los detalles de implementación como 'type' y 'mode'.
const sectionTemplates = [
  {
    label: 'Bloque de Estadísticas',
    description: 'Valores numéricos (ej: Vida, Fuerza, Maná).',
    icon: 'analytics',
    schema: { type: 'stats' as const },
  },
  {
    label: 'Equipo (con Ranuras)',
    description: 'Para equipar objetos en ranuras como "Cabeza", "Manos".',
    icon: 'checkroom',
    schema: { type: 'itemSection' as const, mode: 'slots' as const },
  },
  {
    label: 'Inventario (Lista)',
    description: 'Una lista simple para objetos, consumibles, etc.',
    icon: 'inventory_2',
    schema: { type: 'itemSection' as const, mode: 'list' as const },
  },
  {
    label: 'Cronología de Eventos',
    description: 'Una lista de sucesos importantes en la historia.',
    icon: 'event_note',
    schema: { type: 'events' as const },
  },
];

type SectionTemplate = typeof sectionTemplates[number];

function getSectionTypeDescription(section: CharacterSheetSectionSchema): string {
  if (section.type === 'itemSection') {
    return section.mode === 'slots' ? 'Equipo (Ranuras)' : 'Inventario (Lista)';
  }
  if (section.type === 'stats') {
    return 'Estadísticas';
  }
  if (section.type === 'events') {
    return 'Cronología de Eventos';
  }
  return `Tipo: ${section.type}`;
}

function promptForSectionTitle(template: SectionTemplate) {
  isAddDialogOpen.value = false; // Cerramos el diálogo de selección

  $q.dialog({
    title: `Añadir "${template.label}"`,
    message: 'Introduce un título para esta sección (ej: Atributos, Equipo del Héroe, Mochila).',
    prompt: { model: '', type: 'text', isValid: val => val.length > 0 },
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk((title: string) => {
    addNewSection(title, template);
  });
}

function addNewSection(title: string, template: SectionTemplate) {
  // Generamos una clave única para la sección
  const dataKey = `${template.schema.type}_${template.schema.mode || 'default'}_${Date.now()}`;

  if (localSchema.value.layout.some(s => s.dataKey === dataKey)) {
    $q.notify({ type: 'negative', message: 'Error al generar clave única. Inténtalo de nuevo.' });
    return;
  }

  const newSection: CharacterSheetSectionSchema = {
    title,
    icon: template.icon,
    dataKey: dataKey as any, // La clave es dinámica, 'any' es aceptable aquí
    ...template.schema,
  };

  localSchema.value.layout.push(newSection);
}

function removeSection(index: number) {
  localSchema.value.layout.splice(index, 1);
}

function saveSchema() {
  bookStore.updateCharacterSheetSchema(localSchema.value);
  emit('close');
}
</script>
