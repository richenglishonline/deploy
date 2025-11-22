<script setup>
import { computed, onMounted, ref } from "vue";
import { Head, usePage } from "@inertiajs/vue3";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.vue";
import DashboardHeader from "@/Components/DashboardHeader.vue";
import KPICard from "@/Components/Dashboard/KPICard.vue";
import ActivityTimeline from "@/Components/Dashboard/ActivityTimeline.vue";
import AdvancedTable from "@/Components/ui/AdvancedTable.vue";
import Card from "@/Components/ui/Card.vue";
import LineChart from "@/Components/Charts/LineChart.vue";
import BarChart from "@/Components/Charts/BarChart.vue";
import PieChart from "@/Components/Charts/PieChart.vue";
import DonutChart from "@/Components/Charts/DonutChart.vue";
import {
    UserGroupIcon,
    CalendarIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    BookOpenIcon,
    CurrencyDollarIcon,
    AcademicCapIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
} from "@heroicons/vue/24/outline";
import api from "@/lib/api";

const page = usePage();
const loading = ref(false);
const stats = ref(null);
const hasLoaded = ref(false);

const role = computed(() => page.props.auth?.user?.role ?? "admin");

const generateChartData = (type) => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const colors = {
        primary: "rgba(59, 130, 246, 0.8)",
        secondary: "rgba(16, 185, 129, 0.8)",
        accent: "rgba(139, 92, 246, 0.8)",
    };

    if (type === "line") {
        return {
            labels,
            datasets: [
                {
                    label: "Classes",
                    data: [12, 19, 15, 25, 22, 18, 14],
                    borderColor: colors.primary,
                    backgroundColor: colors.primary.replace("0.8", "0.1"),
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: "Attendance",
                    data: [8, 15, 12, 20, 18, 14, 10],
                    borderColor: colors.secondary,
                    backgroundColor: colors.secondary.replace("0.8", "0.1"),
                    fill: true,
                    tension: 0.4,
                },
            ],
        };
    }

    if (type === "bar") {
        return {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
            datasets: [
                {
                    label: "Hours",
                    data: [20, 25, 22, 28],
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                },
            ],
        };
    }

    if (type === "pie") {
        return {
            labels: ["Completed", "Pending", "Cancelled"],
            datasets: [
                {
                    data: [65, 25, 10],
                    backgroundColor: [
                        colors.secondary,
                        "rgba(251, 191, 36, 0.8)",
                        "rgba(239, 68, 68, 0.8)",
                    ],
                },
            ],
        };
    }

    if (type === "donut") {
        return {
            labels: ["Active", "Inactive"],
            datasets: [
                {
                    data: [75, 25],
                    backgroundColor: [colors.primary, "rgba(156, 163, 175, 0.8)"],
                },
            ],
        };
    }
};

const adminKPIs = computed(() => {
    if (!stats.value || role.value !== "admin") return [];

    const data = stats.value.stats ?? {};

    return [
        {
            label: "Assigned Teachers",
            value: data.assignedTeachers ?? 0,
            icon: AcademicCapIcon,
            iconBgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            change: 5,
        },
        {
            label: "Students",
            value: data.totalStudents ?? 0,
            icon: UserGroupIcon,
            iconBgColor: "bg-green-50",
            iconColor: "text-green-600",
            change: 10,
        },
        {
            label: "Hours This Month",
            value: data.totalHoursMonth ?? 0,
            icon: ClockIcon,
            iconBgColor: "bg-purple-50",
            iconColor: "text-purple-600",
            format: "number",
        },
        {
            label: "Estimated Payout",
            value: data.totalPaymentMonth ?? 0,
            icon: CurrencyDollarIcon,
            iconBgColor: "bg-yellow-50",
            iconColor: "text-yellow-600",
            format: "currency",
        },
        {
            label: "Classes This Month",
            value: data.totalClassesMonth ?? 0,
            icon: CalendarIcon,
            iconBgColor: "bg-pink-50",
            iconColor: "text-pink-600",
            change: 8,
        },
        {
            label: "Attendance Rate",
            value: data.attendanceRate ?? 0,
            icon: ClipboardDocumentListIcon,
            iconBgColor: "bg-indigo-50",
            iconColor: "text-indigo-600",
            format: "percentage",
            change: 2,
        },
    ];
});

const activities = computed(() => {
    if (!stats.value) return [];
    const data = stats.value.dashboard ?? {};
    const recentClasses = data.activeClass?.slice(0, 5) ?? [];

    return recentClasses.map((classItem) => ({
        title: `Class: ${classItem.student || "Student"}`,
        description: classItem.book || "No book assigned",
        time: `${classItem.start_time || "N/A"} - ${classItem.end_time || "N/A"}`,
        icon: CheckCircleIcon,
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
    }));
});

const tableColumns = computed(() => [
    { key: "teacher", label: "Teacher", sortable: true },
    { key: "students", label: "Students", sortable: true },
    { key: "classes", label: "Classes This Week", sortable: true },
    { key: "attendance_rate", label: "Attendance Rate", sortable: true, format: "percentage" },
]);

const tableData = computed(() => {
    if (!stats.value) return [];
    // Mock data structure - replace with actual API data
    return [
        {
            teacher: "John Doe",
            students: 15,
            classes: 12,
            attendance_rate: 95,
        },
        {
            teacher: "Jane Smith",
            students: 18,
            classes: 14,
            attendance_rate: 92,
        },
    ];
});

const loadStats = async () => {
    if (loading.value || hasLoaded.value) return;

    loading.value = true;
    try {
        const { data } = await api.get("/dashboard/stats");
        stats.value = data;
        hasLoaded.value = true;
    } catch (error) {
        console.error("Dashboard stats error:", error);
        if (error.response?.status === 401) {
            console.warn("Unauthorized - user may need to re-login");
        }
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (!hasLoaded.value && !loading.value) {
        loadStats();
    }
});
</script>

<template>
    <Head title="Admin Dashboard" />

    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <DashboardHeader />

            <!-- Loading State -->
            <div v-if="loading" class="space-y-6">
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div
                        v-for="i in 6"
                        :key="i"
                        class="h-32 rounded-xl bg-gray-200 animate-pulse"
                    ></div>
                </div>
            </div>

            <!-- Admin Dashboard -->
            <template v-else>
                <!-- KPI Cards -->
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <KPICard
                        v-for="kpi in adminKPIs"
                        :key="kpi.label"
                        :label="kpi.label"
                        :value="kpi.value"
                        :icon="kpi.icon"
                        :icon-bg-color="kpi.iconBgColor"
                        :icon-color="kpi.iconColor"
                        :change="kpi.change"
                        :format="kpi.format || 'number'"
                        :trend="true"
                    />
                </div>

                <!-- Charts Row -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <!-- Line Chart -->
                    <Card class="p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900">
                                Weekly Activity Trends
                            </h3>
                            <ChartBarIcon class="h-5 w-5 text-gray-400" />
                        </div>
                        <div class="h-64">
                            <LineChart :data="generateChartData('line')" />
                        </div>
                    </Card>

                    <!-- Pie Chart -->
                    <Card class="p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900">
                                Class Status Distribution
                            </h3>
                            <ArrowTrendingUpIcon class="h-5 w-5 text-gray-400" />
                        </div>
                        <div class="h-64">
                            <PieChart :data="generateChartData('pie')" />
                        </div>
                    </Card>
                </div>

                <!-- Bottom Row: Activity Timeline & Donut Chart -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <!-- Activity Timeline -->
                    <div class="lg:col-span-2">
                        <ActivityTimeline :activities="activities" />
                    </div>

                    <!-- Donut Chart -->
                    <Card class="p-6">
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">
                                Teacher Status
                            </h3>
                            <p class="mt-1 text-sm text-gray-500">
                                Active vs Inactive
                            </p>
                        </div>
                        <div class="h-64">
                            <DonutChart :data="generateChartData('donut')" />
                        </div>
                    </Card>
                </div>

                <!-- Teacher Performance Table -->
                <AdvancedTable
                    title="Teacher Performance Overview"
                    :columns="tableColumns"
                    :data="tableData"
                    :searchable="true"
                    :paginated="true"
                    :items-per-page="10"
                >
                    <template #cell-teacher="{ row }">
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                <span class="text-sm font-semibold text-white">
                                    {{ row.teacher.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
                                </span>
                            </div>
                            <span class="font-medium text-gray-900">{{ row.teacher }}</span>
                        </div>
                    </template>

                    <template #cell-attendance_rate="{ row }">
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-gray-900">{{ row.attendance_rate }}%</span>
                            <div class="h-2 flex-1 max-w-[60px] rounded-full bg-gray-200">
                                <div 
                                    class="h-2 rounded-full bg-green-500"
                                    :style="{ width: `${row.attendance_rate}%` }"
                                ></div>
                            </div>
                        </div>
                    </template>
                </AdvancedTable>
            </template>
        </div>
    </AuthenticatedLayout>
</template>