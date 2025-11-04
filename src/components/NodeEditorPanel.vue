<!-- src/components/NodeEditorPanel.vue (CORREGIDO) -->
<template>
  <!-- Usamos v-if para no renderizar nada si no hay un nodo local, evitando errores -->
  <q-card v-if="localNode" class="node-editor-panel bg-grey-9 text-white no-shadow column no-wrap">
    <q-toolbar class="bg-grey-10">
      <q-toolbar-title class="text-subtitle1">
        Editar Nodo
      </q-toolbar-title>
      <q-btn flat round dense icon="close" @click="emit('close')" />
    </q-toolbar>

    <q-card-section class="col q-pt-md q-gutter-y-md scroll">
      <!-- Los v-model ahora apuntan directamente a las propiedades de localNode -->
      <q-input
        v-model="localNode.label"
        label="Nombre del Nodo"
        dark
        dense
        clearable
      />

      <q-select
        v-model="localNode.tags"
        label="Etiquetas"
        dark
        dense
        multiple
        use-chips
        use-input
        hide-dropdown-icon
        new-value-mode="add-unique"
        :options="allTagsOptions"
        @new-value="createTag"
      >
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">
              Escribe para añadir una nueva etiqueta
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <q-input
        v-model="localNode.color"
        label="Color del Nodo"
        dark
        dense
        clearable
        readonly
        class="color-input"
      >
        <template #prepend>
          <q-icon name="circle" :style="{ color: localNode.color || '#455a64' }" />
        </template>
        <template #append>
          <q-icon name="colorize" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-color
                v-model="localNode.color"
                dark
                no-header
                no-footer
                default-view="palette"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>

      <q-select
        v-model="localNode.imageId"
        :options="imageAssetOptions"
        option-value="id"
        option-label="name"
        emit-value
        map-options
        label="Imagen del Nodo"
        dark
        dense
        clearable
      >
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <q-img :src="scope.opt.src" fit="cover" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
              <q-item-label caption class="text-grey-5">{{ scope.opt.category }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">
              No hay imágenes en los assets.
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <div class="image-preview-container">
        <q-img
          v-if="currentImageUrl"
          :src="currentImageUrl"
          fit="contain"
          style="max-height: 400px; border-radius: 4px;"
        />
        <div v-else class="text-center text-grey-6 q-pa-md">
          <q-icon name="image" size="2rem" />
          <p class="q-mt-sm text-caption">Sin imagen seleccionada</p>
        </div>
      </div>

      <div class="q-pa-none node-content">
        <q-input
          v-model="localNode.description"
          label="TEXTO"
          type="textarea"
          autogrow
          dark
          dense
          borderless
        />
      </div>
    </q-card-section>

    <!-- El editor de acciones de ENTRADA -->
    <q-card-section>
      <ActionsEditor
        :actions="localNode.actions || []"
        @update:actions="updateNodeActions"
      />
    </q-card-section>

    <q-separator dark />

    <!-- [!code focus:6] El nuevo editor de opciones de SALIDA -->
    <q-card-section>
      <ChoicesEditor
        :choices="localNode.choices || []"
        @update:choices="updateNodeChoices"
      />
    </q-card-section>

    <q-card-actions align="right" class="q-pa-md">
      <q-btn flat label="Cancelar" color="grey-5" @click="emit('close')" />
      <q-btn label="Guardar Cambios" color="primary" @click="saveChanges" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useAssetsStore } from 'src/stores/assets-store';
import { useNodesStore } from 'src/stores/nodes-store';
import { storeToRefs } from 'pinia';
import type { BookNode, AnyAction } from 'src/stores/types';
import ActionsEditor from './ActionsEditor.vue';
import ChoicesEditor from './ChoicesEditor.vue';

interface Props {
  node: BookNode | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['save', 'close']);

// --- STORES ---
const assetsStore = useAssetsStore();
const nodesStore = useNodesStore();
const { assets } = storeToRefs(assetsStore);
const { nodes } = storeToRefs(nodesStore);

// --- ESTADO LOCAL DEL FORMULARIO ---
// Refactorizamos para usar una única copia local del nodo.
const localNode = ref<BookNode | null>(null);
const allTagsOptions = ref<string[]>([]);

// Obtiene todas las etiquetas únicas de todos los nodos del libro.
const allBookTags = computed(() => {
  const all = nodes.value.flatMap(node => node.tags || []);
  return [...new Set(all)];
});

// Opciones para el selector de imágenes, basadas en los assets.
const imageAssetOptions = computed(() =>
  assets.value
    .filter(asset => asset.type === 'image')
    .map(asset => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      src: assetsStore.getAssetUrl(asset.filename)
    }))
);

// URL de la imagen seleccionada para la vista previa.
const currentImageUrl = computed(() => {
  if (!localNode.value?.imageId) return null;
  const selectedOption = imageAssetOptions.value.find(opt => opt.id === localNode.value?.imageId);
  return selectedOption ? selectedOption.src : null;
});

// --- FUNCIONES ---

// Actualiza las acciones en nuestra copia local del nodo.
function updateNodeActions(newActions: AnyAction[]) {
  if (localNode.value) {
    localNode.value.actions = newActions;
  }
}

function updateNodeChoices(newChoices: AnyChoice[]) {
  if (localNode.value) {
    localNode.value.choices = newChoices;
  }
}

// Permite crear nuevas etiquetas desde el QSelect.
function createTag(inputValue: string, doneFn: (item: string, mode: 'add-unique') => void) {
  const newTag = inputValue.trim();
  if (newTag && !allTagsOptions.value.includes(newTag)) {
    allTagsOptions.value.unshift(newTag);
  }
  doneFn(newTag, 'add-unique');
}

// Carga el nodo en la copia local cuando cambia la prop.
watch(() => props.node, (newNode) => {
  if (newNode) {
    // Creamos una copia profunda para no mutar el estado original.
    localNode.value = JSON.parse(JSON.stringify(newNode));

    // Aseguramos que las propiedades opcionales existan para evitar errores.
    if (!localNode.value.tags) localNode.value.tags = [];
    if (!localNode.value.actions) localNode.value.actions = [];

    // Actualizamos las opciones de etiquetas.
    allTagsOptions.value = [...new Set([...allBookTags.value, ...localNode.value.tags])];
  } else {
    localNode.value = null;
  }
}, { immediate: true, deep: true });


function saveChanges() {
  if (props.node && localNode.value) {
    // Creamos un objeto de actualizaciones a partir de la copia local.
    // Ya no necesitamos reconstruir un objeto 'data' que no existe.
    const { id, position, ...updates } = localNode.value;

    // Emitimos el payload para que el store lo procese.
    emit('save', {
      nodeId: props.node.id,
      updates: updates,
    });
    emit('close');
  }
}
</script>

<style scoped>
.node-editor-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.node-content {
  white-space: pre-wrap;
  width: 100%;
  text-overflow: ellipsis;
  word-break: break-word;
}
</style>
