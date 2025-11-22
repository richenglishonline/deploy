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
    PencilIcon,
    TrashIcon,
    EyeIcon,
    UserGroupIcon,
    AcademicCapIcon,
    BookOpenIcon,
    CalendarIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const students = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'name',
        label: 'Student',
        sortable: true,
    },
    {
        key: 'email',
        label: 'Email',
        sortable: true,
    },
    {
        key: 'country',
        label: 'Country',
        sortable: true,
    },
    {
        key: 'timezone',
        label: 'Timezone',
        sortable: true,
    },
    {
        key: 'teacher_count',
        label: 'Teachers',
        sortable: true,
        align: 'center',
    },
    {
        key: 'classes_count',
        label: 'Classes',
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
        label: 'Joined',
        sortable: true,
        format: 'date',
    },
];

const filters = [
    {
        key: 'country',
        label: 'Country',
        type: 'select',
        options: [
            { value: '', label: 'All Countries' },
            { value: 'Philippines', label: 'Philippines' },
            { value: 'USA', label: 'USA' },
            { value: 'India', label: 'India' },
            { value: 'China', label: 'China' },
        ],
    },
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: '', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' },
        ],
    },
];

const fetchStudents = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/students');
        students.value = Array.isArray(data) ? data.map(student => ({
            ...student,
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.email || 'Unnamed Student',
            teacher_count: student.teachers?.length || 0,
            classes_count: student.classes?.length || 0,
            status: student.status || (student.active !== false ? 'active' : 'inactive'),
        })) : [];
    } catch (error) {
        console.error('Error fetching students:', error);
        students.value = [];
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

const handleView = (row) => {
    router.visit(`/super-admin/students/${row.id}`);
};

const handleEdit = (row) => {
    router.visit(`/super-admin/students/${row.id}?edit=true`);
};

const handleDelete = async (student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) return;
    
    try {
        await api.delete(`/students/${student.id}`);
        await fetchStudents();
        await fetchStats();
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student');
    }
};

const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.value.length} student(s)? This action cannot be undone.`)) return;
    
    try {
        await Promise.all(selectedRows.value.map(student => api.delete(`/students/${student.id}`)));
        selectedRows.value = [];
        await fetchStudents();
        await fetchStats();
    } catch (error) {
        console.error('Error bulk deleting students:', error);
        alert('Failed to delete some students');
    }
};

const handleCreate = () => {
    router.visit('/super-admin/students/create');
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
    a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

onMounted(() => {
    fetchStudents();
    fetchStats();
});
</script>

<template>
    <Head title="Students Management" />

    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Students Management</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        Manage all students in the platform
                    </p>
                </div>
                <Button @click="handleCreate" variant="primary">
                    <PlusIcon class="h-5 w-5 mr-2" />
                    Add Student
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Students</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ stats?.totalStudents || students.length }}
                            </p>
                            <p class="mt-1 text-xs text-green-600">+12% from last month</p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <UserGroupIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Active Students</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ students.filter(s => s.status === 'active').length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Currently enrolled</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <UserGroupIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Classes</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ stats?.totalClasses || students.reduce((sum, s) => sum + (s.classes_count || 0), 0) }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Scheduled classes</p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <CalendarIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Avg Teachers/Student</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ students.length > 0 
                                    ? (students.reduce((sum, s) => sum + (s.teacher_count || 0), 0) / students.length).toFixed(1)
                                    : '0'
                                }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Per student</p>
                        </div>
                        <div class="rounded-lg bg-indigo-50 p-3">
                            <AcademicCapIcon class="h-8 w-8 text-indigo-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Students Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Students"
                :columns="columns"
                :data="students"
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
                <template #cell-name="{ row }">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-600">
                            <span class="text-sm font-semibold text-white">
                                {{ row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
                                    </span>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">{{ row.name }}</div>
                            <div v-if="row.timezone" class="text-xs text-gray-500">{{ row.timezone }}</div>
                </div>
            </div>
                </template>

                <template #cell-email="{ row }">
                    <div class="text-gray-900">{{ row.email || '—' }}</div>
                </template>

                <template #cell-country="{ row }">
                    <div class="text-gray-900">{{ row.country || '—' }}</div>
                </template>

                <template #cell-teacher_count="{ row }">
                    <Badge variant="secondary">
                        <AcademicCapIcon class="h-3 w-3 mr-1 inline" />
                        {{ row.teacher_count || 0 }}
                    </Badge>
                </template>

                <template #cell-classes_count="{ row }">
                    <Badge variant="secondary">
                        <BookOpenIcon class="h-3 w-3 mr-1 inline" />
                        {{ row.classes_count || 0 }}
                    </Badge>
                </template>

                <template #cell-status="{ row }">
                    <Badge 
                        :variant="row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'secondary'"
                    >
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