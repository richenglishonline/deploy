<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Card from '@/Components/ui/Card.vue';
import Button from '@/Components/ui/Button.vue';
import LineChart from '@/Components/Charts/LineChart.vue';
import BarChart from '@/Components/Charts/BarChart.vue';
import PieChart from '@/Components/Charts/PieChart.vue';
import {
    ChartBarIcon,
    AcademicCapIcon,
    UserGroupIcon,
    CalendarIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    ArrowTrendingUpIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const stats = ref(null);

const reportCards = [
    {
        title: 'Teacher Performance Report',
        description: 'Analyze teacher performance metrics and productivity',
        icon: AcademicCapIcon,
        color: 'blue',
        href: '/admin/reports/teacher-performance',
    },
    {
        title: 'Student Progress Report',
        description: 'Track student progress and learning outcomes',
        icon: UserGroupIcon,
        color: 'green',
        href: '/admin/reports/student-progress',
    },
    {
        title: 'Attendance Analytics',
        description: 'Comprehensive attendance reports and trends',
        icon: CalendarIcon,
        color: 'orange',
        href: '/admin/reports/attendance',
    },
];

const generateChartData = (type) => {
    if (type === 'performance') {
        return {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Performance Score',
                data: [85, 88, 90, 87],
                borderColor: 'rgba(59, 130, 246, 0.8)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            }],
        };
    }
    if (type === 'attendance') {
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
                label: 'Attendance Rate',
                data: [92, 95, 88, 94, 90],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 8,
            }],
        };
    }
    if (type === 'distribution') {
        return {
            labels: ['Active', 'Inactive', 'Pending'],
            datasets: [{
                data: [70, 20, 10],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(156, 163, 175, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                ],
            }],
        };
    }
};

const fetchStats = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/dashboard/stats');
        stats.value = data?.stats || {};
    } catch (error) {
        console.error('Error fetching stats:', error);
    } finally {
        loading.value = false;
    }
};

const handleGenerateReport = (report) => {
    router.visit(report.href);
};

onMounted(() => {
    fetchStats();
});
</script>

<template>
    <Head title="Reports & Analytics" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p class="mt-1 text-sm text-gray-500">
                    Comprehensive analytics and reports for assigned teachers and students
                </p>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Assigned Teachers</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ stats?.assignedTeachers || 0 }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <AcademicCapIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Students</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ stats?.totalStudents || 0 }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <UserGroupIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Monthly Hours</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ stats?.totalHoursMonth || 0 }}h
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
                            <p class="text-sm font-medium text-gray-600">Estimated Payout</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                ${{ (stats?.totalPaymentMonth || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-orange-50 p-3">
                            <ChartBarIcon class="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Report Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card
                    v-for="report in reportCards"
                    :key="report.title"
                    class="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    @click="handleGenerateReport(report)"
                >
                    <div class="flex items-start gap-4">
                        <div :class="[
                            'rounded-lg p-3',
                            `bg-${report.color}-50`
                        ]">
                            <component :is="report.icon" :class="[
                                'h-8 w-8',
                                `text-${report.color}-600`
                            ]" />
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900">{{ report.title }}</h3>
                            <p class="mt-1 text-sm text-gray-500">{{ report.description }}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="mt-4"
                            >
                                Generate Report
                                <ArrowDownTrayIcon class="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Analytics Charts -->
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card class="p-6">
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-900">Teacher Performance Trend</h3>
                        <ArrowTrendingUpIcon class="h-5 w-5 text-gray-400" />
                    </div>
                    <div class="h-64">
                        <LineChart :data="generateChartData('performance')" />
                    </div>
                </Card>

                <Card class="p-6">
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-900">Weekly Attendance</h3>
                        <CalendarIcon class="h-5 w-5 text-gray-400" />
                    </div>
                    <div class="h-64">
                        <BarChart :data="generateChartData('attendance')" />
                    </div>
                </Card>

                <Card class="p-6 lg:col-span-2">
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-900">Status Distribution</h3>
                        <DocumentTextIcon class="h-5 w-5 text-gray-400" />
                    </div>
                    <div class="h-64">
                        <PieChart :data="generateChartData('distribution')" />
                    </div>
                </Card>
            </div>
        </div>
    </AuthenticatedLayout>
</template>