<!-- src/components/sheet/SheetDesigner.vue -->
<template>
  <q-card class="bg-grey-10 text-white" style="width: 600px; max-width: 90vw;">
    <q-card-section>
      <div class="text-h6">{{ t('characterSheet.designer.title') }}</div>
      <div class="text-subtitle2 text-grey-5">{{ t('characterSheet.designer.subtitle') }}</div>
    </q-card-section>

    <q-separator dark />

    <q-card-section>
      <div class="text-subtitle1 q-mb-sm">{{ t('characterSheet.designer.currentSections') }}</div>
      <q-list v-if="localSchema.layout.length > 0" dark separator bordered>
        <q-item v-for="(section, index) in localSchema.layout" :key="index">
          <q-item-section avatar>
            <q-icon :name="section.icon || 'view_quilt'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ section.title }}</q-item-label>
            <q-item-label caption class="text-grey-5">
              {{ getSectionTypeDescription(section) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="delete" color="negative" @click="removeSection(index)" />
          </q-item-section>
        </q-item>
      </q-list>
      <div v-else class="text-grey-6 text-center q-pa-md">
        {{ t('characterSheet.designer.noSections') }}
      </div>

      <div class="q-mt-lg">
        <q-btn
          color="primary"
          :label="t('characterSheet.designer.addSection')"
          icon="add"
          @click="isAddDialogOpen = true"
        />
      </div>
    </q-card-section>

    <q-separator dark />

    <q-card-actions align="right">
      <q-btn flat :label="t('characterSheet.designer.cancel')" @click="emit('close')" />
      <q-btn color="primary" :label="t('characterSheet.designer.saveChanges')" @click="saveSchema" />
    </q-card-actions>

    <q-dialog v-model="isAddDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 450px;">
        <q-card-section>
          <div class="text-h6">{{ t('characterSheet.designer.addDialog.title') }}</div>
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
          <q-btn flat :label="t('characterSheet.designer.close')" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useBookStore, type CharacterSheetSchema, type CharacterSheetSectionSchema } from 'src/stores/book-store';

const emit = defineEmits(['close']);
const $q = useQuasar();
const { t } = useI18n();
const bookStore = useBookStore();

const localSchema = ref<CharacterSheetSchema>(
  JSON.parse(JSON.stringify(bookStore.characterSheetSchema))
);
const isAddDialogOpen = ref(false);

const rawTemplates = [
  { key: 'stats', icon: 'analytics', schema: { type: 'stats' as const } },
  { key: 'itemSlots', icon: 'checkroom', schema: { type: 'itemSection' as const, mode: 'slots' as const } },
  { key: 'itemList', icon: 'inventory_2', schema: { type: 'itemSection' as const, mode: 'list' as const } },
  { key: 'events', icon: 'event_note', schema: { type: 'events' as const } },
];

const sectionTemplates = computed(() => rawTemplates.map(template => ({
  ...template,
  label: t(`characterSheet.designer.addDialog.templates.${template.key}.label`),
  description: t(`characterSheet.designer.addDialog.templates.${template.key}.description`),
})));

type SectionTemplate = typeof sectionTemplates.value[number];

function getSectionTypeDescription(section: CharacterSheetSectionSchema): string {
  if (section.type === 'itemSection') {
    return section.mode === 'slots' ? t('characterSheet.designer.sectionTypes.slots') : t('characterSheet.designer.sectionTypes.list');
  }
  if (section.type === 'stats') {
    return t('characterSheet.designer.sectionTypes.stats');
  }
  if (section.type === 'events') {
    return t('characterSheet.designer.sectionTypes.events');
  }
  return t('characterSheet.designer.sectionTypes.unknown', { type: section.type });
}

function promptForSectionTitle(template: SectionTemplate) {
  isAddDialogOpen.value = false;

  $q.dialog({
    title: t('characterSheet.designer.promptTitle.title', { sectionLabel: template.label }),
    message: t('characterSheet.designer.promptTitle.message'),
    prompt: { model: '', type: 'text', isValid: val => val.length > 0 },
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk((title: string) => {
    addNewSection(title, template);
  });
}

function addNewSection(title: string, template: SectionTemplate) {
  const dataKey = `${template.schema.type}_${template.schema.mode || 'default'}_${Date.now()}`;

  if (localSchema.value.layout.some(s => s.dataKey === dataKey)) {
    $q.notify({ type: 'negative', message: t('characterSheet.designer.errors.uniqueKey') });
    return;
  }

  const newSection: CharacterSheetSectionSchema = {
    title,
    icon: template.icon,
    dataKey: dataKey as any,
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
