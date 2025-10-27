<!-- src/components/NodeEditorPanel.vue -->
<template>
  <q-card class="node-editor-panel bg-grey-9 text-white no-shadow column no-wrap">
    <q-card-section class="col q-pt-md q-gutter-y-md scroll">
      <q-input
        v-model="editedLabel"
        label="Nombre del Nodo"
        dark
        dense
        clearable
      />

      <q-select
        v-model="editedTags"
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
        v-model="editedColor"
        label="Color del Nodo"
        dark
        dense
        clearable
        readonly
        class="color-input"
      >
        <template #prepend>
          <q-icon name="circle" :style="{ color: editedColor || '#455a64' }" />
        </template>
        <template #append>
          <q-icon name="colorize" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-color
                v-model="editedColor"
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
        v-model="editedImageId"
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
          v-model="editedDescription"
          label="TEXTO"
          type="textarea"
          autogrow
          dark
          dense
          borderless
        />
      </div>
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
import type { BookNode } from 'src/stores/types';

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
const editedLabel = ref('');
const editedDescription = ref('');
const editedImageId = ref<string | null>(null);
const editedTags = ref<string[]>([]);
const editedColor = ref('');
const editedSize = ref<'small' | 'medium' | 'large'>('medium');
const allTagsOptions = ref<string[]>([]);

// --- PROPIEDADES COMPUTADAS ---

// [CORREGIDO] Obtiene todas las etiquetas únicas de todos los nodos del libro.
const allBookTags = computed(() => {
  const all = nodes.value.flatMap(node => node.data.tags || []);
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
  if (!editedImageId.value) return null;
  const selectedOption = imageAssetOptions.value.find(opt => opt.id === editedImageId.value);
  return selectedOption ? selectedOption.src : null;
});

// --- FUNCIONES ---

// Permite crear nuevas etiquetas desde el QSelect.
function createTag(inputValue: string, doneFn: (item: string, mode: 'add-unique') => void) {
  const newTag = inputValue.trim();
  if (newTag && !allTagsOptions.value.includes(newTag)) {
    allTagsOptions.value.unshift(newTag); // Añade al principio para visibilidad
  }
  doneFn(newTag, 'add-unique');
}

// [REFACTORIZADO] Carga los datos del nodo en el formulario o lo resetea si no hay nodo.
function resetAndLoadNode(node: BookNode | null) {
  if (node) {
    editedLabel.value = node.label || '';
    editedDescription.value = node.data.description || '';
    editedImageId.value = node.data.imageId || null;
    editedTags.value = [...(node.data.tags || [])];
    editedColor.value = node.data.color || '';
    editedSize.value = node.data.size || 'medium';
    // Asegura que las opciones incluyan todas las etiquetas del libro más las del nodo actual.
    allTagsOptions.value = [...new Set([...allBookTags.value, ...editedTags.value])];
  } else {
    // Resetea el formulario a sus valores por defecto.
    editedLabel.value = '';
    editedDescription.value = '';
    editedImageId.value = null;
    editedTags.value = [];
    editedColor.value = '';
    editedSize.value = 'medium';
    allTagsOptions.value = [...allBookTags.value];
  }
}

// Guarda los cambios y emite los eventos correspondientes.
function saveChanges() {
  if (props.node) {
    // Construye el objeto de datos con solo los valores que tienen contenido.
    // Usar 'undefined' es una buena práctica para indicar "no cambiar" en actualizaciones parciales.
    const dataUpdates: Partial<BookNode['data']> = {
      description: editedDescription.value,
      imageId: editedImageId.value || undefined,
      tags: editedTags.value.length > 0 ? editedTags.value : undefined,
      color: editedColor.value || undefined,
      size: editedSize.value,
    };

    emit('save', {
      nodeId: props.node.id,
      updates: {
        label: editedLabel.value,
        data: dataUpdates,
      }
    });
    emit('close');
  }
}

// --- WATCHERS ---

// Observa el nodo de entrada y actualiza el formulario.
watch(() => props.node, resetAndLoadNode, { immediate: true, deep: true });

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
