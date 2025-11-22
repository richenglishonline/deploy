<template>
    <div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <!-- Table Header -->
        <div v-if="title || searchable || $slots.actions" class="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 v-if="title" class="text-lg font-semibold text-gray-900">{{ title }}</h3>
                <div class="flex flex-1 items-center gap-3 sm:justify-end">
                    <div v-if="searchable" class="flex-1 max-w-md">
                        <div class="relative">
                            <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                v-model="searchQuery"
                                type="text"
                                :placeholder="searchPlaceholder"
                                class="block w-full rounded-lg border-0 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <slot name="actions"></slot>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th
                            v-for="column in columns"
                            :key="column.key"
                            scope="col"
                            :class="[
                                'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700',
                                column.align === 'right' ? 'text-right' : '',
                                column.align === 'center' ? 'text-center' : '',
                            ]"
                        >
                            <div class="flex items-center gap-2">
                                {{ column.label }}
                                <button
                                    v-if="column.sortable"
                                    @click="handleSort(column.key)"
                                    class="text-gray-400 hover:text-gray-600"
                                >
                                    <ArrowsUpDownIcon class="h-4 w-4" />
                                </button>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    <tr
                        v-for="(row, index) in paginatedData"
                        :key="getRowKey(row, index)"
                        class="transition-colors hover:bg-gray-50"
                    >
                        <td
                            v-for="column in columns"
                            :key="column.key"
                            :class="[
                                'whitespace-nowrap px-6 py-4 text-sm text-gray-900',
                                column.align === 'right' ? 'text-right' : '',
                                column.align === 'center' ? 'text-center' : '',
                            ]"
                        >
                            <slot
                                :name="`cell-${column.key}`"
                                :row="row"
                                :value="row[column.key]"
                                :index="index"
                            >
                                {{ formatCellValue(row[column.key], column) }}
                            </slot>
                        </td>
                    </tr>
                    <tr v-if="filteredData.length === 0">
                        <td
                            :colspan="columns.length"
                            class="px-6 py-12 text-center text-sm text-gray-500"
                        >
                            <div class="flex flex-col items-center gap-2">
                                <InboxIcon class="h-12 w-12 text-gray-300" />
                                <p>No data available</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div
            v-if="paginated && totalPages > 1"
            class="border-t border-gray-200 bg-gray-50/50 px-6 py-4 sm:flex sm:items-center sm:justify-between"
        >
            <div class="mb-4 text-sm text-gray-700 sm:mb-0">
                Showing
                <span class="font-medium">{{ startIndex + 1 }}</span>
                to
                <span class="font-medium">{{ endIndex }}</span>
                of
                <span class="font-medium">{{ filteredData.length }}</span>
                results
            </div>
            <div class="flex items-center gap-2">
                <button
                    @click="currentPage--"
                    :disabled="currentPage === 1"
                    class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <span class="text-sm text-gray-700">
                    Page {{ currentPage }} of {{ totalPages }}
                </span>
                <button
                    @click="currentPage++"
                    :disabled="currentPage >= totalPages"
                    class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    InboxIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
    title: {
        type: String,
        default: '',
    },
    columns: {
        type: Array,
        required: true,
    },
    data: {
        type: Array,
        required: true,
    },
    searchable: {
        type: Boolean,
        default: false,
    },
    searchPlaceholder: {
        type: String,
        default: 'Search...',
    },
    paginated: {
        type: Boolean,
        default: false,
    },
    itemsPerPage: {
        type: Number,
        default: 10,
    },
    rowKey: {
        type: [String, Function],
        default: 'id',
    },
});

const searchQuery = ref('');
const currentPage = ref(1);
const sortKey = ref(null);
const sortDirection = ref('asc');

const getRowKey = (row, index) => {
    if (typeof props.rowKey === 'function') {
        return props.rowKey(row, index);
    }
    return row[props.rowKey] || index;
};

const handleSort = (key) => {
    if (sortKey.value === key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey.value = key;
        sortDirection.value = 'asc';
    }
};

const filteredData = computed(() => {
    let result = [...props.data];

    // Apply search
    if (props.searchable && searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter((row) =>
            props.columns.some((col) => {
                const value = row[col.key];
                return String(value || '').toLowerCase().includes(query);
            })
        );
    }

    // Apply sorting
    if (sortKey.value) {
        result.sort((a, b) => {
            const aVal = a[sortKey.value];
            const bVal = b[sortKey.value];
            const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return sortDirection.value === 'asc' ? comparison : -comparison;
        });
    }

    return result;
});

const totalPages = computed(() =>
    props.paginated ? Math.ceil(filteredData.value.length / props.itemsPerPage) : 1
);

const startIndex = computed(() =>
    props.paginated ? (currentPage.value - 1) * props.itemsPerPage : 0
);

const endIndex = computed(() =>
    props.paginated
        ? Math.min(startIndex.value + props.itemsPerPage, filteredData.value.length)
        : filteredData.value.length
);

const paginatedData = computed(() => {
    if (!props.paginated) return filteredData.value;
    return filteredData.value.slice(startIndex.value, endIndex.value);
});

const formatCellValue = (value, column) => {
    if (value === null || value === undefined) return '—';
    if (column.format === 'currency') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(Number(value));
    }
    if (column.format === 'date') {
        return new Date(value).toLocaleDateString();
    }
    if (column.format === 'datetime') {
        return new Date(value).toLocaleString();
    }
    return value;
};
</script>

