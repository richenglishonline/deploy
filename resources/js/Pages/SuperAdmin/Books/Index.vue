<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Button from '@/Components/ui/Button.vue';
import Badge from '@/Components/ui/Badge.vue';
import Card from '@/Components/ui/Card.vue';
import {
    PlusIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    BookOpenIcon,
    DocumentTextIcon,
    UserGroupIcon,
    ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const books = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'title',
        label: 'Title',
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
        key: 'category',
        label: 'Category',
        sortable: true,
    },
    {
        key: 'assigned_count',
        label: 'Assigned',
        sortable: true,
        align: 'center',
    },
    {
        key: 'file_size',
        label: 'File Size',
        sortable: true,
        align: 'right',
    },
    {
        key: 'created_at',
        label: 'Uploaded',
        sortable: true,
        format: 'date',
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
    {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
            { value: '', label: 'All Categories' },
            { value: 'grammar', label: 'Grammar' },
            { value: 'vocabulary', label: 'Vocabulary' },
            { value: 'reading', label: 'Reading' },
            { value: 'writing', label: 'Writing' },
        ],
    },
];

const fetchBooks = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/books');
        books.value = Array.isArray(data.books || data) ? (data.books || data).map(book => ({
            ...book,
            assigned_count: book.assignments?.length || 0,
            file_size: book.file_size ? `${(book.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
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
        stats.value = data?.stats || {};
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
};

const handleCreate = () => {
    router.visit('/super-admin/books/create');
};

const handleView = (row) => {
    router.visit(`/super-admin/books/${row.id}`);
};

const handleEdit = (row) => {
    router.visit(`/super-admin/books/${row.id}?edit=true`);
};

const handleDelete = async (book) => {
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) return;
    
    try {
        await api.delete(`/books/${book.id}`);
        await fetchBooks();
        await fetchStats();
    } catch (error) {
        console.error('Error deleting book:', error);
        alert('Failed to delete book');
    }
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

const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.value.length} book(s)?`)) return;
    
    try {
        await Promise.all(selectedRows.value.map(book => api.delete(`/books/${book.id}`)));
        selectedRows.value = [];
        await fetchBooks();
        await fetchStats();
    } catch (error) {
        console.error('Error bulk deleting books:', error);
        alert('Failed to delete some books');
    }
};

const handleExport = (data) => {
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
        columns.map(col => `"${row[col.key] || ''}"`).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `books-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

onMounted(() => {
    fetchBooks();
    fetchStats();
});
</script>

<template>
    <Head title="Books Management" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Books Management</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        Manage curriculum books and materials
                    </p>
                </div>
                <Button @click="handleCreate" variant="primary">
                    <PlusIcon class="h-5 w-5 mr-2" />
                    Upload Book
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Books</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ stats?.totalBooks || books.length }}
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
                            <p class="text-sm font-medium text-gray-600">Assigned Books</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ books.filter(b => b.assigned_count > 0).length }}
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
                            <p class="text-sm font-medium text-gray-600">Total Assignments</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ books.reduce((sum, b) => sum + (b.assigned_count || 0), 0) }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Active</p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <UserGroupIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Storage Used</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ (books.reduce((sum, b) => sum + (b.file_size ? parseFloat(b.file_size) : 0), 0) / 1024).toFixed(2) }} GB
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Total size</p>
                        </div>
                        <div class="rounded-lg bg-orange-50 p-3">
                            <ArrowDownTrayIcon class="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Books Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Books"
                :columns="columns"
                :data="books"
                :searchable="true"
                :paginated="true"
                :selectable="true"
                :exportable="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
                @export="handleExport"
                @bulk-delete="handleBulkDelete"
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

                <template #cell-category="{ row }">
                    <div class="text-gray-900">{{ row.category || '—' }}</div>
                </template>

                <template #cell-assigned_count="{ row }">
                    <Badge variant="secondary">
                        <UserGroupIcon class="h-3 w-3 mr-1 inline" />
                        {{ row.assigned_count || 0 }}
                    </Badge>
                </template>

                <template #cell-file_size="{ row }">
                    <div class="text-right text-gray-900">{{ row.file_size || '—' }}</div>
                </template>

                <template #row-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            @click="handleDownload(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
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
                        <button
                            @click="handleEdit(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            title="Edit"
                        >
                            <PencilIcon class="h-5 w-5" />
                        </button>
                        <button
                            @click="handleDelete(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 transition-colors"
                            title="Delete"
                        >
                            <TrashIcon class="h-5 w-5" />
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