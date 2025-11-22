<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Button from '@/Components/ui/Button.vue';
import Badge from '@/Components/ui/Badge.vue';
import Card from '@/Components/ui/Card.vue';
import {
    EyeIcon,
    PencilIcon,
    AcademicCapIcon,
    UserGroupIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
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
        key: 'students_count',
        label: 'Assigned Students',
        sortable: true,
        align: 'center',
    },
    {
        key: 'classes_count',
        label: 'Classes This Month',
        sortable: true,
        align: 'center',
    },
    {
        key: 'attendance_rate',
        label: 'Attendance Rate',
        sortable: true,
        align: 'center',
        format: 'percentage',
    },
    {
        key: 'status',
        label: 'Status',
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

const fetchTeachers = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/admin/teachers');
        teachers.value = Array.isArray(data.teachers || data) ? (data.teachers || data).map(teacher => ({
            ...teacher,
            name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.email || 'Unnamed Teacher',
            students_count: teacher.students?.length || 0,
            classes_count: teacher.classes_this_month || 0,
            attendance_rate: teacher.attendance_rate || 0,
            status: teacher.accepted ? 'active' : 'pending',
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
    router.visit(`/admin/teachers/${row.id}`);
};

const handleEdit = (row) => {
    router.visit(`/admin/teachers/${row.id}/edit`);
};

onMounted(() => {
    fetchTeachers();
    fetchStats();
});
</script>

<template>
    <Head title="Assigned Teachers" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Assigned Teachers</h1>
                <p class="mt-1 text-sm text-gray-500">
                    View and manage teachers assigned to you
                </p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Assigned Teachers</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ teachers.length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Total assigned</p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <AcademicCapIcon class="h-8 w-8 text-blue-600" />
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
                            <p class="mt-1 text-xs text-gray-500">Across all teachers</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <UserGroupIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Avg Attendance</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ teachers.length > 0 
                                    ? (teachers.reduce((sum, t) => sum + (t.attendance_rate || 0), 0) / teachers.length).toFixed(1)
                                    : '0'
                                }}%
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Average rate</p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <CheckCircleIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Teachers Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Assigned Teachers"
                :columns="columns"
                :data="teachers"
                :searchable="true"
                :paginated="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
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

                <template #cell-attendance_rate="{ row }">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">{{ row.attendance_rate || 0 }}%</span>
                        <div class="h-2 w-16 rounded-full bg-gray-200">
                            <div 
                                class="h-2 rounded-full"
                                :class="{
                                    'bg-green-500': row.attendance_rate >= 90,
                                    'bg-yellow-500': row.attendance_rate >= 75 && row.attendance_rate < 90,
                                    'bg-red-500': row.attendance_rate < 75,
                                }"
                                :style="{ width: `${Math.min(row.attendance_rate || 0, 100)}%` }"
                            ></div>
                        </div>
                    </div>
                </template>

                <template #cell-status="{ row }">
                    <Badge 
                        :variant="row.status === 'active' ? 'success' : 'warning'"
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