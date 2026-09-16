<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { FileWithId } from "./file-selector.vue";

interface ItemState {
  url: string | null;
  loading: boolean;
  generation: number;
  width: number | null;
  height: number | null;
}

const props = withDefaults(
  defineProps<{
    files: FileWithId[];
    itemHeight?: number;
    thumbnailSize?: number;
  }>(),
  {
    itemHeight: 80,
    thumbnailSize: 64,
  },
);

const emit = defineEmits<{
  "update:files": [files: File[]];
  select: [file: File, index: number];
  delete: [file: File, index: number];
}>();

const container = ref<HTMLElement | null>(null);
const scrollTop = ref(0);

const selectedFile = ref<FileWithId | null>(null);
const removingIds = ref<Set<number>>(new Set());

const states = reactive(new Map<FileWithId, ItemState>());

function getState(file: FileWithId): ItemState {
  let state = states.get(file);

  if (!state) {
    state = {
      url: null,
      loading: false,
      generation: 0,
      width: null,
      height: null,
    };

    states.set(file, state);
  }

  return state;
}

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight));
});

const visibleCount = 6;

const endIndex = computed(() => {
  return Math.min(props.files.length, startIndex.value + visibleCount);
});

const visibleFiles = computed(() => {
  return props.files.slice(startIndex.value, endIndex.value);
});

const topSpacerHeight = computed(() => {
  return startIndex.value * props.itemHeight;
});

const bottomSpacerHeight = computed(() => {
  return Math.max(0, (props.files.length - endIndex.value) * props.itemHeight);
});

function onScroll() {
  if (container.value) {
    scrollTop.value = container.value.scrollTop;
  }
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

async function createThumbnail(
  file: File,
  state: ItemState,
  generation: number,
): Promise<void> {
  if (!isImage(file)) {
    return;
  }

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    if (state.generation !== generation) {
      bitmap.close();
      return;
    }

    state.width = bitmap.width;
  state.height = bitmap.height;

    const scale = Math.min(
      1,
      props.thumbnailSize / Math.max(bitmap.width, bitmap.height),
    );

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      return;
    }

    context.drawImage(bitmap, 0, 0, width, height);

    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.85);
    });

    if (!blob || state.generation !== generation) {
      return;
    }

    const url = URL.createObjectURL(blob);

    if (state.generation !== generation) {
      URL.revokeObjectURL(url);
      return;
    }

    state.url = url;
  } finally {
    state.loading = false;
  }
}

function ensureThumbnail(file: FileWithId) {
  const state = getState(file);

  if (!isImage(file) || state.url || state.loading) {
    return;
  }

  state.loading = true;
  const generation = ++state.generation;

  void createThumbnail(file, state, generation);
}

function releaseThumbnail(file: FileWithId) {
  const state = states.get(file);

  if (!state) {
    return;
  }

  state.generation++;

  if (state.url) {
    URL.revokeObjectURL(state.url);
    state.url = null;
  }

  state.loading = false;
}

function getThumbnailUrl(file: FileWithId): string | null {
  return getState(file).url;
}

function isLoading(file: FileWithId): boolean {
  return getState(file).loading;
}

function selectFile(file: FileWithId, index: number) {
  selectedFile.value = file;
  emit("select", file, index);
}

function deleteFile(file: FileWithId, index: number) {
  if (selectedFile.value === file) {
    selectedFile.value = null;
  }

  removingIds.value.add(file._id);
  releaseThumbnail(file);

  window.setTimeout(() => {
    removingIds.value.delete(file._id);
    emit(
      "update:files",
      props.files.filter((item) => item !== file),
    );
    emit("delete", file, index);
  }, 180);
}

function syncVisibleThumbnails() {
  const visibleSet = new Set(visibleFiles.value);

  for (const file of visibleFiles.value) {
    ensureThumbnail(file);
  }

  for (const [file] of states) {
    if (!props.files.includes(file)) {
      releaseThumbnail(file);
      states.delete(file);
      continue;
    }

    if (!visibleSet.has(file)) {
      releaseThumbnail(file);
    }
  }
}

watch(
  [() => props.files, startIndex, endIndex],
  async () => {
    await nextTick();
    syncVisibleThumbnails();
  },
  {
    immediate: true,
  },
);

onBeforeUnmount(() => {
  for (const [file] of states) {
    releaseThumbnail(file);
  }

  states.clear();
});
</script>

<template>
  <div class="file-list-wrapper">
    <div ref="container" class="file-list" @scroll="onScroll">
      <div class="spacer" :style="{ height: `${topSpacerHeight}px` }" />

      <div
        v-for="(file, localIndex) in visibleFiles"
        :key="file._id"
        class="file-item"
        :class="{ selected: selectedFile === file, removing: removingIds.has(file._id) }"
        :style="{ height: `${itemHeight}px` }"
        @click="selectFile(file, startIndex + localIndex)"
      >
        <div class="thumbnail">
          <img
            v-if="getThumbnailUrl(file)"
            :src="getThumbnailUrl(file)!"
            alt=""
          />

          <div v-else-if="isLoading(file)" class="thumbnail-placeholder">
            ...
          </div>

          <div v-else class="thumbnail-placeholder">
            {{ file.type.startsWith("image/") ? "" : "FILE" }}
          </div>
        </div>

        <div class="file-info">
          <div class="file-name">
            <span :title="file.webkitRelativePath || file.name">
              {{ file.webkitRelativePath || file.name }}
            </span>
          </div>

          <div class="file-size">
            {{ file.size.toLocaleString() }} bytes
            <template v-if="isImage(file) && getState(file).width && getState(file).height">
              · {{ getState(file).width }}x{{ getState(file).height }}
            </template>
          </div>
        </div>

        <button
          type="button"
          class="delete-button"
          @click.stop="deleteFile(file, startIndex + localIndex)"
        >
          {{ $t("remove") }}
        </button>
      </div>

      <div class="spacer" :style="{ height: `${bottomSpacerHeight}px` }" />
    </div>

    <div class="file-count">
      {{ files.length }} {{ $t("files", files.length) }}
    </div>

    <div class="selected-file-path">
      <span v-if="selectedFile">
        {{ selectedFile.webkitRelativePath || selectedFile.name }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.file-list-wrapper {
  width: 100%;
}

.file-list {
  height: 340px;
  overflow-y: auto;
  overflow-x: hidden;
}

.file-count {
  padding: 8px;
  text-align: right;
  font-size: 12px;
  color: #888;
  border-top: 1px solid #ddd;
}

.selected-file-path {
  box-sizing: border-box;
  min-height: 34px;
  max-height: 34px;
  padding: 0 8px 8px;
  font-size: 12px;
  color: #555;
  overflow-wrap: anywhere;
  overflow-y: auto;
}

.spacer {
  width: 1px;
}

.file-item-list {
  display: block;
}

.file-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  cursor: pointer;
  border-bottom: 1px solid #ddd;
  transition: none;
}

.file-item.removing {
  opacity: 0;
  transform: translateX(12px);
  height: 0 !important;
  padding-top: 0;
  padding-bottom: 0;
  border-bottom-width: 0;
  overflow: hidden;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    height 0.18s ease,
    padding 0.18s ease,
    border-bottom-width 0.18s ease;
}

.file-item.selected {
  background: #e8f0ff;
}

.thumbnail {
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #eee;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumbnail-placeholder {
  font-size: 12px;
  color: #888;
}

.file-info {
  min-width: 0;
  flex: 1;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  margin-top: 4px;
  font-size: 11px;
  color: #888;
}

.delete-button {
  flex: 0 0 auto;
}
</style>
