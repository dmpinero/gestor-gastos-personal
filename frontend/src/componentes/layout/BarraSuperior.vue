<script setup lang="ts">
import BotonManualUsuario from './BotonManualUsuario.vue'
import ConmutadorTema from './ConmutadorTema.vue'
</script>

<template>
  <header class="border-border flex h-12 items-center justify-between border-b px-4">
    <h1 class="text-sm font-semibold">Gestor de Gastos Personal</h1>
    <div class="flex items-center gap-1">
      <BotonManualUsuario />
      <ConmutadorTema />
    </div>
  </header>
</template>
