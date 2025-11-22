<template>
    <div class="space-y-2">
        <label
            v-if="label"
            :for="id"
            :class="[
                'block text-sm font-medium text-gray-700',
                required ? 'after:content-[\'*\'] after:ml-0.5 after:text-red-500' : '',
            ]"
        >
            {{ label }}
        </label>
        
        <div class="relative">
            <slot :id="id" :error="error" :hasError="hasError">
                <input
                    :id="id"
                    :type="type"
                    :value="modelValue"
                    :placeholder="placeholder"
                    :required="required"
                    :disabled="disabled"
                    :class="[
                        'block w-full rounded-lg border-0 bg-white py-2.5 px-4 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition-all duration-200',
                        hasError ? 'ring-red-300 focus:ring-red-500' : '',
                        disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : '',
                        $slots.prefix ? 'pl-10' : '',
                        $slots.suffix ? 'pr-10' : '',
                    ]"
                    @input="$emit('update:modelValue', $event.target.value)"
                    @blur="handleBlur"
                />
            </slot>
            
            <div v-if="$slots.prefix" class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <slot name="prefix"></slot>
            </div>
            
            <div v-if="$slots.suffix" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <slot name="suffix"></slot>
            </div>
        </div>
        
        <p v-if="hint && !hasError" class="text-xs text-gray-500">
            {{ hint }}
        </p>
        
        <p v-if="hasError" class="text-xs text-red-600 flex items-center gap-1">
            <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
            {{ error }}
        </p>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline';
// Simple UUID-like generator
const generateId = () => {
    return 'field-' + Math.random().toString(36).substr(2, 9);
};

const props = defineProps({
    label: {
        type: String,
        default: '',
    },
    modelValue: {
        type: [String, Number],
        default: '',
    },
    type: {
        type: String,
        default: 'text',
    },
    placeholder: {
        type: String,
        default: '',
    },
    hint: {
        type: String,
        default: '',
    },
    error: {
        type: String,
        default: '',
    },
    required: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    validateOnBlur: {
        type: Boolean,
        default: true,
    },
    rules: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(['update:modelValue', 'validate', 'blur']);

const id = ref(generateId());
const touched = ref(false);
const internalError = ref('');

const hasError = computed(() => {
    return Boolean(props.error || internalError.value);
});

const validate = () => {
    if (!props.rules || props.rules.length === 0) {
        internalError.value = '';
        return true;
    }
    
    for (const rule of props.rules) {
        const result = typeof rule === 'function' ? rule(props.modelValue) : rule;
        
        if (result !== true) {
            internalError.value = typeof result === 'string' ? result : 'Validation failed';
            emit('validate', false);
            return false;
        }
    }
    
    internalError.value = '';
    emit('validate', true);
    return true;
};

const handleBlur = () => {
    touched.value = true;
    if (props.validateOnBlur) {
        validate();
    }
    emit('blur');
};

watch(() => props.modelValue, () => {
    if (touched.value && props.validateOnBlur) {
        validate();
    }
});
</script>
