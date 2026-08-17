<script setup lang="ts">
import ModalChangelog from './ModalChangelog.vue'

const versionApp = __VERSION_APP__
</script>

<template>
  <footer
    class="bg-background border-border fixed inset-x-0 bottom-0 z-40 flex h-9 items-center justify-end gap-1 border-t px-3 text-xs"
  >
    <span class="text-muted-foreground">v{{ versionApp }}</span>
    <ModalChangelog />
  </footer>
</template>
