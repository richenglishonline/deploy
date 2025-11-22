<script setup>
import { DialogClose as RadixDialogClose } from 'radix-vue';

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
});
</script>

<template>
  <RadixDialogClose :as-child="asChild" :as="as">
    <slot />
  </RadixDialogClose>
</template>