<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    EyeIcon,
    CurrencyDollarIcon,
    BanknotesIcon,
    ClockIcon,
    CheckCircleIcon,
    AcademicCapIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const payouts = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'teacher',
        label: 'Teacher',
        sortable: true,
    },
    {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        format: 'currency',
        align: 'right',
    },
    {
        key: 'period',
        label: 'Period',
        sortable: true,
    },
    {
        key: 'hours',
        label: 'Hours',
        sortable: true,
        align: 'center',
    },
    {
        key: 'classes',
        label: 'Classes',
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
        key: 'processed_at',
        label: 'Processed',
        sortable: true,
        format: 'date',
    },
];

const filters = [
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: '', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'processed', label: 'Processed' },
            { value: 'failed', label: 'Failed' },
        ],
    },
];

const fetchPayouts = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/admin/payouts');
        payouts.value = Array.isArray(data.payouts || data) ? (data.payouts || data).map(payout => ({
            ...payout,
            teacher: payout.teacher ? `${payout.teacher.first_name || ''} ${payout.teacher.last_name || ''}`.trim() || payout.teacher.email : 'N/A',
            period: payout.period || `${new Date(payout.start_date).toLocaleDateString()} - ${new Date(payout.end_date).toLocaleDateString()}`,
            hours: payout.total_hours || 0,
            classes: payout.classes_count || 0,
            status: payout.status || 'pending',
        })) : [];
    } catch (error) {
        console.error('Error fetching payouts:', error);
        payouts.value = [];
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
    router.visit(`/admin/payouts/${row.id}`);
};

const totalPending = computed(() => {
    return payouts.value
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
});

const totalProcessed = computed(() => {
    return payouts.value
        .filter(p => p.status === 'processed')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
});

const handleExport = (data) => {
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
        columns.map(col => {
            let value = row[col.key] || '';
            if (col.format === 'currency') {
                value = typeof value === 'number' ? value : parseFloat(value) || 0;
            }
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

onMounted(() => {
    fetchPayouts();
    fetchStats();
});
</script>

<template>
    <Head title="Payouts" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Payouts</h1>
                <p class="mt-1 text-sm text-gray-500">
                    View and track teacher payouts
                </p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Payouts</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ payouts.length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <BanknotesIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Pending</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ payouts.filter(p => p.status === 'pending').length }}
                            </p>
                            <p class="mt-1 text-xs text-yellow-600">Awaiting processing</p>
                        </div>
                        <div class="rounded-lg bg-yellow-50 p-3">
                            <ClockIcon class="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Pending Amount</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                ${{ totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">To be processed</p>
                        </div>
                        <div class="rounded-lg bg-orange-50 p-3">
                            <CurrencyDollarIcon class="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Processed</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                ${{ totalProcessed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                            </p>
                            <p class="mt-1 text-xs text-green-600">All time</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <CheckCircleIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Payouts Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Payouts"
                :columns="columns"
                :data="payouts"
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
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600">
                            <span class="text-sm font-semibold text-white">
                                {{ row.teacher.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
                            </span>
                        </div>
                        <span class="font-medium text-gray-900">{{ row.teacher }}</span>
                    </div>
                </template>

                <template #cell-amount="{ row }">
                    <div class="text-right font-semibold text-gray-900">
                        ${{ parseFloat(row.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                    </div>
                </template>

                <template #cell-period="{ row }">
                    <div class="text-gray-900">{{ row.period || '—' }}</div>
                </template>

                <template #cell-hours="{ row }">
                    <Badge variant="secondary">{{ row.hours || 0 }}h</Badge>
                </template>

                <template #cell-classes="{ row }">
                    <Badge variant="secondary">
                        <AcademicCapIcon class="h-3 w-3 mr-1 inline" />
                        {{ row.classes || 0 }}
                    </Badge>
                </template>

                <template #cell-status="{ row }">
                    <Badge 
                        :variant="row.status === 'processed' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'"
                    >
                        {{ row.status || 'pending' }}
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