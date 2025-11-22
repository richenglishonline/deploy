<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    EyeIcon,
    BookOpenIcon,
    ArrowDownTrayIcon,
    DocumentTextIcon,
    CalendarIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const books = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'title',
        label: 'Book',
        sortable: true,
    },
    {
        key: 'author',
        label: 'Author',
        sortable: true,
    },
    {
        key: 'level',
        label: 'Level',
        sortable: true,
        align: 'center',
    },
    {
        key: 'assigned_date',
        label: 'Assigned',
        sortable: true,
        format: 'date',
    },
    {
        key: 'students_count',
        label: 'Students',
        sortable: true,
        align: 'center',
    },
];

const filters = [
    {
        key: 'level',
        label: 'Level',
        type: 'select',
        options: [
            { value: '', label: 'All Levels' },
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
        ],
    },
];

const fetchBooks = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/teacher/books');
        books.value = Array.isArray(data.books || data) ? (data.books || data).map(book => ({
            ...book,
            assigned_date: book.assigned_date || book.created_at,
            students_count: book.students?.length || 0,
        })) : [];
    } catch (error) {
        console.error('Error fetching books:', error);
        books.value = [];
    } finally {
        loading.value = false;
    }
};

const fetchStats = async () => {
    try {
        const { data } = await api.get('/dashboard/stats');
        stats.value = data?.dashboard || {};
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
};

const handleView = (row) => {
    router.visit(`/teacher/books/${row.id}`);
};

const handleDownload = async (book) => {
    try {
        const response = await api.get(`/books/${book.id}/download`, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', book.file_name || `${book.title}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading book:', error);
        alert('Failed to download book');
    }
};

onMounted(() => {
    fetchBooks();
    fetchStats();
});
</script>

<template>
    <Head title="My Books" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">My Books</h1>
                <p class="mt-1 text-sm text-gray-500">
                    View assigned books and materials
                </p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Books</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ books.length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <BookOpenIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Active Assignments</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ books.filter(b => b.students_count > 0).length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">In use</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <DocumentTextIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Students</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ books.reduce((sum, b) => sum + (b.students_count || 0), 0) }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Assigned</p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <CalendarIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Books Table -->
            <AdvancedTable
                v-if="!loading"
                title="Assigned Books"
                :columns="columns"
                :data="books"
                :searchable="true"
                :paginated="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
            >
                <template #cell-title="{ row }">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                            <BookOpenIcon class="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">{{ row.title || 'Untitled' }}</div>
                            <div v-if="row.isbn" class="text-xs text-gray-500">ISBN: {{ row.isbn }}</div>
                        </div>
                    </div>
                </template>

                <template #cell-author="{ row }">
                    <div class="text-gray-900">{{ row.author || '—' }}</div>
                </template>

                <template #cell-level="{ row }">
                    <Badge 
                        :variant="row.level === 'beginner' ? 'primary' : row.level === 'intermediate' ? 'warning' : 'success'"
                    >
                        {{ row.level || 'N/A' }}
                    </Badge>
                </template>

                <template #cell-assigned_date="{ row }">
                    <div class="flex items-center gap-2 text-gray-900">
                        <CalendarIcon class="h-4 w-4 text-gray-400" />
                        {{ row.assigned_date ? new Date(row.assigned_date).toLocaleDateString() : '—' }}
                    </div>
                </template>

                <template #cell-students_count="{ row }">
                    <Badge variant="secondary">
                        {{ row.students_count || 0 }} students
                    </Badge>
                </template>

                <template #row-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            @click="handleDownload(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600 transition-colors"
                            title="Download"
                        >
                            <ArrowDownTrayIcon class="h-5 w-5" />
                        </button>
                        <button
                            @click="handleView(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            title="View Details"
                        >
                            <EyeIcon class="h-5 w-5" />
                        </button>
                    </div>
                </template>
            </AdvancedTable>

            <!-- Loading State -->
            <div v-else class="space-y-4">
                <div class="h-64 rounded-xl bg-gray-200 animate-pulse"></div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>