<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    EyeIcon,
    AcademicCapIcon,
    BookOpenIcon,
    CalendarIcon,
    ClockIcon,
    UserGroupIcon,
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
        key: 'classes_count',
        label: 'Total Classes',
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
        key: 'last_class',
        label: 'Last Class',
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
        ],
    },
];

const fetchStudents = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/teacher/students');
        students.value = Array.isArray(data) ? data.map(student => ({
            ...student,
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.email || 'Unnamed Student',
            classes_count: student.classes?.length || 0,
            attendance_rate: student.attendance_rate || 0,
            last_class: student.last_class_date || null,
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
        stats.value = data?.dashboard || {};
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
};

const handleView = (row) => {
    router.visit(`/teacher/students/${row.id}`);
};

onMounted(() => {
    fetchStudents();
    fetchStats();
});
</script>

<template>
    <Head title="My Students" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">My Students</h1>
                <p class="mt-1 text-sm text-gray-500">
                    View and manage your assigned students
                </p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Students</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ students.length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <UserGroupIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Classes</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ students.reduce((sum, s) => sum + (s.classes_count || 0), 0) }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <CalendarIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Avg Attendance</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ students.length > 0 
                                    ? (students.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / students.length).toFixed(1)
                                    : '0'
                                }}%
                            </p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <ClockIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Students Table -->
            <AdvancedTable
                v-if="!loading"
                title="Assigned Students"
                :columns="columns"
                :data="students"
                :searchable="true"
                :paginated="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
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

                <template #cell-classes_count="{ row }">
                    <Badge variant="secondary">
                        <BookOpenIcon class="h-3 w-3 mr-1 inline" />
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

                <template #row-actions="{ row }">
                    <button
                        @click="handleView(row)"
                        class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        title="View Details"
                    >
                        <EyeIcon class="h-5 w-5" />
                    </button>
                </template>
            </AdvancedTable>

            <!-- Loading State -->
            <div v-else class="space-y-4">
                <div class="h-64 rounded-xl bg-gray-200 animate-pulse"></div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>