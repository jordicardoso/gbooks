<!-- src/pages/MetaPage.vue -->
<template>
  <q-page padding>
    <div v-if="bookStore.activeBook" class="q-gutter-y-md" style="max-width: 700px; margin: 0 auto">
      <q-input
        filled
        dark
        v-model="bookStore.activeBook.meta.title"
        :label="$t('bookPage.meta.titleLabel')"
        @update:model-value="bookStore.setDirty()"
      />
      <q-input
        filled
        dark
        v-model="bookStore.activeBook.meta.author"
        :label="$t('bookPage.meta.authorLabel')"
        type="textarea"
        autogrow
        @update:model-value="bookStore.setDirty()"
      />
      <q-input
        filled
        dark
        v-model="bookStore.activeBook.meta.description"
        :label="$t('bookPage.meta.descriptionLabel')"
        type="textarea"
        autogrow
        @update:model-value="bookStore.setDirty()"
      />
      <q-select
        filled
        dark
        v-model="bookStore.activeBook.meta.imageId"
        :options="imageAssetOptions"
        option-value="id"
        option-label="name"
        emit-value
        map-options
        :label="$t('bookPage.meta.coverImageLabel')"
        clearable
        @update:model-value="bookStore.setDirty()"
      >
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <q-img :src="scope.opt.src" style="width: 50px; height: 50px" fit="cover" />
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
              {{ $t('bookPage.meta.noImageAssets') }}
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <div class="q-mt-lg">
        <p class="text-grey text-subtitle2">{{ $t('bookPage.meta.coverPreviewTitle') }}</p>
        <q-img
          v-if="coverImageUrl"
          :src="coverImageUrl"
          fit="contain"
          style="max-height: 400px; border-radius: 4px; background-color: rgba(0, 0, 0, 0.2)"
        />
        <div v-else class="text-center text-grey-6 q-pa-xl bg-grey-9" style="border-radius: 4px">
          <q-icon name="image" size="3rem" />
          <p class="q-mt-sm text-caption">{{ $t('bookPage.meta.noCoverSelected') }}</p>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-grey-6 q-mt-xl">
      <p>{{ $t('bookPage.bookNotFound') }}</p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBookStore } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';

const bookStore = useBookStore();
const assetsStore = useAssetsStore();

const imageAssetOptions = computed(() =>
  assetsStore.assets
    .filter((asset) => asset.type === 'image')
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      src: assetsStore.getAssetUrl(asset.filename),
    })),
);

const coverImageUrl = computed(() => {
  if (!bookStore.activeBook?.meta.imageId) return null;
  const asset = assetsStore.getAssetById(bookStore.activeBook.meta.imageId);
  return asset ? assetsStore.getAssetUrl(asset.filename) : null;
});
</script>
