<template>
  <div class="group relative flex flex-col overflow-hidden rounded-[1.35rem] bg-white/[0.03] ring-1 ring-white/10 hover:ring-neon/40 transition-all duration-300">
    <div class="relative aspect-[16/10] overflow-hidden bg-stone-900">
      <img
        :src="property.image"
        :alt="property.title"
        class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div class="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

      <!-- Badges -->
      <div class="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 z-10">
        <span
          :class="[
            'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide',
            property.intent === 'rent'
              ? 'bg-cyan-400 text-black shadow-sm'
              : 'bg-emerald-500 text-black shadow-sm'
          ]"
        >
          {{ property.intent === 'rent' ? 'À LOUER' : 'À VENDRE' }}
        </span>

        <span v-if="property.isGpsVerified || property.lat" class="flex items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/40 backdrop-blur-xs">
          <span>✓</span> GPS Vérifié
        </span>
      </div>

      <!-- Favorite Button -->
      <button
        type="button"
        @click.prevent="$emit('toggle-favorite', property.id)"
        class="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform active:scale-90 hover:bg-black/80"
        :aria-label="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
      >
        <svg class="h-4 w-4" :fill="isFavorite ? '#66BB6A' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>

    <div class="flex flex-1 flex-col p-5">
      <p class="text-xs text-stone-400 flex items-center gap-1">
        <span>📍</span> {{ property.district ? `${property.district}, ${property.city}` : property.city }}
      </p>

      <h3 class="mt-1.5 font-display text-base font-semibold text-white line-clamp-1">
        {{ property.title }}
      </h3>

      <p class="mt-1 text-xs text-stone-300">
        <span v-if="property.bedrooms">{{ property.bedrooms }} ch. · </span>
        <span v-if="property.bathrooms">{{ property.bathrooms }} sdb. · </span>
        <span>{{ property.area }} m²</span>
      </p>

      <div class="mt-auto pt-4 flex items-end justify-between border-t border-white/5">
        <div>
          <span class="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Prix vérifié</span>
          <p class="font-display text-lg font-bold text-emerald-400">
            {{ formatPrice(property.price) }}
            <span v-if="property.intent === 'rent'" class="text-xs font-normal text-stone-400">/mois</span>
          </p>
        </div>

        <a
          :href="property.href || `/properties/${property.slug || property.id}`"
          class="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 hover:text-black transition-colors"
        >
          Détails →
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  property: {
    type: Object,
    required: true,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['toggle-favorite']);

function formatPrice(amount) {
  if (!amount) return '0 F CFA';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' F CFA';
}
</script>
