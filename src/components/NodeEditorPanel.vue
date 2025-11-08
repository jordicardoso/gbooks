<!-- src/components/NodeEditorPanel.vue (ACTUALIZADO) -->
<template>
  <!-- Añadimos la clase dinámica 'fullscreen' -->
  <q-card v-if="localNode" :class="['node-editor-panel bg-grey-9 text-white no-shadow column no-wrap', { 'fullscreen': isFullScreen }]">
    <q-toolbar class="bg-grey-10">
      <q-toolbar-title class="text-subtitle1">
        Editar Nodo
      </q-toolbar-title>
      <q-space />
      <!-- Botón para modo pantalla completa -->
      <q-btn
        flat round dense
        :icon="isFullScreen ? 'fullscreen_exit' : 'fullscreen'"
        @click="isFullScreen = !isFullScreen"
      >
        <q-tooltip>{{ isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa' }}</q-tooltip>
      </q-btn>
      <q-btn flat round dense icon="close" @click="emit('close')" />
    </q-toolbar>

    <q-card-section class="col q-pt-md q-gutter-y-md scroll">
      <!-- Los v-model ahora apuntan directamente a las propiedades de localNode -->
      <div class="row q-col-gutter-md">
        <div class="col-8">
          <q-input
            v-model="localNode.label"
            label="Nombre del Nodo"
            dark dense clearable
          />
        </div>
        <div class="col-4">
          <q-input
            v-model.number="localNode.data.paragraphNumber"
            label="Nº Párrafo"
            type="number"
            dark dense
          />
        </div>
      </div>

      <q-select
        v-model="localNode.data.tags"
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
        v-model="localNode.data.color"
        label="Color del Nodo"
        dark
        dense
        clearable
        readonly
        class="color-input"
      >
        <template #prepend>
          <q-icon name="circle" :style="{ color: localNode.data.color || '#455a64' }" />
        </template>
        <template #append>
          <q-icon name="colorize" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-color
                v-model="localNode.data.color"
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
        v-model="localNode.data.imageId"
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
        <p class="text-caption text-grey-5 q-mb-xs">TEXTO DEL NODO</p>
        <q-editor
          v-model="localNode.data.description"
          dark
          :toolbar="toolbarOptions"
          min-height="10rem"
          content-class="bg-grey-9"
          toolbar-bg="grey-10"
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

    <!-- El nuevo editor de acciones de SALIDA -->
    <q-card-section>
      <ChoicesEditor
        :choices="localNode.choices || []"
        @update:choices="updateNodeChoices"
      />
    </q-card-section>

    <!-- Acciones del pie de página con el nuevo botón de eliminar -->
    <q-card-actions align="right" class="q-pa-md">
      <q-btn flat label="Eliminar" color="negative" @click="confirmDeleteNode" />
      <q-space />
      <q-btn flat label="Cancelar" color="grey-5" @click="emit('close')" />
      <q-btn label="Guardar" color="primary" @click="saveChanges" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAssetsStore } from 'src/stores/assets-store';
import { useNodesStore } from 'src/stores/nodes-store';
import { storeToRefs } from 'pinia';
import type { BookNode, AnyAction, AnyChoice } from 'src/stores/types';
import ActionsEditor from './ActionsEditor.vue';
import ChoicesEditor from './ChoicesEditor.vue';

interface Props {
  node: BookNode | null;
}

const props = defineProps<Props>();
// Añadimos 'delete' a los emits
const emit = defineEmits(['save', 'close', 'delete']);

// --- STORES Y QUASAR ---
const $q = useQuasar();
const assetsStore = useAssetsStore();
const nodesStore = useNodesStore();
const { assets } = storeToRefs(assetsStore);
const { nodes } = storeToRefs(nodesStore);

// --- ESTADO LOCAL DEL FORMULARIO ---
const localNode = ref<BookNode | null>(null);
const allTagsOptions = ref<string[]>([]);
const isFullScreen = ref(false); // Estado para el modo pantalla completa

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['hr', 'link'],
  ['unordered', 'ordered'],
  [
    {
      label: $q.lang.editor.align,
      icon: $q.iconSet.editor.align,
      fixedLabel: true,
      list: 'only-icons',
      options: ['left', 'center', 'right', 'justify']
    }
  ],
  ['removeFormat']
];

// Obtiene todas las etiquetas únicas de todos los nodos del libro.
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
  if (!localNode.value?.data.imageId) return null;
  const selectedOption = imageAssetOptions.value.find(opt => opt.id === localNode.value?.data.imageId);
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
    localNode.value = JSON.parse(JSON.stringify(newNode));
    if (!localNode.value.data.tags) localNode.value.data.tags = [];
    if (!localNode.value.actions) localNode.value.actions = [];
    if (!localNode.value.choices) localNode.value.choices = [];
    if (typeof localNode.value.data.paragraphNumber !== 'number') {
      const existingParagraphNumbers = nodes.value.map(n => n.data.paragraphNumber || 0);
      const maxParagraphNumber = Math.max(0, ...existingParagraphNumbers);
      localNode.value.data.paragraphNumber = maxParagraphNumber + 1;
    }
    allTagsOptions.value = [...new Set([...allBookTags.value, ...(localNode.value.data.tags || [])])];
  } else {
    localNode.value = null;
  }
}, { immediate: true, deep: true });


// Nueva función para confirmar y eliminar el nodo
function confirmDeleteNode() {
  if (!localNode.value) return;
  $q.dialog({
    title: 'Confirmar Eliminación',
    message: `¿Estás seguro de que quieres eliminar el nodo "${localNode.value.label}"? Esta acción no se puede deshacer y eliminará todas las conexiones asociadas.`,
    dark: true,
    cancel: true,
    persistent: true,
    ok: { label: 'Eliminar', color: 'negative', flat: false },
    cancel: { label: 'Cancelar', flat: true }
  }).onOk(() => {
    if (localNode.value) {
      emit('delete', localNode.value.id);
    }
  });
}

async function saveChanges() { // La hacemos async
  if (props.node && localNode.value) {
    const paragraphNumberToSave = localNode.value.data.paragraphNumber;

    if (typeof paragraphNumberToSave !== 'number' || paragraphNumberToSave <= 0) {
      $q.notify({
        type: 'negative',
        message: 'El número de párrafo debe ser un número mayor que cero.',
        position: 'top'
      });
      return;
    }

    const isDuplicate = nodes.value.some(
      (n) => n.id !== props.node?.id && n.data.paragraphNumber === paragraphNumberToSave
    );

    if (isDuplicate) {
      $q.notify({
        type: 'negative',
        message: `El número de párrafo ${paragraphNumberToSave} ya está en uso. Por favor, elige otro.`,
        position: 'top'
      });
      return;
    }

    // Procesar las opciones de salida para crear nuevos nodos si es necesario.
    if (localNode.value.choices) {
      for (const choice of localNode.value.choices) {
        // Asumimos que tu ChoicesEditor usa un valor especial para crear un nodo.
        if (choice.targetNodeId === '--CREATE-NEW--') {
          // Llamamos a una nueva acción en el store que crea el nodo y la conexión.
          // Esta acción debería devolver el ID del nuevo nodo.
          const newNodeId = await nodesStore.createNodeAndConnect(props.node.id, choice.id);

          // Reemplazamos el valor especial con el ID del nodo recién creado.
          choice.targetNodeId = newNodeId;
        }
      }
    }

    const { id, position, ...updates } = localNode.value;
    emit('save', {
      nodeId: props.node.id,
      updates: updates,
    });
  }
}
</script>

<style scoped>
.node-editor-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Estilos para el modo pantalla completa */
.node-editor-panel.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 3000; /* Asegurarse de que esté por encima de todo */
  border-radius: 0;
}

.node-content {
  white-space: pre-wrap;
  width: 100%;
  text-overflow: ellipsis;
  word-break: break-word;
}
</style>
