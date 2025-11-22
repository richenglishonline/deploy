<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import Button from '@/Components/ui/Button.vue';
import {
    EyeIcon,
    TrashIcon,
    PlayIcon,
    VideoCameraIcon,
    CalendarIcon,
    ClockIcon,
    AcademicCapIcon,
    UserGroupIcon,
    ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const recordings = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'title',
        label: 'Recording',
        sortable: true,
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
        key: 'class',
        label: 'Class',
        sortable: true,
    },
    {
        key: 'duration',
        label: 'Duration',
        sortable: true,
        align: 'center',
    },
    {
        key: 'file_size',
        label: 'Size',
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
        key: 'teacher_id',
        label: 'Teacher',
        type: 'select',
        options: [
            { value: '', label: 'All Teachers' },
        ],
    },
    {
        key: 'student_id',
        label: 'Student',
        type: 'select',
        options: [
            { value: '', label: 'All Students' },
        ],
    },
];

const fetchRecordings = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/recordings');
        recordings.value = Array.isArray(data.recordings || data) ? (data.recordings || data).map(recording => ({
            ...recording,
            title: recording.title || recording.file_name || 'Untitled Recording',
            teacher: recording.teacher ? `${recording.teacher.first_name || ''} ${recording.teacher.last_name || ''}`.trim() || recording.teacher.email : 'N/A',
            student: recording.student ? `${recording.student.first_name || ''} ${recording.student.last_name || ''}`.trim() || recording.student.email : 'N/A',
            class: recording.class_schedule ? `Class #${recording.class_schedule.id}` : 'N/A',
            duration: recording.duration ? `${recording.duration} min` : 'N/A',
            file_size: recording.file_size ? `${(recording.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
        })) : [];
    } catch (error) {
        console.error('Error fetching recordings:', error);
        recordings.value = [];
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
    router.visit(`/super-admin/recordings/${row.id}`);
};

const handlePlay = async (recording) => {
    try {
        const response = await api.get(`/recordings/${recording.id}/play`);
        window.open(response.data.url, '_blank');
    } catch (error) {
        console.error('Error playing recording:', error);
        alert('Failed to play recording');
    }
};

const handleDownload = async (recording) => {
    try {
        const response = await api.get(`/recordings/${recording.id}/download`, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', recording.file_name || `${recording.title}.mp4`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading recording:', error);
        alert('Failed to download recording');
    }
};

const handleDelete = async (recording) => {
    if (!confirm(`Are you sure you want to delete "${recording.title}"?`)) return;
    
    try {
        await api.delete(`/recordings/${recording.id}`);
        await fetchRecordings();
        await fetchStats();
    } catch (error) {
        console.error('Error deleting recording:', error);
        alert('Failed to delete recording');
    }
};

const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.value.length} recording(s)?`)) return;
    
    try {
        await Promise.all(selectedRows.value.map(recording => api.delete(`/recordings/${recording.id}`)));
        selectedRows.value = [];
        await fetchRecordings();
        await fetchStats();
    } catch (error) {
        console.error('Error bulk deleting recordings:', error);
        alert('Failed to delete some recordings');
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
    a.download = `recordings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

const totalStorage = computed(() => {
    return (recordings.value.reduce((sum, r) => sum + (r.file_size ? parseFloat(r.file_size) : 0), 0) / 1024).toFixed(2);
});

onMounted(() => {
    fetchRecordings();
    fetchStats();
});
</script>

<template>
    <Head title="Recordings Library" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Recordings Library</h1>
                <p class="mt-1 text-sm text-gray-500">
                    Manage all class recordings
                </p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Recordings</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ recordings.length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <VideoCameraIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Storage Used</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ totalStorage }} GB
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Total size</p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <ArrowDownTrayIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">This Month</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ recordings.filter(r => {
                                    const date = new Date(r.created_at);
                                    const now = new Date();
                                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                                }).length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Uploads</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <CalendarIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Duration</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ recordings.reduce((sum, r) => sum + (parseInt(r.duration) || 0), 0) }} min
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Combined</p>
                        </div>
                        <div class="rounded-lg bg-orange-50 p-3">
                            <ClockIcon class="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Recordings Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Recordings"
                :columns="columns"
                :data="recordings"
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
                        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-600">
                            <PlayIcon class="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">{{ row.title }}</div>
                            <div v-if="row.class" class="text-xs text-gray-500">{{ row.class }}</div>
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

                <template #cell-class="{ row }">
                    <div class="text-gray-900">{{ row.class || '—' }}</div>
                </template>

                <template #cell-duration="{ row }">
                    <Badge variant="secondary">{{ row.duration || '—' }}</Badge>
                </template>

                <template #cell-file_size="{ row }">
                    <div class="text-right text-gray-900">{{ row.file_size || '—' }}</div>
                </template>

                <template #row-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            @click="handlePlay(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            title="Play"
                        >
                            <PlayIcon class="h-5 w-5" />
                        </button>
                        <button
                            @click="handleDownload(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600 transition-colors"
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