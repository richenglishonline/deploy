<script setup>
import { DialogTrigger as RadixDialogTrigger } from 'radix-vue';

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
});
</script>

<template>
  <RadixDialogTrigger :as-child="asChild" :as="as">
    <slot />
  </RadixDialogTrigger>
</template>