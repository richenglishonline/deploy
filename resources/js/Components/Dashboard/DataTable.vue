<template>
    <div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div class="border-b border-gray-200 px-6 py-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
                <div class="flex flex-1 items-center gap-2 sm:justify-end">
                    <input
                        v-if="searchable"
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search..."
                        class="block w-full max-w-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <select
                        v-if="filterable"
                        v-model="selectedFilter"
                        class="block rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">All</option>
                        <option
                            v-for="option in filterOptions"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th
                            v-for="column in columns"
                            :key="column.key"
                            scope="col"
                            class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                        >
                            {{ column.label }}
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    <tr
                        v-for="(row, index) in filteredData"
                        :key="index"
                        class="transition-colors hover:bg-gray-50"
                    >
                        <td
                            v-for="column in columns"
                            :key="column.key"
                            class="whitespace-nowrap px-6 py-4 text-sm text-gray-900"
                        >
                            <slot
                                :name="`cell-${column.key}`"
                                :row="row"
                                :value="row[column.key]"
                            >
                                {{ row[column.key] }}
                            </slot>
                        </td>
                    </tr>
                    <tr v-if="filteredData.length === 0">
                        <td
                            :colspan="columns.length"
                            class="px-6 py-8 text-center text-sm text-gray-500"
                        >
                            No data available
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div
            v-if="paginated"
            class="border-t border-gray-200 px-6 py-4 sm:flex sm:items-center sm:justify-between"
        >
            <div class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ startIndex + 1 }}</span>
                to
                <span class="font-medium">{{ endIndex }}</span>
                of
                <span class="font-medium">{{ filteredData.length }}</span>
                results
            </div>
            <div class="mt-4 flex gap-2 sm:mt-0">
                <button
                    @click="currentPage--"
                    :disabled="currentPage === 1"
                    class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
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

const props = defineProps({
    title: {
        type: String,
        required: true,
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
    filterable: {
        type: Boolean,
        default: false,
    },
    filterOptions: {
        type: Array,
        default: () => [],
    },
    paginated: {
        type: Boolean,
        default: false,
    },
    itemsPerPage: {
        type: Number,
        default: 10,
    },
});

const searchQuery = ref('');
const selectedFilter = ref('');
const currentPage = ref(1);

const filteredData = computed(() => {
    let result = [...props.data];

    // Apply search
    if (props.searchable && searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter((row) =>
            props.columns.some((col) =>
                String(row[col.key] || '').toLowerCase().includes(query)
            )
        );
    }

    // Apply filter
    if (props.filterable && selectedFilter.value) {
        // Assuming filter is applied to first column, adjust as needed
        result = result.filter(
            (row) => String(row[props.columns[0]?.key]) === selectedFilter.value
        );
    }

    // Apply pagination
    if (props.paginated) {
        const start = (currentPage.value - 1) * props.itemsPerPage;
        const end = start + props.itemsPerPage;
        return result.slice(start, end);
    }

    return result;
});

const totalPages = computed(() =>
    props.paginated
        ? Math.ceil(
              (props.searchable && searchQuery.value
                  ? filteredData.value.length
                  : props.data.length) / props.itemsPerPage
          )
        : 1
);

const startIndex = computed(() =>
    props.paginated ? (currentPage.value - 1) * props.itemsPerPage : 0
);

const endIndex = computed(() =>
    props.paginated
        ? Math.min(startIndex.value + props.itemsPerPage, filteredData.value.length)
        : filteredData.value.length
);
</script>

