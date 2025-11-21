<!-- src/components/NodeEditorPanel.vue -->
<template>
  <q-card
    v-if="localNode"
    :class="[
      'node-editor-panel bg-grey-9 text-white no-shadow column no-wrap',
      { fullscreen: isFullScreen },
    ]"
  >
    <q-toolbar class="bg-grey-10 col-auto">
      <q-toolbar-title class="text-subtitle1">
        {{ t('nodeEditorPanel.title') }}
      </q-toolbar-title>
      <q-space />
      <q-btn
        flat
        round
        dense
        :icon="isFullScreen ? 'fullscreen_exit' : 'fullscreen'"
        @click="isFullScreen = !isFullScreen"
      >
        <q-tooltip>{{
          isFullScreen ? t('nodeEditorPanel.exitFullscreen') : t('nodeEditorPanel.fullscreen')
        }}</q-tooltip>
      </q-btn>
      <q-btn flat round dense icon="close" @click="emit('close')" />
    </q-toolbar>

    <q-scroll-area class="col" style="min-height: 0">
      <q-card-section class="q-pt-md q-gutter-y-md">
        <div class="row q-col-gutter-md">
          <div class="col-8">
            <q-input
              v-model="localNode.label"
              :label="t('nodeEditorPanel.label')"
              dark
              dense
              clearable
            />
          </div>
          <div class="col-4">
            <q-input
              v-model.number="localNode.data.paragraphNumber"
              :label="t('nodeEditorPanel.paragraphNumber')"
              type="number"
              dark
              dense
            />
          </div>
        </div>

        <q-select
          v-model="localNode.data.tags"
          :label="t('nodeEditorPanel.tags')"
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
                {{ t('nodeEditorPanel.newTagPlaceholder') }}
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-select
          v-model="localNode.type"
          :options="nodeTypeOptions"
          :label="t('nodeEditorPanel.type')"
          dark
          dense
          emit-value
          map-options
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-icon :name="scope.opt.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-input
          v-model="localNode.data.color"
          :label="t('nodeEditorPanel.color')"
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
          :label="t('nodeEditorPanel.image')"
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
                {{ t('nodeEditorPanel.noImages') }}
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <div v-if="currentImageUrl" class="image-preview-container">
          <q-img
            v-if="currentImageUrl"
            :src="currentImageUrl"
            fit="contain"
            style="max-height: 400px; border-radius: 4px"
          />
          <div v-else class="text-center text-grey-6 q-pa-md">
            <q-icon name="image" size="2rem" />
            <p class="q-mt-sm text-caption">{{ t('nodeEditorPanel.noImageSelected') }}</p>
          </div>
        </div>

        <div class="q-pa-none node-content">
          <p class="text-caption text-grey-5 q-mb-xs">{{ t('nodeEditorPanel.content') }}</p>
          <q-editor
            v-model="localNode.data.description as string"
            dark
            :toolbar="toolbarOptions"
            min-height="10rem"
            content-class="bg-grey-9"
            toolbar-bg="grey-10"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <!-- [CAMBIO] Pasamos la nueva lista de eventos y escuchamos la creación -->
        <ActionsEditor
          :actions="localNode.data.actions || []"
          @update:actions="updateNodeActions"
          :available-stats="availableStats"
          :available-events="availableEvents"
          @create-event="handleCreateEvent"
        />
      </q-card-section>

      <q-separator dark />

      <q-card-section>
        <ChoicesEditor
          :choices="localNode.data.choices || []"
          @update:choices="updateNodeChoices"
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md col-auto bg-grey-10"
        style="position: sticky; bottom: 0; z-index: 10"
      >
        <q-btn
          flat
          :label="t('nodeEditorPanel.deleteButton')"
          color="negative"
          @click="confirmDeleteNode"
        />
        <q-space />
        <q-btn
          flat
          :label="t('nodeEditorPanel.cancelButton')"
          color="grey-5"
          @click="emit('close')"
        />
        <q-btn :label="t('nodeEditorPanel.saveButton')" color="primary" @click="saveChanges" />
      </q-card-actions>
    </q-scroll-area>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAssetsStore } from 'src/stores/assets-store';
import { useNodesStore } from 'src/stores/nodes-store';
import { useBookStore } from 'src/stores/book-store';
import { storeToRefs } from 'pinia';
import type { BookNode, AnyAction, AnyChoice, SimpleChoice, BookEvent } from 'src/stores/types';
import ActionsEditor from './ActionsEditor.vue';
import ChoicesEditor from './ChoicesEditor.vue';

interface Props {
  node: BookNode | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['save', 'close', 'delete']);

const $q = useQuasar();
const { t } = useI18n();
const assetsStore = useAssetsStore();
const nodesStore = useNodesStore();
const bookStore = useBookStore();
const { assets } = storeToRefs(assetsStore);
const { nodes } = storeToRefs(nodesStore);
const { activeBook } = storeToRefs(bookStore);

const localNode = ref<BookNode | null>(null);
const allTagsOptions = ref<string[]>([]);
const isFullScreen = ref(false);

const nodeTypeOptions = computed(() => [
  { value: 'story', label: t('nodeEditorPanel.types.story'), icon: 'menu_book' },
  { value: 'end', label: t('nodeEditorPanel.types.end'), icon: 'flag' },
]);

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
      options: ['left', 'center', 'right', 'justify'],
    },
  ],
  ['removeFormat'],
];

const availableStats = computed<string[]>(() => {
  if (!activeBook.value?.characterSheet?.stats) return [];
  return Object.keys(activeBook.value.characterSheet.stats).sort();
});

const availableEvents = computed<BookEvent[]>(() => {
  if (!activeBook.value?.events) return [];
  return [...activeBook.value.events].sort((a, b) => a.name.localeCompare(b.name));
});

function handleCreateEvent(newEvent: { id: string; name: string }) {
  if (activeBook.value?.events?.some((e) => e.id === newEvent.id)) {
    $q.notify({
      type: 'negative',
      message: t('actionsEditor.createEventDialog.message', { eventName: newEvent.name }),
    });
    return;
  }
  bookStore.addEvent(newEvent);
}

const allBookTags = computed(() => {
  const all = nodes.value.flatMap((node) => node.data.tags || []);
  return [...new Set(all)];
});

const imageAssetOptions = computed(() =>
  assets.value
    .filter((asset) => asset.type === 'image')
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      src: assetsStore.getAssetUrl(asset.filename),
    })),
);

const currentImageUrl = computed(() => {
  if (!localNode.value?.data.imageId) return null;
  const selectedOption = imageAssetOptions.value.find(
    (opt) => opt.id === localNode.value?.data.imageId,
  );
  return selectedOption ? selectedOption.src : null;
});

function updateNodeActions(newActions: AnyAction[]) {
  if (localNode.value?.data) {
    localNode.value.data.actions = newActions;
  }
}

function updateNodeChoices(newChoices: AnyChoice[]) {
  if (localNode.value) {
    localNode.value.data.choices = newChoices;
  }
}

function createTag(inputValue: string, doneFn: (item: string, mode: 'add-unique') => void) {
  const newTag = inputValue.trim();
  if (newTag && !allTagsOptions.value.includes(newTag)) {
    allTagsOptions.value.unshift(newTag);
  }
  doneFn(newTag, 'add-unique');
}

watch(
  () => props.node,
  (newNode) => {
    if (newNode) {
      localNode.value = JSON.parse(JSON.stringify(newNode));
      if (localNode.value) {
        if (!localNode.value.data) localNode.value.data = {};
        if (!localNode.value.data.description) localNode.value.data.description = '';
        if (!localNode.value.data.tags) localNode.value.data.tags = [];
        if (!localNode.value.data.actions) localNode.value.data.actions = [];
        if (!localNode.value.data.choices) localNode.value.data.choices = [];
        if (typeof localNode.value.data.paragraphNumber !== 'number') {
          localNode.value.data.paragraphNumber = nodesStore.getNewParagraphNumber();
        }
        allTagsOptions.value = [
          ...new Set([...allBookTags.value, ...(localNode.value.data.tags || [])]),
        ];
      }
    } else {
      localNode.value = null;
    }
  },
  { immediate: true, deep: true },
);

function confirmDeleteNode() {
  if (!localNode.value) return;
  $q.dialog({
    title: t('nodeEditorPanel.confirmDelete.title'),
    message: t('nodeEditorPanel.confirmDelete.message', { nodeLabel: localNode.value.label }),
    dark: true,
    persistent: true,
    ok: { label: t('nodeEditorPanel.confirmDelete.okButton'), color: 'negative', flat: false },
    cancel: { label: t('nodeEditorPanel.confirmDelete.cancelButton'), flat: true },
  }).onOk(() => {
    if (localNode.value) {
      emit('delete', localNode.value.id);
    }
  });
}

function saveChanges() {
  if (props.node && localNode.value) {
    const paragraphNumberToSave = localNode.value.data.paragraphNumber;

    if (typeof paragraphNumberToSave !== 'number' || paragraphNumberToSave <= 0) {
      $q.notify({
        type: 'negative',
        message: t('nodeEditorPanel.errors.invalidParagraphNumber'),
        position: 'top',
      });
      return;
    }

    const isDuplicate = nodes.value.some(
      (n) => n.id !== props.node?.id && n.data.paragraphNumber === paragraphNumberToSave,
    );

    if (isDuplicate) {
      $q.notify({
        type: 'negative',
        message: t('nodeEditorPanel.errors.duplicateParagraphNumber', {
          number: paragraphNumberToSave,
        }),
        position: 'top',
      });
      return;
    }

    if (localNode.value.data.choices) {
      for (const choice of localNode.value.data.choices) {
        if (choice.type === 'simple' && choice.targetNodeId === '--CREATE-NEW--') {
          const newNode = nodesStore.createNodeAndConnect(props.node.id, choice);
          if (newNode) {
            choice.targetNodeId = newNode.id;
          } else {
            choice.targetNodeId = '';
          }
        }
      }
    }

    if (localNode.value.data.choices) {
      for (const choice of localNode.value.data.choices) {
        if (
          choice.type === 'simple' &&
          choice.targetNodeId &&
          (choice as SimpleChoice).sourceHandle
        ) {
          const simpleChoice = choice as SimpleChoice;
          const handle = simpleChoice.sourceHandle;
          if (handle) {
            nodesStore.updateEdgeSourceHandle(props.node.id, simpleChoice.targetNodeId, handle);
          }
        }
      }
    }

    const { ...updates } = localNode.value;
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

.node-editor-panel.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 3000;
  border-radius: 0;
}

.image-preview-container {
  position: relative; /* Necesario para que el .fit del placeholder funcione */
  min-height: 100px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.node-content {
  white-space: pre-wrap;
  width: 100%;
  text-overflow: ellipsis;
  word-break: break-word;
}
</style>
