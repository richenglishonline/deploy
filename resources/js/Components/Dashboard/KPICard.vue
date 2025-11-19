<template>
    <div
        class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md hover:ring-gray-300"
    >
        <div class="flex items-start justify-between">
            <div class="flex-1">
                <p class="text-sm font-medium text-gray-600">{{ label }}</p>
                <p class="mt-2 text-3xl font-semibold text-gray-900">
                    {{ formattedValue }}
                </p>
                <div v-if="change !== null" class="mt-3 flex items-center">
                    <span
                        :class="[
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            change >= 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800',
                        ]"
                    >
                        <component
                            :is="change >= 0 ? ArrowUpIcon : ArrowDownIcon"
                            class="mr-1 h-3 w-3"
                        />
                        {{ Math.abs(change) }}%
                    </span>
                    <span class="ml-2 text-xs text-gray-500">{{ changeLabel }}</span>
                </div>
            </div>
            <div
                :class="[
                    'flex h-12 w-12 items-center justify-center rounded-lg',
                    iconBgColor,
                ]"
            >
                <component :is="icon" :class="[iconColor, 'h-6 w-6']" />
            </div>
        </div>
        <div
            v-if="trend"
            class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        ></div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import {
    ArrowUpIcon,
    ArrowDownIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
    label: {
        type: String,
        required: true,
    },
    value: {
        type: [Number, String],
        required: true,
    },
    icon: {
        type: Object,
        required: true,
    },
    iconBgColor: {
        type: String,
        default: 'bg-blue-50',
    },
    iconColor: {
        type: String,
        default: 'text-blue-600',
    },
    change: {
        type: Number,
        default: null,
    },
    changeLabel: {
        type: String,
        default: 'vs last period',
    },
    trend: {
        type: Boolean,
        default: false,
    },
    format: {
        type: String,
        default: 'number', // 'number', 'currency', 'percentage'
    },
});

const formattedValue = computed(() => {
    if (props.format === 'currency') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(Number(props.value));
    }
    if (props.format === 'percentage') {
        return `${Number(props.value).toFixed(1)}%`;
    }
    return new Intl.NumberFormat('en-US').format(Number(props.value));
});
</script>

