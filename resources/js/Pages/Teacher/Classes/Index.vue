<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    EyeIcon,
    CalendarIcon,
    ClockIcon,
    AcademicCapIcon,
    BookOpenIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const classes = ref([]);
const stats = ref(null);

const columns = [
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
        key: 'duration',
        label: 'Duration',
        sortable: true,
        align: 'center',
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
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: '', label: 'All Statuses' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
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
        ],
    },
];

const fetchClasses = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/teacher/classes');
        classes.value = Array.isArray(data.classes || data) ? (data.classes || data).map(cls => ({
            ...cls,
            student: cls.student ? `${cls.student.first_name || ''} ${cls.student.last_name || ''}`.trim() || cls.student.email : 'N/A',
            book: cls.book?.title || 'N/A',
            schedule: cls.start_time ? `${new Date(cls.start_time).toLocaleDateString()} ${new Date(cls.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A',
            duration: cls.duration || 'N/A',
            status: cls.status || (cls.completed ? 'completed' : 'scheduled'),
            type: cls.type || 'regular',
        })) : [];
    } catch (error) {
        console.error('Error fetching classes:', error);
        classes.value = [];
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
    router.visit(`/teacher/classes/${row.id}`);
};

const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
    fetchClasses();
    fetchStats();
});
</script>

<template>
    <Head title="My Classes" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">My Classes</h1>
                <p class="mt-1 text-sm text-gray-500">
                    View and manage your classes
                </p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Classes</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ classes.length }}
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
            </div>

            <!-- Classes Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Classes"
                :columns="columns"
                :data="classes"
                :searchable="true"
                :paginated="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
            >
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

                <template #cell-book="{ row }">
                    <div class="flex items-center gap-2 text-gray-900">
                        <BookOpenIcon class="h-4 w-4 text-gray-400" />
                        {{ row.book || '—' }}
                    </div>
                </template>

                <template #cell-schedule="{ row }">
                    <div class="flex items-center gap-2 text-gray-900">
                        <ClockIcon class="h-4 w-4 text-gray-400" />
                        {{ row.schedule || '—' }}
                    </div>
                </template>

                <template #cell-duration="{ row }">
                    <Badge variant="secondary">{{ row.duration }} min</Badge>
                </template>

                <template #cell-type="{ row }">
                    <Badge 
                        :variant="row.type === 'regular' ? 'primary' : 'warning'"
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