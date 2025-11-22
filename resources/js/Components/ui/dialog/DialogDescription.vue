<script setup>
import { DialogDescription as RadixDialogDescription } from 'radix-vue';
import { cn } from '@/lib/utils';

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
});
</script>

<template>
  <RadixDialogDescription
    :as-child="asChild"
    :class="cn('text-sm text-gray-500', props.class)"
  >
    <slot />
  </RadixDialogDescription>
</template>