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
    PencilIcon,
    BanknotesIcon,
    AcademicCapIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    ClockIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const salaries = ref([]);
const stats = ref(null);

const columns = [
    {
        key: 'teacher',
        label: 'Teacher',
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
        label: 'Total Hours',
        sortable: true,
        align: 'center',
        format: 'number',
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
        label: 'Total Salary',
        sortable: true,
        format: 'currency',
        align: 'right',
    },
    {
        key: 'period',
        label: 'Period',
        sortable: true,
    },
];

const filters = [
    {
        key: 'period',
        label: 'Period',
        type: 'select',
        options: [
            { value: '', label: 'All Periods' },
            { value: '2025-01', label: 'January 2025' },
            { value: '2025-02', label: 'February 2025' },
            { value: '2025-03', label: 'March 2025' },
        ],
    },
];

const fetchSalaries = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/salary');
        salaries.value = Array.isArray(data.salaries || data) ? (data.salaries || data).map(salary => ({
            ...salary,
            teacher: salary.teacher ? `${salary.teacher.first_name || ''} ${salary.teacher.last_name || ''}`.trim() || salary.teacher.email : 'N/A',
            total_salary: (parseFloat(salary.base_salary || 0) + parseFloat(salary.bonus || 0)).toFixed(2),
            period: salary.period || `${salary.start_date} - ${salary.end_date}`,
        })) : [];
    } catch (error) {
        console.error('Error fetching salaries:', error);
        salaries.value = [];
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

const handleCreate = () => {
    router.visit('/super-admin/salary/create');
};

const handleEdit = (row) => {
    router.visit(`/super-admin/salary/${row.id}/edit`);
};

const totalSalary = computed(() => {
    return salaries.value.reduce((sum, s) => sum + parseFloat(s.total_salary || 0), 0).toFixed(2);
});

const totalHours = computed(() => {
    return salaries.value.reduce((sum, s) => sum + parseFloat(s.total_hours || 0), 0).toFixed(2);
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
    a.download = `salaries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

onMounted(() => {
    fetchSalaries();
    fetchStats();
});
</script>

<template>
    <Head title="Salary Management" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Salary Management</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        Manage teacher salaries and compensation
                    </p>
                </div>
                <Button @click="handleCreate" variant="primary">
                    <PlusIcon class="h-5 w-5 mr-2" />
                    Configure Salary
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Teachers</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ salaries.length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">With salary config</p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <AcademicCapIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Salary</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                ${{ totalSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">This period</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <CurrencyDollarIcon class="h-8 w-8 text-green-600" />
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
                            <p class="text-sm font-medium text-gray-600">Avg Rate/Hour</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                ${{ salaries.length > 0 
                                    ? (salaries.reduce((sum, s) => sum + parseFloat(s.rate_per_hour || 0), 0) / salaries.length).toFixed(2)
                                    : '0.00'
                                }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Average</p>
                        </div>
                        <div class="rounded-lg bg-orange-50 p-3">
                            <BanknotesIcon class="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Salaries Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Salary Configurations"
                :columns="columns"
                :data="salaries"
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

                <template #cell-period="{ row }">
                    <div class="text-gray-900">{{ row.period || '—' }}</div>
                </template>

                <template #row-actions="{ row }">
                    <button
                        @click="handleEdit(row)"
                        class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        title="Edit"
                    >
                        <PencilIcon class="h-5 w-5" />
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