<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import Button from '@/Components/ui/Button.vue';
import {
    PlusIcon,
    EyeIcon,
    TrashIcon,
    PhotoIcon,
    CalendarIcon,
    UserGroupIcon,
    ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const screenshots = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'thumbnail',
        label: 'Screenshot',
        sortable: false,
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

const fetchScreenshots = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/teacher/screenshots');
        screenshots.value = Array.isArray(data.screenshots || data) ? (data.screenshots || data).map(screenshot => ({
            ...screenshot,
            student: screenshot.student ? `${screenshot.student.first_name || ''} ${screenshot.student.last_name || ''}`.trim() || screenshot.student.email : 'N/A',
            class: screenshot.class_schedule ? `Class #${screenshot.class_schedule.id}` : 'N/A',
            file_size: screenshot.file_size ? `${(screenshot.file_size / 1024).toFixed(2)} KB` : 'N/A',
        })) : [];
    } catch (error) {
        console.error('Error fetching screenshots:', error);
        screenshots.value = [];
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

const handleUpload = () => {
    router.visit('/teacher/screenshots/upload');
};

const handleView = (row) => {
    router.visit(`/teacher/screenshots/${row.id}`);
};

const handleDownload = async (screenshot) => {
    try {
        const response = await api.get(`/screenshots/${screenshot.id}/download`, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', screenshot.file_name || `screenshot-${screenshot.id}.png`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading screenshot:', error);
        alert('Failed to download screenshot');
    }
};

const handleDelete = async (screenshot) => {
    if (!confirm(`Are you sure you want to delete this screenshot?`)) return;
    
    try {
        await api.delete(`/screenshots/${screenshot.id}`);
        await fetchScreenshots();
        await fetchStats();
    } catch (error) {
        console.error('Error deleting screenshot:', error);
        alert('Failed to delete screenshot');
    }
};

const totalStorage = computed(() => {
    return (screenshots.value.reduce((sum, s) => sum + (s.file_size ? parseFloat(s.file_size) : 0), 0) / 1024 / 1024).toFixed(2);
});

onMounted(() => {
    fetchScreenshots();
    fetchStats();
});
</script>

<template>
    <Head title="My Screenshots" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">My Screenshots</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        Upload and manage your class screenshots
                    </p>
                </div>
                <Button @click="handleUpload" variant="primary">
                    <PlusIcon class="h-5 w-5 mr-2" />
                    Upload Screenshot
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Screenshots</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ screenshots.length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <PhotoIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Storage Used</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ totalStorage }} MB
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
                                {{ screenshots.filter(s => {
                                    const date = new Date(s.created_at);
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
            </div>

            <!-- Screenshots Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Screenshots"
                :columns="columns"
                :data="screenshots"
                :searchable="true"
                :paginated="true"
                :items-per-page="25"
                row-key="id"
            >
                <template #cell-thumbnail="{ row }">
                    <div class="flex items-center gap-3">
                        <img
                            v-if="row.file_url"
                            :src="row.file_url"
                            :alt="row.file_name || 'Screenshot'"
                            class="h-12 w-12 rounded-lg object-cover"
                        />
                        <div
                            v-else
                            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100"
                        >
                            <PhotoIcon class="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">{{ row.file_name || 'Screenshot' }}</div>
                            <div v-if="row.class" class="text-xs text-gray-500">{{ row.class }}</div>
                        </div>
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

                <template #cell-file_size="{ row }">
                    <div class="text-right text-gray-900">{{ row.file_size || '—' }}</div>
                </template>

                <template #row-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            @click="handleView(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            title="View"
                        >
                            <EyeIcon class="h-5 w-5" />
                        </button>
                        <button
                            @click="handleDownload(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600 transition-colors"
                            title="Download"
                        >
                            <ArrowDownTrayIcon class="h-5 w-5" />
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