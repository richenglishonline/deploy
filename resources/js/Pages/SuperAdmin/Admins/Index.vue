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
    MagnifyingGlassIcon,
    UserCircleIcon,
    EnvelopeIcon,
    GlobeAltIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const admins = ref([]);
const searchQuery = ref('');
const selectedRows = ref([]);

const columns = [
    {
        key: 'name',
        label: 'Name',
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
        key: 'created_at',
        label: 'Joined',
        sortable: true,
        format: 'date',
    },
    {
        key: 'assigned_teachers_count',
        label: 'Assigned Teachers',
        sortable: true,
        align: 'center',
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
];

const fetchAdmins = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/teacher', {
            params: { role: 'admin' },
        });
        // API returns { teachers: [...], pagination: {...} }
        const teachersList = Array.isArray(data.teachers) ? data.teachers : (Array.isArray(data) ? data : []);
        admins.value = teachersList.map(admin => ({
            ...admin,
            name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.name || admin.email,
            assigned_teachers_count: admin.assigned_teachers?.length || 0,
        }));
    } catch (error) {
        console.error('Error fetching admins:', error);
        admins.value = [];
    } finally {
        loading.value = false;
    }
};

const handleEdit = (row) => {
    router.visit(`/super-admin/admins/${row.id}`);
};

const handleDelete = async (admin) => {
    if (!confirm(`Are you sure you want to delete ${admin.name}?`)) return;
    
    try {
        await api.delete(`/teacher/${admin.id}`);
        await fetchAdmins();
    } catch (error) {
        console.error('Error deleting admin:', error);
        alert('Failed to delete admin');
    }
};

const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.value.length} admin(s)?`)) return;
    
    try {
        await Promise.all(selectedRows.value.map(admin => api.delete(`/teacher/${admin.id}`)));
        selectedRows.value = [];
        await fetchAdmins();
    } catch (error) {
        console.error('Error bulk deleting admins:', error);
        alert('Failed to delete some admins');
    }
};

const handleExport = (data) => {
    // Simple CSV export
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
        columns.map(col => `"${row[col.key] || ''}"`).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admins-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

const handleCreate = () => {
    router.visit('/super-admin/admins/create');
};

onMounted(() => {
    fetchAdmins();
});
</script>

<template>
    <Head title="Admins Management" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Admins Management</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        Manage system administrators and their permissions
                    </p>
                </div>
                <Button @click="handleCreate" variant="primary">
                    <PlusIcon class="h-5 w-5 mr-2" />
                    Add Admin
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Admins</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">{{ admins.length }}</p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <UserCircleIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Active Admins</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ admins.filter(a => a.accepted).length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <UserCircleIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Assigned Teachers</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ admins.reduce((sum, a) => sum + (a.assigned_teachers_count || 0), 0) }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <UserCircleIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Admins Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Admins"
                :columns="columns"
                :data="admins"
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
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                            <span class="text-sm font-semibold text-white">
                                {{ row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
                            </span>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">{{ row.name }}</div>
                            <div v-if="row.role" class="text-xs text-gray-500">
                                <Badge :variant="row.role === 'super-admin' ? 'primary' : 'secondary'">
                                    {{ row.role }}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </template>

                <template #cell-email="{ row }">
                    <div class="flex items-center gap-2 text-gray-900">
                        <EnvelopeIcon class="h-4 w-4 text-gray-400" />
                        {{ row.email }}
                    </div>
                </template>

                <template #cell-country="{ row }">
                    <div class="flex items-center gap-2 text-gray-900">
                        <GlobeAltIcon class="h-4 w-4 text-gray-400" />
                        {{ row.country || '—' }}
                    </div>
                </template>

                <template #cell-assigned_teachers_count="{ row }">
                    <Badge variant="secondary">
                        {{ row.assigned_teachers_count || 0 }}
                    </Badge>
                </template>

                <template #row-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
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
