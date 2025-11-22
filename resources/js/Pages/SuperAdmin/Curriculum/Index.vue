<script setup>
import { ref, onMounted } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Button from '@/Components/ui/Button.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    PlusIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    BookOpenIcon,
    RectangleStackIcon,
    AcademicCapIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const curriculum = ref([]);

const columns = [
    {
        key: 'title',
        label: 'Curriculum',
        sortable: true,
    },
    {
        key: 'level',
        label: 'Level',
        sortable: true,
        align: 'center',
    },
    {
        key: 'books_count',
        label: 'Books',
        sortable: true,
        align: 'center',
    },
    {
        key: 'students_count',
        label: 'Students',
        sortable: true,
        align: 'center',
    },
    {
        key: 'status',
        label: 'Status',
        sortable: true,
        align: 'center',
    },
    {
        key: 'created_at',
        label: 'Created',
        sortable: true,
        format: 'date',
    },
];

const fetchCurriculum = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/curriculum');
        curriculum.value = Array.isArray(data.curriculums || data) ? (data.curriculums || data).map(item => ({
            ...item,
            books_count: item.books?.length || 0,
            students_count: item.students?.length || 0,
            status: item.status || 'active',
        })) : [];
    } catch (error) {
        console.error('Error fetching curriculum:', error);
        curriculum.value = [];
    } finally {
        loading.value = false;
    }
};

const handleCreate = () => {
    router.visit('/super-admin/curriculum/create');
};

const handleView = (row) => {
    router.visit(`/super-admin/curriculum/${row.id}`);
};

const handleEdit = (row) => {
    router.visit(`/super-admin/curriculum/${row.id}/edit`);
};

const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;
    
    try {
        await api.delete(`/curriculum/${item.id}`);
        await fetchCurriculum();
    } catch (error) {
        console.error('Error deleting curriculum:', error);
        alert('Failed to delete curriculum');
    }
};

onMounted(() => {
    fetchCurriculum();
});
</script>

<template>
    <Head title="Curriculum Management" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Curriculum Management</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        Organize and manage curriculum content
                    </p>
                </div>
                <Button @click="handleCreate" variant="primary">
                    <PlusIcon class="h-5 w-5 mr-2" />
                    Create Curriculum
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Curriculums</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ curriculum.length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <RectangleStackIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Books</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ curriculum.reduce((sum, c) => sum + (c.books_count || 0), 0) }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <BookOpenIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Students Enrolled</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ curriculum.reduce((sum, c) => sum + (c.students_count || 0), 0) }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <AcademicCapIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Curriculum Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Curriculums"
                :columns="columns"
                :data="curriculum"
                :searchable="true"
                :paginated="true"
                :exportable="true"
                :items-per-page="25"
                row-key="id"
            >
                <template #cell-title="{ row }">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                            <RectangleStackIcon class="h-5 w-5 text-white" />
                        </div>
                        <span class="font-medium text-gray-900">{{ row.title || 'Untitled' }}</span>
                    </div>
                </template>

                <template #cell-level="{ row }">
                    <Badge 
                        :variant="row.level === 'beginner' ? 'primary' : row.level === 'intermediate' ? 'warning' : 'success'"
                    >
                        {{ row.level || 'N/A' }}
                    </Badge>
                </template>

                <template #cell-books_count="{ row }">
                    <Badge variant="secondary">
                        <BookOpenIcon class="h-3 w-3 mr-1 inline" />
                        {{ row.books_count || 0 }}
                    </Badge>
                </template>

                <template #cell-students_count="{ row }">
                    <Badge variant="secondary">
                        <AcademicCapIcon class="h-3 w-3 mr-1 inline" />
                        {{ row.students_count || 0 }}
                    </Badge>
                </template>

                <template #cell-status="{ row }">
                    <Badge :variant="row.status === 'active' ? 'success' : 'secondary'">
                        {{ row.status || 'active' }}
                    </Badge>
                </template>

                <template #row-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
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