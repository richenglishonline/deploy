<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    BanknotesIcon,
    CurrencyDollarIcon,
    ClockIcon,
    CalendarIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const salaryData = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'period',
        label: 'Period',
        sortable: true,
    },
    {
        key: 'rate_per_hour',
        label: 'Rate/Hour',
        sortable: true,
        format: 'currency',
        align: 'right',
    },
    {
        key: 'total_hours',
        label: 'Hours',
        sortable: true,
        align: 'center',
        format: 'number',
    },
    {
        key: 'classes_count',
        label: 'Classes',
        sortable: true,
        align: 'center',
    },
    {
        key: 'base_salary',
        label: 'Base Salary',
        sortable: true,
        format: 'currency',
        align: 'right',
    },
    {
        key: 'bonus',
        label: 'Bonus',
        sortable: true,
        format: 'currency',
        align: 'right',
    },
    {
        key: 'total_salary',
        label: 'Total',
        sortable: true,
        format: 'currency',
        align: 'right',
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
            { value: 'paid', label: 'Paid' },
            { value: 'pending', label: 'Pending' },
            { value: 'processing', label: 'Processing' },
        ],
    },
];

const fetchSalary = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/teacher/salary');
        salaryData.value = Array.isArray(data.salaries || data.payouts || data) ? (data.salaries || data.payouts || data).map(salary => ({
            ...salary,
            period: salary.period || `${new Date(salary.start_date).toLocaleDateString()} - ${new Date(salary.end_date).toLocaleDateString()}`,
            total_salary: (parseFloat(salary.base_salary || 0) + parseFloat(salary.bonus || 0)).toFixed(2),
            total_hours: salary.total_hours || salary.hours || 0,
            classes_count: salary.classes_count || salary.classes || 0,
            status: salary.status || (salary.processed_at ? 'paid' : 'pending'),
        })) : [];
    } catch (error) {
        console.error('Error fetching salary:', error);
        salaryData.value = [];
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

const totalEarnings = computed(() => {
    return salaryData.value.reduce((sum, s) => sum + parseFloat(s.total_salary || 0), 0).toFixed(2);
});

const thisMonthEarnings = computed(() => {
    const now = new Date();
    return salaryData.value
        .filter(s => {
            const salaryDate = new Date(s.start_date || s.created_at);
            return salaryDate.getMonth() === now.getMonth() && salaryDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, s) => sum + parseFloat(s.total_salary || 0), 0)
        .toFixed(2);
});

const totalHours = computed(() => {
    return salaryData.value.reduce((sum, s) => sum + parseFloat(s.total_hours || 0), 0).toFixed(2);
});

onMounted(() => {
    fetchSalary();
    fetchStats();
});
</script>

<template>
    <Head title="My Salary" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">My Salary</h1>
                <p class="mt-1 text-sm text-gray-500">
                    View your earnings and payout history
                </p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Earnings</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                ${{ totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">All time</p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <CurrencyDollarIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">This Month</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                ${{ thisMonthEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                            </p>
                            <p class="mt-1 text-xs text-green-600">+12% from last month</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <ArrowTrendingUpIcon class="h-8 w-8 text-green-600" />
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
                            <p class="mt-1 text-xs text-gray-500">Hours worked</p>
                        </div>
                        <div class="rounded-lg bg-purple-50 p-3">
                            <ClockIcon class="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Current Rate</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                ${{ salaryData.length > 0 
                                    ? parseFloat(salaryData[0]?.rate_per_hour || 0).toFixed(2)
                                    : '0.00'
                                }}/hr
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Per hour</p>
                        </div>
                        <div class="rounded-lg bg-orange-50 p-3">
                            <BanknotesIcon class="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Salary History Table -->
            <AdvancedTable
                v-if="!loading"
                title="Salary History"
                :columns="columns"
                :data="salaryData"
                :searchable="true"
                :paginated="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
            >
                <template #cell-period="{ row }">
                    <div class="flex items-center gap-2 text-gray-900">
                        <CalendarIcon class="h-4 w-4 text-gray-400" />
                        {{ row.period || '—' }}
                    </div>
                </template>

                <template #cell-rate_per_hour="{ row }">
                    <div class="text-right font-medium text-gray-900">
                        ${{ parseFloat(row.rate_per_hour || 0).toFixed(2) }}
                    </div>
                </template>

                <template #cell-total_hours="{ row }">
                    <div class="text-center font-medium text-gray-900">
                        {{ parseFloat(row.total_hours || 0).toFixed(2) }}h
                    </div>
                </template>

                <template #cell-classes_count="{ row }">
                    <div class="text-center text-gray-900">
                        {{ row.classes_count || 0 }}
                    </div>
                </template>

                <template #cell-base_salary="{ row }">
                    <div class="text-right font-medium text-gray-900">
                        ${{ parseFloat(row.base_salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                    </div>
                </template>

                <template #cell-bonus="{ row }">
                    <div class="text-right font-medium text-green-600">
                        +${{ parseFloat(row.bonus || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                    </div>
                </template>

                <template #cell-total_salary="{ row }">
                    <div class="text-right font-semibold text-gray-900">
                        ${{ parseFloat(row.total_salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                    </div>
                </template>

                <template #cell-status="{ row }">
                    <Badge 
                        :variant="row.status === 'paid' ? 'success' : row.status === 'processing' ? 'warning' : 'secondary'"
                    >
                        {{ row.status || 'pending' }}
                    </Badge>
                </template>
            </AdvancedTable>

            <!-- Loading State -->
            <div v-else class="space-y-4">
                <div class="h-64 rounded-xl bg-gray-200 animate-pulse"></div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>