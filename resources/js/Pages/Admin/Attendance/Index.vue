<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    EyeIcon,
    ChartBarIcon,
    CalendarIcon,
    ClockIcon,
    UserGroupIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const attendance = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'teacher',
        label: 'Teacher',
        sortable: true,
    },
    {
        key: 'student',
        label: 'Student',
        sortable: true,
    },
    {
        key: 'class',
        label: 'Class',
        sortable: true,
    },
    {
        key: 'date',
        label: 'Date',
        sortable: true,
        format: 'date',
    },
    {
        key: 'duration',
        label: 'Duration',
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
        key: 'hours',
        label: 'Hours',
        sortable: true,
        align: 'right',
        format: 'number',
    },
];

const filters = [
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: '', label: 'All Statuses' },
            { value: 'present', label: 'Present' },
            { value: 'absent', label: 'Absent' },
            { value: 'late', label: 'Late' },
        ],
    },
];

const fetchAttendance = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/admin/attendance');
        attendance.value = Array.isArray(data.attendances || data) ? (data.attendances || data).map(att => ({
            ...att,
            teacher: att.teacher ? `${att.teacher.first_name || ''} ${att.teacher.last_name || ''}`.trim() || att.teacher.email : 'N/A',
            student: att.student ? `${att.student.first_name || ''} ${att.student.last_name || ''}`.trim() || att.student.email : 'N/A',
            class: att.class_schedule ? `Class #${att.class_schedule.id}` : 'N/A',
            date: att.date || att.class_schedule?.start_time,
            duration: att.duration ? `${att.duration} min` : 'N/A',
            hours: att.hours || (att.duration ? (att.duration / 60).toFixed(2) : 0),
            status: att.status || 'present',
        })) : [];
    } catch (error) {
        console.error('Error fetching attendance:', error);
        attendance.value = [];
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
    router.visit(`/admin/attendance/${row.id}`);
};

const handleReports = () => {
    router.visit('/admin/attendance/reports');
};

const attendanceRate = computed(() => {
    const total = attendance.value.length;
    if (total === 0) return 0;
    const present = attendance.value.filter(att => att.status === 'present').length;
    return ((present / total) * 100).toFixed(1);
});

const totalHours = computed(() => {
    return attendance.value.reduce((sum, att) => sum + (parseFloat(att.hours) || 0), 0).toFixed(2);
});

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
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

onMounted(() => {
    fetchAttendance();
    fetchStats();
});
</script>

<template>
    <Head title="Attendance Tracking" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        Track and manage attendance for assigned teachers
                    </p>
                </div>
                <Button @click="handleReports" variant="primary">
                    <ChartBarIcon class="h-5 w-5 mr-2" />
                    View Reports
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Records</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ attendance.length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <CalendarIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Attendance Rate</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ attendanceRate }}%
                            </p>
                            <p class="mt-1 text-xs text-green-600">Overall</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <CheckCircleIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Hours</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ totalHours }}h
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Hours taught</p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <ClockIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Present Today</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ attendance.filter(a => {
                                    const today = new Date().toDateString();
                                    return a.date && new Date(a.date).toDateString() === today && a.status === 'present';
                                }).length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Today</p>
                        </div>
                        <div class="rounded-lg bg-emerald-50 p-3">
                            <UserGroupIcon class="h-8 w-8 text-emerald-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Attendance Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Attendance Records"
                :columns="columns"
                :data="attendance"
                :searchable="true"
                :paginated="true"
                :exportable="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
                @export="handleExport"
            >
                <template #cell-teacher="{ row }">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                            <span class="text-sm font-semibold text-white">
                                {{ row.teacher.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
                            </span>
                        </div>
                        <span class="font-medium text-gray-900">{{ row.teacher }}</span>
                    </div>
                </template>

                <template #cell-student="{ row }">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-600">
                            <span class="text-sm font-semibold text-white">
                                {{ row.student.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
                            </span>
                        </div>
                        <span class="font-medium text-gray-900">{{ row.student }}</span>
                    </div>
                </template>

                <template #cell-class="{ row }">
                    <div class="text-gray-900">{{ row.class || '—' }}</div>
                </template>

                <template #cell-date="{ row }">
                    <div class="flex items-center gap-2 text-gray-900">
                        <CalendarIcon class="h-4 w-4 text-gray-400" />
                        {{ row.date ? new Date(row.date).toLocaleDateString() : '—' }}
                    </div>
                </template>

                <template #cell-duration="{ row }">
                    <Badge variant="secondary">{{ row.duration || '—' }}</Badge>
                </template>

                <template #cell-status="{ row }">
                    <Badge 
                        :variant="row.status === 'present' ? 'success' : row.status === 'absent' ? 'danger' : 'warning'"
                    >
                        {{ row.status || 'present' }}
                    </Badge>
                </template>

                <template #cell-hours="{ row }">
                    <div class="text-right font-medium text-gray-900">
                        {{ parseFloat(row.hours || 0).toFixed(2) }}h
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