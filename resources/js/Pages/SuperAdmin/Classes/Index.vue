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
    CalendarIcon,
    AcademicCapIcon,
    UserGroupIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const classes = ref([]);
const stats = ref(null);
const teacherOptions = ref([]);
const studentOptions = ref([]);

const columns = [
    {
        key: 'class_info',
        label: 'Class',
        sortable: false,
    },
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
        key: 'book',
        label: 'Book',
        sortable: true,
    },
    {
        key: 'schedule',
        label: 'Schedule',
        sortable: true,
    },
    {
        key: 'type',
        label: 'Type',
        sortable: true,
        align: 'center',
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
        key: 'teacher_id',
        label: 'Teacher',
        type: 'select',
        options: [
            { value: '', label: 'All Teachers' },
            ...teacherOptions.value.map(t => ({
                value: t.id,
                label: `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.email,
            })),
        ],
    },
    {
        key: 'student_id',
        label: 'Student',
        type: 'select',
        options: [
            { value: '', label: 'All Students' },
            ...studentOptions.value.map(s => ({
                value: s.id,
                label: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email,
            })),
        ],
    },
    {
        key: 'type',
        label: 'Type',
        type: 'select',
        options: [
            { value: '', label: 'All Types' },
            { value: 'regular', label: 'Regular' },
            { value: 'makeup', label: 'Makeup' },
            { value: 'trial', label: 'Trial' },
        ],
    },
];

const fetchClasses = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/class');
        classes.value = Array.isArray(data.classes || data) ? (data.classes || data).map(cls => ({
            ...cls,
            teacher: cls.teacher ? `${cls.teacher.first_name || ''} ${cls.teacher.last_name || ''}`.trim() || cls.teacher.email : 'N/A',
            student: cls.student ? `${cls.student.first_name || ''} ${cls.student.last_name || ''}`.trim() || cls.student.email : 'N/A',
            book: cls.book?.title || 'N/A',
            schedule: cls.start_time ? `${new Date(cls.start_time).toLocaleDateString()} ${new Date(cls.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A',
            status: cls.status || (cls.completed ? 'completed' : 'scheduled'),
        })) : [];
    } catch (error) {
        console.error('Error fetching classes:', error);
        classes.value = [];
    } finally {
        loading.value = false;
    }
};

const fetchOptions = async () => {
    try {
        const [teachersRes, studentsRes] = await Promise.all([
            api.get('/teacher').catch(() => ({ data: { teachers: [] } })),
            api.get('/students').catch(() => ({ data: [] })),
        ]);
        teacherOptions.value = teachersRes.data?.teachers || teachersRes.data || [];
        studentOptions.value = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data?.students || []);
    } catch (error) {
        console.error('Error fetching options:', error);
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
    router.visit(`/super-admin/classes/${row.id}`);
};

const handleExport = (data) => {
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
        columns.map(col => {
            const value = row[col.key] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

onMounted(() => {
    fetchOptions();
    fetchClasses();
    fetchStats();
});
</script>

<template>
    <Head title="Classes Management" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Classes Management</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        View and manage all scheduled classes
                    </p>
                </div>
                <Button @click="() => router.visit('/super-admin/classes/create')" variant="primary">
                    <PlusIcon class="h-5 w-5 mr-2" />
                    Create Class
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Classes</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ stats?.totalClasses || classes.length }}
                            </p>
                            <p class="mt-1 text-xs text-green-600">+8% from last month</p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <CalendarIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Scheduled</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ classes.filter(c => c.status === 'scheduled').length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Upcoming</p>
                        </div>
                        <div class="rounded-lg bg-yellow-50 p-3">
                            <ClockIcon class="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Completed</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ classes.filter(c => c.status === 'completed').length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">This month</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <CheckCircleIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Cancelled</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ classes.filter(c => c.status === 'cancelled').length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">This month</p>
                        </div>
                        <div class="rounded-lg bg-red-50 p-3">
                            <XCircleIcon class="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Classes Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Classes"
                :columns="columns"
                :data="classes"
                :searchable="true"
                :paginated="true"
                :exportable="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
                @export="handleExport"
            >
                <template #cell-class_info="{ row }">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                            <CalendarIcon class="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">Class #{{ row.id || 'N/A' }}</div>
                            <div v-if="row.duration" class="text-xs text-gray-500">{{ row.duration }} minutes</div>
                        </div>
                    </div>
                </template>

                <template #cell-teacher="{ row }">
                    <div class="flex items-center gap-2">
                        <AcademicCapIcon class="h-4 w-4 text-gray-400" />
                        <span class="text-gray-900">{{ row.teacher }}</span>
                    </div>
                </template>

                <template #cell-student="{ row }">
                    <div class="flex items-center gap-2">
                        <UserGroupIcon class="h-4 w-4 text-gray-400" />
                        <span class="text-gray-900">{{ row.student }}</span>
                    </div>
                </template>

                <template #cell-book="{ row }">
                    <div class="text-gray-900">{{ row.book || '—' }}</div>
                </template>

                <template #cell-schedule="{ row }">
                    <div class="text-gray-900">{{ row.schedule || '—' }}</div>
                </template>

                <template #cell-type="{ row }">
                    <Badge 
                        :variant="row.type === 'regular' ? 'primary' : row.type === 'makeup' ? 'warning' : 'secondary'"
                    >
                        {{ row.type || 'regular' }}
                    </Badge>
                </template>

                <template #cell-status="{ row }">
                    <Badge 
                        :variant="row.status === 'completed' ? 'success' : row.status === 'scheduled' ? 'primary' : 'danger'"
                    >
                        {{ row.status || 'scheduled' }}
                    </Badge>
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