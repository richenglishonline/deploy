<script setup>
import { ref, computed, watch } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    MagnifyingGlassIcon,
    AcademicCapIcon,
    UserGroupIcon,
    BookOpenIcon,
    CalendarIcon,
    DocumentTextIcon,
    ArrowRightIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const searchQuery = ref('');
const loading = ref(false);
const results = ref([]);
const searchHistory = ref([]);

const categories = [
    { key: 'all', label: 'All', icon: MagnifyingGlassIcon, color: 'blue' },
    { key: 'teachers', label: 'Teachers', icon: AcademicCapIcon, color: 'indigo' },
    { key: 'students', label: 'Students', icon: UserGroupIcon, color: 'green' },
    { key: 'books', label: 'Books', icon: BookOpenIcon, color: 'purple' },
    { key: 'classes', label: 'Classes', icon: CalendarIcon, color: 'orange' },
    { key: 'assignments', label: 'Assignments', icon: DocumentTextIcon, color: 'pink' },
];

const selectedCategory = ref('all');

const performSearch = async () => {
    if (!searchQuery.value.trim()) {
        results.value = [];
        return;
    }

    loading.value = true;
    try {
        const { data } = await api.get('/search', {
            params: {
                q: searchQuery.value,
                category: selectedCategory.value !== 'all' ? selectedCategory.value : undefined,
            },
        });
        results.value = data.results || data || [];
        
        // Add to search history
        if (searchQuery.value.trim() && !searchHistory.value.includes(searchQuery.value.trim())) {
            searchHistory.value.unshift(searchQuery.value.trim());
            if (searchHistory.value.length > 5) {
                searchHistory.value.pop();
            }
        }
    } catch (error) {
        console.error('Error performing search:', error);
        results.value = [];
    } finally {
        loading.value = false;
    }
};

const handleResultClick = (result) => {
    const routeMap = {
        teacher: `/super-admin/teachers/${result.id}`,
        student: `/super-admin/students/${result.id}`,
        book: `/super-admin/books/${result.id}`,
        class: `/super-admin/classes/${result.id}`,
        assignment: `/super-admin/assignments/${result.id}`,
    };
    
    if (routeMap[result.type]) {
        router.visit(routeMap[result.type]);
    }
};

const selectHistory = (term) => {
    searchQuery.value = term;
    performSearch();
};

const groupedResults = computed(() => {
    const grouped = {};
    results.value.forEach(result => {
        if (!grouped[result.type]) {
            grouped[result.type] = [];
        }
        grouped[result.type].push(result);
    });
    return grouped;
});

watch([searchQuery], () => {
    const timeout = setTimeout(() => {
        performSearch();
    }, 300);
    return () => clearTimeout(timeout);
});
</script>

<template>
    <Head title="Search" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Global Search</h1>
                <p class="mt-1 text-sm text-gray-500">
                    Search across all system data
                </p>
            </div>

            <!-- Search Bar -->
            <Card class="p-6">
                <div class="space-y-4">
                    <div class="relative">
                        <MagnifyingGlassIcon class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search teachers, students, books, classes, assignments..."
                            class="block w-full rounded-lg border-0 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            @keyup.enter="performSearch"
                        />
                    </div>

                    <!-- Category Filters -->
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="category in categories"
                            :key="category.key"
                            @click="selectedCategory = category.key; performSearch()"
                            :class="[
                                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                                selectedCategory === category.key
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                            ]"
                        >
                            <component :is="category.icon" class="h-4 w-4" />
                            {{ category.label }}
                        </button>
                    </div>

                    <!-- Search History -->
                    <div v-if="searchHistory.length > 0 && !searchQuery" class="flex flex-wrap gap-2">
                        <span class="text-xs font-medium text-gray-500">Recent:</span>
                        <button
                            v-for="(term, index) in searchHistory"
                            :key="index"
                            @click="selectHistory(term)"
                            class="rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
                        >
                            {{ term }}
                        </button>
                    </div>
                </div>
            </Card>

            <!-- Results -->
            <div v-if="loading" class="space-y-4">
                <div class="h-64 rounded-xl bg-gray-200 animate-pulse"></div>
            </div>

            <div v-else-if="searchQuery && results.length === 0" class="text-center py-12">
                <MagnifyingGlassIcon class="mx-auto h-12 w-12 text-gray-300" />
                <p class="mt-4 text-sm font-medium text-gray-900">No results found</p>
                <p class="mt-1 text-sm text-gray-500">Try adjusting your search query</p>
            </div>

            <div v-else-if="results.length > 0" class="space-y-6">
                <div
                    v-for="(typeResults, type) in groupedResults"
                    :key="type"
                    class="space-y-4"
                >
                    <h3 class="text-lg font-semibold text-gray-900 capitalize">
                        {{ categories.find(c => c.key === type)?.label || type }} ({{ typeResults.length }})
                    </h3>
                    
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card
                            v-for="result in typeResults"
                            :key="result.id"
                            class="p-4 hover:shadow-md transition-shadow cursor-pointer"
                            @click="handleResultClick(result)"
                        >
                            <div class="flex items-start gap-3">
                                <div :class="[
                                    'rounded-lg p-2',
                                    `bg-${categories.find(c => c.key === type)?.color || 'blue'}-50`
                                ]">
                                    <component
                                        :is="categories.find(c => c.key === type)?.icon || MagnifyingGlassIcon"
                                        :class="[
                                            'h-5 w-5',
                                            `text-${categories.find(c => c.key === type)?.color || 'blue'}-600`
                                        ]"
                                    />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="font-medium text-gray-900 truncate">
                                        {{ result.title || result.name || result.email || 'Untitled' }}
                                    </h4>
                                    <p v-if="result.description" class="mt-1 text-sm text-gray-500 line-clamp-2">
                                        {{ result.description }}
                                    </p>
                                    <div v-if="result.meta" class="mt-2 flex flex-wrap gap-2">
                                        <Badge
                                            v-for="(value, key) in result.meta"
                                            :key="key"
                                            variant="secondary"
                                            class="text-xs"
                                        >
                                            {{ key }}: {{ value }}
                                        </Badge>
                                    </div>
                                </div>
                                <ArrowRightIcon class="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <Card v-else class="p-12 text-center">
                <MagnifyingGlassIcon class="mx-auto h-12 w-12 text-gray-300" />
                <p class="mt-4 text-sm font-medium text-gray-900">Start searching</p>
                <p class="mt-1 text-sm text-gray-500">
                    Enter a search term to find teachers, students, books, classes, and more
                </p>
            </Card>
        </div>
    </AuthenticatedLayout>
</template>