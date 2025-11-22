<script setup>
import { computed } from 'vue';
import { DialogRoot } from 'radix-vue';

const props = defineProps({
  open: { 
    type: Boolean, 
    required: false,
    default: false,
  },
  defaultOpen: { 
    type: Boolean, 
    required: false,
    default: false,
  },
  modal: { 
    type: Boolean, 
    required: false,
    default: true,
  },
});

const emits = defineEmits(["update:open"]);

const isOpen = computed({
  get: () => props.open ?? props.defaultOpen,
  set: (value) => emits("update:open", value),
});
</script>

<template>
  <DialogRoot v-model:open="isOpen" :modal="modal">
    <slot />
  </DialogRoot>
</template>