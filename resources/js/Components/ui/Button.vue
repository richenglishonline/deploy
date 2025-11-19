<template>
    <component
        :is="tag"
        :type="type"
        :disabled="disabled || loading"
        :class="[
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
            sizeClasses,
            variantClasses,
            fullWidth ? 'w-full' : '',
        ]"
        @click="$emit('click', $event)"
    >
        <component v-if="loading" :is="SpinnerIcon" class="h-4 w-4 animate-spin" />
        <component v-else-if="icon && !iconRight" :is="icon" class="h-4 w-4" />
        <span v-if="!loading || $slots.default"><slot></slot></span>
        <component v-if="icon && iconRight && !loading" :is="icon" class="h-4 w-4" />
    </component>
</template>

<script setup>
import { computed } from 'vue';
import {
    ArrowPathIcon,
} from '@heroicons/vue/24/outline';

const SpinnerIcon = ArrowPathIcon;

const props = defineProps({
    variant: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary', 'outline', 'ghost', 'danger'].includes(value),
    },
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg'].includes(value),
    },
    type: {
        type: String,
        default: 'button',
    },
    tag: {
        type: String,
        default: 'button',
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    icon: {
        type: Object,
        default: null,
    },
    iconRight: {
        type: Boolean,
        default: false,
    },
    fullWidth: {
        type: Boolean,
        default: false,
    },
});

defineEmits(['click']);

const sizeClasses = computed(() => {
    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };
    return sizes[props.size];
});

const variantClasses = computed(() => {
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow',
    };
    return variants[props.variant];
});
</script>
