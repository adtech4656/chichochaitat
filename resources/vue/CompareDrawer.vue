<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" @click="$emit('close')" />

    <div class="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
      <div class="w-screen max-w-3xl bg-[#090C10] border-l border-white/10 shadow-2xl flex flex-col text-white">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚖️</span>
            <div>
              <h2 class="text-lg font-bold text-white">Comparateur de Biens ChiChoc</h2>
              <p class="text-xs text-stone-400">{{ items.length }} bien(s) sélectionné(s) sur 4 max</p>
            </div>
          </div>
          <button
            type="button"
            @click="$emit('close')"
            class="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <div v-if="items.length === 0" class="py-16 text-center text-stone-400">
            <p class="text-4xl mb-3">⚖️</p>
            <p class="font-semibold">Aucun bien en comparaison</p>
            <p class="text-xs text-stone-500 mt-1">Cliquez sur l’icône balance d'une propriété pour la comparer.</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="item in items"
              :key="item.id"
              class="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between"
            >
              <div>
                <img :src="item.image" :alt="item.title" class="w-full h-32 object-cover rounded-xl mb-3" />
                <h4 class="font-bold text-sm text-white line-clamp-1">{{ item.title }}</h4>
                <p class="text-xs text-stone-400 mb-2">{{ item.city }} · {{ item.district }}</p>
                <p class="text-base font-extrabold text-emerald-400 mb-3">{{ formatPrice(item.price) }}</p>

                <div class="space-y-1.5 text-xs text-stone-300 border-t border-white/10 pt-2">
                  <div class="flex justify-between">
                    <span class="text-stone-500">Surface:</span>
                    <span>{{ item.area }} m²</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-stone-500">Chambres:</span>
                    <span>{{ item.bedrooms || item.beds || '—' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-stone-500">Titre Foncier:</span>
                    <span class="text-emerald-400 font-semibold">ACD Vérifié ✓</span>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <a
                  :href="item.href || `/properties/${item.slug || item.id}`"
                  class="flex-1 text-center py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition"
                >
                  Voir fiche
                </a>
                <button
                  type="button"
                  @click="$emit('remove', item.id)"
                  class="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg text-xs"
                >
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  items: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['close', 'remove']);

function formatPrice(amount) {
  if (!amount) return '0 F CFA';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' F CFA';
}
</script>
