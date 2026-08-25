<script setup lang="ts">
import { History } from '@lucide/vue'
import { marked } from 'marked'
import { ref } from 'vue'
import { obtenerHistorialDeReleases } from '@/api/github'
import { Button } from '@/componentes/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/componentes/ui/dialog'

const cargando = ref(false)
const error = ref<string | null>(null)
const contenidoHtml = ref<string | null>(null)

async function cargarChangelog(): Promise<void> {
  if (contenidoHtml.value || cargando.value) return

  cargando.value = true
  error.value = null
  try {
    const releases = await obtenerHistorialDeReleases()
    const markdown = releases
      .map((release) => `## ${release.name ?? release.tag_name}\n\n${release.body ?? ''}`)
      .join('\n\n')
    contenidoHtml.value = await marked.parse(markdown)
  } catch {
    error.value = 'No se pudo cargar el historial de cambios.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <Dialog @update:open="(abierto) => abierto && cargarChangelog()">
    <DialogTrigger as-child>
      <Button variant="ghost" size="icon" class="size-6" aria-label="Ver historial de cambios">
        <History class="size-3.5" />
      </Button>
    </DialogTrigger>
    <DialogContent class="max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Historial de cambios</DialogTitle>
        <DialogDescription
          >Lista de cambios publicados en cada versión de la aplicación.</DialogDescription
        >
      </DialogHeader>
      <p v-if="cargando" class="text-muted-foreground text-sm">Cargando…</p>
      <p v-else-if="error" role="alert" class="text-destructive text-sm">{{ error }}</p>
      <div
        v-else-if="contenidoHtml"
        class="text-sm break-words [&_a]:underline [&_code]:break-words [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:first:mt-0 [&_h3]:mt-3 [&_h3]:font-medium [&_li]:ml-4 [&_pre]:break-words [&_pre]:whitespace-pre-wrap [&_ul]:list-disc [&_ul]:space-y-1"
        v-html="contenidoHtml"
      />
    </DialogContent>
  </Dialog>
</template>
