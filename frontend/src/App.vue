<script setup lang="ts"></script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <header class="border-b border-gray-200 bg-white px-6 py-4">
      <h1 class="text-lg font-semibold">Gestor de Gastos Personal</h1>
      <nav class="mt-2 flex gap-4 text-sm">
        <RouterLink to="/" class="text-blue-600">Inicio</RouterLink>
        <RouterLink to="/cuentas" class="text-blue-600">Cuentas</RouterLink>
        <RouterLink to="/categorias" class="text-blue-600">Categorías</RouterLink>
        <RouterLink to="/movimientos" class="text-blue-600">Movimientos</RouterLink>
        <RouterLink to="/importar" class="text-blue-600">Importar Excel</RouterLink>
      </nav>
    </header>

    <main class="p-6">
      <RouterView />
    </main>
  </div>
</template>
