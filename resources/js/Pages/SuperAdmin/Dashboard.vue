<script setup>
import { computed, onMounted, ref } from "vue";
import { Head, usePage } from "@inertiajs/vue3";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.vue";
import DashboardHeader from "@/Components/DashboardHeader.vue";
import KPICard from "@/Components/Dashboard/KPICard.vue";
import ActivityTimeline from "@/Components/Dashboard/ActivityTimeline.vue";
import DataTable from "@/Components/Dashboard/DataTable.vue";
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
    BellIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
} from "@heroicons/vue/24/outline";
import api from "@/lib/api";

const page = usePage();
const loading = ref(false);
const stats = ref(null);
const hasLoaded = ref(false);

const role = computed(() => page.props.auth?.user?.role ?? "super-admin");

// Generate sample chart data based on stats
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

// Super-Admin KPIs
const adminKPIs = computed(() => {
    if (!stats.value || role.value !== "super-admin") return [];

    const data = stats.value.stats ?? {};

    return [
        {
            label: "Total Admins",
            value: data.totalAdmins ?? 0,
            icon: AcademicCapIcon,
            iconBgColor: "bg-indigo-50",
            iconColor: "text-indigo-600",
        },
        {
            label: "Teachers",
            value: data.totalTeachers ?? 0,
            icon: UserGroupIcon,
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
            change: 12,
        },
        {
            label: "Books",
            value: data.totalBooks ?? 0,
            icon: BookOpenIcon,
            iconBgColor: "bg-purple-50",
            iconColor: "text-purple-600",
        },
        {
            label: "Classes",
            value: data.totalClasses ?? 0,
            icon: CalendarIcon,
            iconBgColor: "bg-pink-50",
            iconColor: "text-pink-600",
            change: 8,
        },
        {
            label: "Payouts",
            value: data.totalPayouts ?? 0,
            icon: CurrencyDollarIcon,
            iconBgColor: "bg-yellow-50",
            iconColor: "text-yellow-600",
        },
    ];
});

// Activity timeline data
const activities = computed(() => {
    if (!stats.value) return [];

    const data = stats.value.dashboard ?? {};
    const recentClasses = data.activeClass?.slice(0, 5) ?? [];

    return recentClasses.map((classItem, index) => ({
        title: `Class with ${classItem.student || "Student"}`,
        description: classItem.book || "No book assigned",
        time: `${classItem.start_time || "N/A"} - ${classItem.end_time || "N/A"}`,
        icon: CheckCircleIcon,
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
    }));
});

// Table data
const tableColumns = computed(() => [
    { key: "student", label: "Student" },
    { key: "book", label: "Book" },
    { key: "start_time", label: "Time" },
    { key: "type", label: "Type" },
]);

const tableData = computed(() => {
    if (!stats.value) return [];
    const data = stats.value.dashboard ?? {};
    return (data.activeClass ?? []).map((item) => ({
        student: item.student || "N/A",
        book: item.book || "N/A",
        start_time: item.start_time || "N/A",
        type: item.type || "N/A",
    }));
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
    <Head title="Dashboard" />

    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <DashboardHeader />

            <!-- Loading State -->
            <div v-if="loading" class="space-y-6">
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div
                        v-for="i in 4"
                        :key="i"
                        class="h-32 rounded-xl bg-gray-200 animate-pulse"
                    ></div>
                </div>
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div class="h-96 rounded-xl bg-gray-200 animate-pulse"></div>
                    <div class="h-96 rounded-xl bg-gray-200 animate-pulse"></div>
                </div>
            </div>

            <!-- Super-Admin Dashboard -->
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
                    <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900">
                                Activity Trends
                            </h3>
                            <ChartBarIcon class="h-5 w-5 text-gray-400" />
                        </div>
                        <div class="h-64">
                            <LineChart :data="generateChartData('line')" />
                        </div>
                    </div>

                    <!-- Pie Chart -->
                    <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900">
                                Distribution
                            </h3>
                            <BellIcon class="h-5 w-5 text-gray-400" />
                        </div>
                        <div class="h-64">
                            <PieChart :data="generateChartData('pie')" />
                        </div>
                    </div>
                </div>

                <!-- Bar Chart Full Width -->
                <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-900">
                            Monthly Overview
                        </h3>
                        <ArrowTrendingUpIcon class="h-5 w-5 text-gray-400" />
                    </div>
                    <div class="h-80">
                        <BarChart :data="generateChartData('bar')" />
                    </div>
                </div>

                <!-- Bottom Row: Activity Timeline & Donut Chart -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <!-- Activity Timeline -->
                    <div class="lg:col-span-2">
                        <ActivityTimeline :activities="activities" />
                    </div>

                    <!-- Donut Chart -->
                    <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">
                                Status Overview
                            </h3>
                            <p class="mt-1 text-sm text-gray-500">
                                Overview of system distribution
                            </p>
                        </div>
                        <div class="h-64">
                            <DonutChart :data="generateChartData('donut')" />
                        </div>
                    </div>
                </div>

                <!-- Recent Classes Table -->
                <DataTable
                    title="Recent Classes"
                    :columns="tableColumns"
                    :data="tableData"
                    :searchable="true"
                    :paginated="true"
                    :items-per-page="5"
                />
            </template>
        </div>
    </AuthenticatedLayout>
</template>
