<template>
    <div class="w-full">
        <label
            v-if="label"
            :for="inputId"
            class="block text-sm font-medium text-gray-700 mb-1.5"
        >
            {{ label }}
            <span v-if="required" class="text-red-500">*</span>
        </label>
        <div class="relative">
            <div v-if="$slots.prefix" class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <slot name="prefix"></slot>
            </div>
            <input
                :id="inputId"
                :type="type"
                :value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :required="required"
                :class="[
                    'block w-full rounded-lg border-0 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200',
                    error ? 'ring-red-300 focus:ring-red-500' : '',
                    $slots.prefix ? 'pl-10' : '',
                    $slots.suffix ? 'pr-10' : '',
                ]"
                @input="$emit('update:modelValue', $event.target.value)"
                @blur="$emit('blur', $event)"
            />
            <div v-if="$slots.suffix" class="absolute inset-y-0 right-0 flex items-center pr-3">
                <slot name="suffix"></slot>
            </div>
        </div>
        <p v-if="error" class="mt-1.5 text-sm text-red-600">{{ error }}</p>
        <p v-else-if="hint" class="mt-1.5 text-sm text-gray-500">{{ hint }}</p>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: '',
    },
    type: {
        type: String,
        default: 'text',
    },
    label: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: '',
    },
    error: {
        type: String,
        default: '',
    },
    hint: {
        type: String,
        default: '',
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    required: {
        type: Boolean,
        default: false,
    },
    id: {
        type: String,
        default: '',
    },
});

defineEmits(['update:modelValue', 'blur']);

const inputId = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`);
</script>
