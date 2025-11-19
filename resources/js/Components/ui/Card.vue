<template>
    <div
        :class="[
            'rounded-xl bg-white shadow-sm ring-1 ring-gray-200',
            paddingClasses,
            hoverable ? 'transition-all duration-200 hover:shadow-md hover:ring-gray-300' : '',
        ]"
    >
        <div v-if="$slots.header || title" class="border-b border-gray-200 px-6 py-4">
            <slot name="header">
                <h3 v-if="title" class="text-lg font-semibold text-gray-900">{{ title }}</h3>
                <p v-if="subtitle" class="mt-1 text-sm text-gray-500">{{ subtitle }}</p>
            </slot>
        </div>
        <div :class="[bodyPaddingClasses]">
            <slot></slot>
        </div>
        <div v-if="$slots.footer" class="border-t border-gray-200 px-6 py-4">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    title: {
        type: String,
        default: '',
    },
    subtitle: {
        type: String,
        default: '',
    },
    padding: {
        type: String,
        default: 'md',
        validator: (value) => ['none', 'sm', 'md', 'lg'].includes(value),
    },
    hoverable: {
        type: Boolean,
        default: false,
    },
});

const paddingClasses = computed(() => {
    if (props.padding === 'none') return '';
    const paddings = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };
    return paddings[props.padding];
});

const bodyPaddingClasses = computed(() => {
    if (props.padding === 'none') return '';
    if (props.title || props.subtitle) {
        return 'px-6 py-4';
    }
    return '';
});
</script>

