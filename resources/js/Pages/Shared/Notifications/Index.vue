<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import Button from '@/Components/ui/Button.vue';
import {
    BellIcon,
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    EnvelopeIcon,
    TrashIcon,
    CheckIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const notifications = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'notification',
        label: 'Notification',
        sortable: false,
    },
    {
        key: 'type',
        label: 'Type',
        sortable: true,
        align: 'center',
    },
    {
        key: 'created_at',
        label: 'Date',
        sortable: true,
        format: 'datetime',
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
        key: 'type',
        label: 'Type',
        type: 'select',
        options: [
            { value: '', label: 'All Types' },
            { value: 'info', label: 'Info' },
            { value: 'warning', label: 'Warning' },
            { value: 'success', label: 'Success' },
            { value: 'error', label: 'Error' },
        ],
    },
    {
        key: 'is_read',
        label: 'Status',
        type: 'select',
        options: [
            { value: '', label: 'All' },
            { value: 'false', label: 'Unread' },
            { value: 'true', label: 'Read' },
        ],
    },
];

const fetchNotifications = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/notification');
        notifications.value = Array.isArray(data.notifications || data) ? (data.notifications || data).map(notification => ({
            ...notification,
            status: notification.is_read ? 'read' : 'unread',
        })) : [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        notifications.value = [];
    } finally {
        loading.value = false;
    }
};

const markAsRead = async (notification) => {
    if (notification.is_read) return;
    try {
        await api.patch(`/notification/${notification.id}`, { is_read: true });
        notification.is_read = true;
        notification.status = 'read';
        await fetchNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

const markAllAsRead = async () => {
    try {
        await api.post('/notification/mark-all-read');
        await fetchNotifications();
    } catch (error) {
        console.error('Error marking all as read:', error);
        alert('Failed to mark all as read');
    }
};

const deleteNotification = async (notification) => {
    if (!confirm('Delete this notification?')) return;
    try {
        await api.delete(`/notification/${notification.id}`);
        await fetchNotifications();
    } catch (error) {
        console.error('Error deleting notification:', error);
        alert('Failed to delete notification');
    }
};

const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.value.length} notification(s)?`)) return;
    
    try {
        await Promise.all(selectedRows.value.map(notification => api.delete(`/notification/${notification.id}`)));
        selectedRows.value = [];
        await fetchNotifications();
    } catch (error) {
        console.error('Error bulk deleting notifications:', error);
        alert('Failed to delete some notifications');
    }
};

const getNotificationIcon = (type) => {
    const iconMap = {
        info: InformationCircleIcon,
        warning: ExclamationTriangleIcon,
        success: CheckCircleIcon,
        error: XCircleIcon,
        default: BellIcon,
    };
    return iconMap[type?.toLowerCase()] || iconMap.default;
};

const getNotificationColor = (type) => {
    const colorMap = {
        info: 'blue',
        warning: 'yellow',
        success: 'green',
        error: 'red',
        default: 'blue',
    };
    return colorMap[type?.toLowerCase()] || colorMap.default;
};

const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.is_read).length;
});

onMounted(() => {
    fetchNotifications();
});
</script>

<template>
    <Head title="Notifications" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        Manage your notifications
                    </p>
                </div>
                <Button
                    v-if="unreadCount > 0"
                    @click="markAllAsRead"
                    variant="secondary"
                >
                    <CheckIcon class="h-4 w-4 mr-2" />
                    Mark All as Read
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Notifications</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ notifications.length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <BellIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Unread</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ unreadCount }}
                            </p>
                            <p class="mt-1 text-xs text-yellow-600">Requires attention</p>
                        </div>
                        <div class="rounded-lg bg-yellow-50 p-3">
                            <EnvelopeIcon class="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Read</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ notifications.length - unreadCount }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Viewed</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <CheckCircleIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Notifications Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Notifications"
                :columns="columns"
                :data="notifications"
                :searchable="true"
                :paginated="true"
                :selectable="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
                @bulk-delete="handleBulkDelete"
            >
                <template #cell-notification="{ row }">
                    <div class="flex items-start gap-3">
                        <div :class="[
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            `bg-${getNotificationColor(row.type)}-50`
                        ]">
                            <component
                                :is="getNotificationIcon(row.type)"
                                :class="[
                                    'h-5 w-5',
                                    `text-${getNotificationColor(row.type)}-600`
                                ]"
                            />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <p class="font-medium text-gray-900">{{ row.label || row.type || 'Notification' }}</p>
                                <Badge v-if="!row.is_read" variant="warning" class="text-xs">New</Badge>
                            </div>
                            <p v-if="row.message" class="mt-1 text-sm text-gray-500 line-clamp-2">
                                {{ row.message }}
                            </p>
                            <p v-if="row.data" class="mt-1 text-xs text-gray-400">
                                {{ JSON.stringify(row.data) }}
                            </p>
                        </div>
                    </div>
                </template>

                <template #cell-type="{ row }">
                    <Badge :variant="getNotificationColor(row.type) === 'red' ? 'danger' : getNotificationColor(row.type) === 'yellow' ? 'warning' : getNotificationColor(row.type) === 'green' ? 'success' : 'primary'">
                        {{ row.type || 'info' }}
                    </Badge>
                </template>

                <template #cell-status="{ row }">
                    <Badge :variant="row.is_read ? 'secondary' : 'warning'">
                        {{ row.status || (row.is_read ? 'read' : 'unread') }}
                    </Badge>
                </template>

                <template #row-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            v-if="!row.is_read"
                            @click="markAsRead(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            title="Mark as Read"
                        >
                            <CheckIcon class="h-5 w-5" />
                        </button>
                        <button
                            @click="deleteNotification(row)"
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
