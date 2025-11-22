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
    AcademicCapIcon,
    UserGroupIcon,
    BookOpenIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const teachers = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'name',
        label: 'Teacher',
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
        key: 'status',
        label: 'Status',
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
        key: 'classes_count',
        label: 'Classes',
        sortable: true,
        align: 'center',
    },
    {
        key: 'acceptance_rate',
        label: 'Acceptance Rate',
        sortable: true,
        align: 'center',
        format: 'percentage',
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
        ],
    },
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: '', label: 'All Statuses' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'pending', label: 'Pending' },
            { value: 'rejected', label: 'Rejected' },
        ],
    },
];

const fetchTeachers = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/teacher');
        teachers.value = Array.isArray(data.teachers || data) ? (data.teachers || data).map(teacher => ({
            ...teacher,
            name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.email || 'Unnamed Teacher',
            status: teacher.accepted ? 'accepted' : (teacher.meta?.teacher_application_status === 'rejected' ? 'rejected' : 'pending'),
            students_count: teacher.students?.length || 0,
            classes_count: teacher.classes?.length || 0,
            acceptance_rate: teacher.acceptance_rate || 0,
        })) : [];
    } catch (error) {
        console.error('Error fetching teachers:', error);
        teachers.value = [];
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
    router.visit(`/super-admin/teachers/${row.id}`);
};

const handleEdit = (row) => {
    router.visit(`/super-admin/teachers/${row.id}?edit=true`);
};

const handleDelete = async (teacher) => {
    if (!confirm(`Are you sure you want to delete ${teacher.name}? This action cannot be undone.`)) return;
    
    try {
        await api.delete(`/teacher/${teacher.id}`);
        await fetchTeachers();
        await fetchStats();
    } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Failed to delete teacher');
    }
};

const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.value.length} teacher(s)? This action cannot be undone.`)) return;
    
    try {
        await Promise.all(selectedRows.value.map(teacher => api.delete(`/teacher/${teacher.id}`)));
        selectedRows.value = [];
        await fetchTeachers();
        await fetchStats();
    } catch (error) {
        console.error('Error bulk deleting teachers:', error);
        alert('Failed to delete some teachers');
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
    a.download = `teachers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

onMounted(() => {
    fetchTeachers();
    fetchStats();
});
</script>

<template>
    <Head title="Teachers Management" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Teachers Management</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        Manage all teachers in the platform
                    </p>
                </div>
                <Button @click="() => router.visit('/super-admin/teacher-applications')" variant="primary">
                    <AcademicCapIcon class="h-5 w-5 mr-2" />
                    Review Applications
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Teachers</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ stats?.totalTeachers || teachers.length }}
                            </p>
                            <p class="mt-1 text-xs text-green-600">+5% from last month</p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <AcademicCapIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Active Teachers</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ teachers.filter(t => t.status === 'accepted').length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Accepted</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <CheckCircleIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Pending Applications</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ teachers.filter(t => t.status === 'pending').length }}
                            </p>
                            <p class="mt-1 text-xs text-yellow-600">Requires review</p>
                        </div>
                        <div class="rounded-lg bg-yellow-50 p-3">
                            <XCircleIcon class="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Students</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ teachers.reduce((sum, t) => sum + (t.students_count || 0), 0) }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Assigned</p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <UserGroupIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Teachers Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Teachers"
                :columns="columns"
                :data="teachers"
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
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                            <span class="text-sm font-semibold text-white">
                                {{ row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
                            </span>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">{{ row.name }}</div>
                            <div v-if="row.degree" class="text-xs text-gray-500">{{ row.degree }}</div>
                        </div>
                    </div>
                </template>

                <template #cell-email="{ row }">
                    <div class="text-gray-900">{{ row.email || '—' }}</div>
                </template>

                <template #cell-country="{ row }">
                    <div class="text-gray-900">{{ row.country || '—' }}</div>
                </template>

                <template #cell-status="{ row }">
                    <Badge 
                        :variant="row.status === 'accepted' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'"
                    >
                        {{ row.status || 'pending' }}
                    </Badge>
                </template>

                <template #cell-students_count="{ row }">
                    <Badge variant="secondary">
                        <UserGroupIcon class="h-3 w-3 mr-1 inline" />
                        {{ row.students_count || 0 }}
                    </Badge>
                </template>

                <template #cell-classes_count="{ row }">
                    <Badge variant="secondary">
                        <CalendarIcon class="h-3 w-3 mr-1 inline" />
                        {{ row.classes_count || 0 }}
                    </Badge>
                </template>

                <template #cell-acceptance_rate="{ row }">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">{{ row.acceptance_rate || 0 }}%</span>
                        <div class="h-2 w-16 rounded-full bg-gray-200">
                            <div 
                                class="h-2 rounded-full bg-green-500"
                                :style="{ width: `${Math.min(row.acceptance_rate || 0, 100)}%` }"
                            ></div>
                        </div>
                    </div>
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