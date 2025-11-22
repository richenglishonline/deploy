<template>
    <div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <!-- Table Header -->
        <div v-if="title || searchable || $slots.filters || $slots.actions" class="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
            <div class="flex flex-col gap-4">
                <!-- Title and Actions Row -->
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 v-if="title" class="text-lg font-semibold text-gray-900">{{ title }}</h3>
                    <div class="flex flex-1 items-center gap-3 sm:justify-end">
                        <!-- Search -->
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
                        <!-- Export Button -->
                        <button
                            v-if="exportable"
                            @click="handleExport"
                            class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <ArrowDownTrayIcon class="h-4 w-4" />
                            Export
                        </button>
                        <slot name="actions"></slot>
                    </div>
                </div>

                <!-- Filters Row -->
                <div v-if="$slots.filters || (filters && filters.length > 0)" class="flex flex-wrap items-center gap-3">
                    <slot name="filters">
                        <template v-for="filter in filters" :key="filter.key">
                            <select
                                v-if="filter.type === 'select'"
                                v-model="filterValues[filter.key]"
                                @change="handleFilter"
                                class="rounded-lg border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{{ filter.label }}</option>
                                <option v-for="option in filter.options" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </option>
                            </select>
                        </template>
                    </slot>
                </div>

                <!-- Bulk Actions -->
                <div v-if="selectedRows.length > 0" class="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                    <span class="text-sm font-medium text-blue-900">
                        {{ selectedRows.length }} {{ selectedRows.length === 1 ? 'item' : 'items' }} selected
                    </span>
                    <div class="flex items-center gap-2">
                        <slot name="bulk-actions" :selected-rows="selectedRows">
                            <button
                                @click="handleBulkDelete"
                                class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <TrashIcon class="h-4 w-4" />
                                Delete Selected
                            </button>
                        </slot>
                        <button
                            @click="clearSelection"
                            class="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <!-- Checkbox Column -->
                        <th v-if="selectable" scope="col" class="relative w-12 px-6 sm:w-16 sm:px-8">
                            <input
                                type="checkbox"
                                :checked="allSelected"
                                @change="toggleSelectAll"
                                class="absolute left-4 top-1/2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
                            />
                        </th>
                        <!-- Data Columns -->
                        <th
                            v-for="column in columns"
                            :key="column.key"
                            scope="col"
                            :class="[
                                'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700',
                                column.align === 'right' ? 'text-right' : '',
                                column.align === 'center' ? 'text-center' : '',
                                column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : '',
                            ]"
                            @click="column.sortable && handleSort(column.key)"
                        >
                            <div class="flex items-center gap-2">
                                {{ column.label }}
                                <button
                                    v-if="column.sortable"
                                    class="text-gray-400 hover:text-gray-600"
                                >
                                    <ArrowUpIcon v-if="sortKey === column.key && sortDirection === 'asc'" class="h-4 w-4" />
                                    <ArrowDownIcon v-else-if="sortKey === column.key && sortDirection === 'desc'" class="h-4 w-4" />
                                    <ArrowsUpDownIcon v-else class="h-4 w-4" />
                                </button>
                            </div>
                        </th>
                        <!-- Actions Column -->
                        <th v-if="$slots['row-actions']" scope="col" class="relative px-6 py-3 text-right">
                            <span class="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    <tr
                        v-for="(row, index) in paginatedData"
                        :key="getRowKey(row, index)"
                        :class="[
                            'transition-colors hover:bg-gray-50',
                            isSelected(row, index) ? 'bg-blue-50' : '',
                        ]"
                    >
                        <!-- Checkbox -->
                        <td v-if="selectable" class="relative w-12 px-6 sm:w-16 sm:px-8">
                            <input
                                type="checkbox"
                                :checked="isSelected(row, index)"
                                @change="toggleRow(row, index)"
                                class="absolute left-4 top-1/2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
                            />
                        </td>
                        <!-- Data Cells -->
                        <td
                            v-for="column in columns"
                            :key="column.key"
                            :class="[
                                'whitespace-nowrap px-6 py-4 text-sm',
                                column.align === 'right' ? 'text-right' : '',
                                column.align === 'center' ? 'text-center' : '',
                                column.format === 'currency' ? 'text-gray-900 font-medium' : 'text-gray-900',
                            ]"
                        >
                            <slot
                                :name="`cell-${column.key}`"
                                :row="row"
                                :value="row[column.key]"
                                :index="index"
                            >
                                <component
                                    v-if="column.component"
                                    :is="column.component"
                                    :value="row[column.key]"
                                    :row="row"
                                />
                                <span v-else>{{ formatCellValue(row[column.key], column) }}</span>
                            </slot>
                        </td>
                        <!-- Actions Cell -->
                        <td v-if="$slots['row-actions']" class="relative whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <slot name="row-actions" :row="row" :index="index"></slot>
                        </td>
                    </tr>
                    <tr v-if="filteredData.length === 0">
                        <td
                            :colspan="columns.length + (selectable ? 1 : 0) + ($slots['row-actions'] ? 1 : 0)"
                            class="px-6 py-12 text-center text-sm text-gray-500"
                        >
                            <div class="flex flex-col items-center gap-2">
                                <InboxIcon class="h-12 w-12 text-gray-300" />
                                <p class="font-medium">No data available</p>
                                <p v-if="searchQuery" class="text-xs text-gray-400">Try adjusting your search or filters</p>
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
                <span v-if="selectable && selectedRows.length > 0" class="ml-2 text-blue-600">
                    ({{ selectedRows.length }} selected)
                </span>
            </div>
            <div class="flex items-center gap-2">
                <!-- Items per page -->
                <select
                    v-if="itemsPerPageOptions && itemsPerPageOptions.length > 0"
                    v-model="currentItemsPerPage"
                    @change="currentPage = 1"
                    class="rounded-lg border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500"
                >
                    <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
                        {{ option }} per page
                    </option>
                </select>
                <button
                    @click="currentPage--"
                    :disabled="currentPage === 1"
                    class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Previous
                </button>
                <span class="text-sm text-gray-700">
                    Page {{ currentPage }} of {{ totalPages }}
                </span>
                <button
                    @click="currentPage++"
                    :disabled="currentPage >= totalPages"
                    class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Next
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    InboxIcon,
    ArrowDownTrayIcon,
    TrashIcon,
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
    itemsPerPageOptions: {
        type: Array,
        default: () => [10, 25, 50, 100],
    },
    rowKey: {
        type: [String, Function],
        default: 'id',
    },
    selectable: {
        type: Boolean,
        default: false,
    },
    filters: {
        type: Array,
        default: () => [],
    },
    exportable: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['export', 'bulk-delete', 'row-select', 'row-deselect']);

const searchQuery = ref('');
const currentPage = ref(1);
const currentItemsPerPage = ref(props.itemsPerPage);
const sortKey = ref(null);
const sortDirection = ref('asc');
const selectedRows = ref([]);
const filterValues = ref({});

// Initialize filter values
watch(() => props.filters, (filters) => {
    if (filters && filters.length > 0) {
        filters.forEach(filter => {
            if (!filterValues.value[filter.key]) {
                filterValues.value[filter.key] = '';
            }
        });
    }
}, { immediate: true });

const getRowKey = (row, index) => {
    if (typeof props.rowKey === 'function') {
        return props.rowKey(row, index);
    }
    return row[props.rowKey] || index;
};

const isSelected = (row, index) => {
    const key = getRowKey(row, index);
    return selectedRows.value.some(selected => getRowKey(selected, -1) === key);
};

const toggleRow = (row, index) => {
    const key = getRowKey(row, index);
    const existingIndex = selectedRows.value.findIndex(selected => getRowKey(selected, -1) === key);
    
    if (existingIndex >= 0) {
        selectedRows.value.splice(existingIndex, 1);
        emit('row-deselect', row, index);
    } else {
        selectedRows.value.push(row);
        emit('row-select', row, index);
    }
};

const toggleSelectAll = () => {
    if (allSelected.value) {
        selectedRows.value = [];
        emit('row-deselect', null, -1);
    } else {
        selectedRows.value = [...filteredData.value];
        emit('row-select', null, -1);
    }
};

const clearSelection = () => {
    selectedRows.value = [];
};

const allSelected = computed(() => {
    if (filteredData.value.length === 0) return false;
    return filteredData.value.every((row, index) => isSelected(row, index));
});

const handleSort = (key) => {
    if (sortKey.value === key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey.value = key;
        sortDirection.value = 'asc';
    }
};

const handleFilter = () => {
    currentPage.value = 1;
};

const handleExport = () => {
    emit('export', filteredData.value);
};

const handleBulkDelete = () => {
    emit('bulk-delete', selectedRows.value);
    clearSelection();
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

    // Apply filters
    if (props.filters && props.filters.length > 0) {
        props.filters.forEach(filter => {
            const filterValue = filterValues.value[filter.key];
            if (filterValue && filterValue !== '') {
                result = result.filter(row => {
                    const rowValue = row[filter.key];
                    return String(rowValue || '') === String(filterValue);
                });
            }
        });
    }

    // Apply sorting
    if (sortKey.value) {
        result.sort((a, b) => {
            const aVal = a[sortKey.value];
            const bVal = b[sortKey.value];
            
            // Handle null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            
            // Handle numbers
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            // Handle strings
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            const comparison = aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
            return sortDirection.value === 'asc' ? comparison : -comparison;
        });
    }

    return result;
});

const totalPages = computed(() =>
    props.paginated ? Math.ceil(filteredData.value.length / currentItemsPerPage.value) : 1
);

const startIndex = computed(() =>
    props.paginated ? (currentPage.value - 1) * currentItemsPerPage.value : 0
);

const endIndex = computed(() =>
    props.paginated
        ? Math.min(startIndex.value + currentItemsPerPage.value, filteredData.value.length)
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
    
    if (column.format === 'percentage') {
        return `${Number(value).toFixed(1)}%`;
    }
    
    if (column.format === 'date') {
        return new Date(value).toLocaleDateString();
    }
    
    if (column.format === 'datetime') {
        return new Date(value).toLocaleString();
    }
    
    if (column.format === 'time') {
        return new Date(value).toLocaleTimeString();
    }
    
    if (column.format === 'number') {
        return new Intl.NumberFormat('en-US').format(Number(value));
    }
    
    return value;
};

// Reset to page 1 when search/filter changes
watch([searchQuery, filterValues], () => {
    currentPage.value = 1;
}, { deep: true });
</script>
