<script setup>
import { DialogTitle as RadixDialogTitle } from 'radix-vue';
import { cn } from '@/lib/utils';

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
});
</script>

<template>
  <RadixDialogTitle
    :as-child="asChild"
    :class="
      cn('text-lg font-semibold leading-none tracking-tight', props.class)
    "
  >
    <slot />
  </RadixDialogTitle>
</template>