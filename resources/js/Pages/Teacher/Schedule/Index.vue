<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    CalendarIcon,
    ClockIcon,
    AcademicCapIcon,
    BookOpenIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const schedule = ref([]);
const currentDate = ref(new Date());
const selectedDate = ref(new Date());

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const currentMonth = computed(() => currentDate.value.getMonth());
const currentYear = computed(() => currentDate.value.getFullYear());

const daysInMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const firstDayOfMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value, 1).getDay();
});

const calendarDays = computed(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth.value; i++) {
        days.push({ date: null, classes: [] });
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth.value; day++) {
        const date = new Date(currentYear.value, currentMonth.value, day);
        const dateStr = date.toISOString().split('T')[0];
        const dayClasses = schedule.value.filter(cls => {
            if (!cls.start_time) return false;
            const classDate = new Date(cls.start_time);
            return classDate.toISOString().split('T')[0] === dateStr;
        });

        days.push({
            date,
            classes: dayClasses,
            isToday: date.getTime() === today.getTime(),
            isSelected: date.toISOString().split('T')[0] === selectedDate.value.toISOString().split('T')[0],
        });
    }

    return days;
});

const selectedDateClasses = computed(() => {
    const dateStr = selectedDate.value.toISOString().split('T')[0];
    return schedule.value.filter(cls => {
        if (!cls.start_time) return false;
        const classDate = new Date(cls.start_time);
        return classDate.toISOString().split('T')[0] === dateStr;
    });
});

const previousMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
};

const nextMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
};

const selectDate = (day) => {
    if (day && day.date) {
        selectedDate.value = new Date(day.date);
    }
};

const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fetchSchedule = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/teacher/classes', {
            params: {
                start_date: new Date(currentYear.value, currentMonth.value, 1).toISOString(),
                end_date: new Date(currentYear.value, currentMonth.value + 1, 0).toISOString(),
            },
        });
        schedule.value = Array.isArray(data.classes || data) ? (data.classes || data) : [];
    } catch (error) {
        console.error('Error fetching schedule:', error);
        schedule.value = [];
    } finally {
        loading.value = false;
    }
};

const handleViewClass = (classItem) => {
    router.visit(`/teacher/classes/${classItem.id}`);
};

onMounted(() => {
    fetchSchedule();
});

const watchCurrentDate = () => {
    fetchSchedule();
};
</script>

<template>
    <Head title="My Schedule" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">My Schedule</h1>
                <p class="mt-1 text-sm text-gray-500">
                    View your upcoming classes and schedule
                </p>
            </div>

            <!-- Calendar View -->
            <Card class="p-6">
                <!-- Calendar Header -->
                <div class="mb-6 flex items-center justify-between">
                    <button
                        @click="previousMonth"
                        class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <ChevronLeftIcon class="h-5 w-5" />
                    </button>
                    <h2 class="text-xl font-semibold text-gray-900">
                        {{ months[currentMonth] }} {{ currentYear }}
                    </h2>
                    <button
                        @click="nextMonth"
                        class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <ChevronRightIcon class="h-5 w-5" />
                    </button>
                </div>

                <!-- Calendar Grid -->
                <div class="grid grid-cols-7 gap-2">
                    <!-- Day Headers -->
                    <div
                        v-for="day in daysOfWeek"
                        :key="day"
                        class="py-2 text-center text-xs font-semibold uppercase text-gray-500"
                    >
                        {{ day }}
                    </div>

                    <!-- Calendar Days -->
                    <div
                        v-for="(day, index) in calendarDays"
                        :key="index"
                        :class="[
                            'min-h-[80px] rounded-lg border-2 p-2 transition-colors cursor-pointer',
                            day.date ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50' : 'border-transparent',
                            day.isToday ? 'border-blue-500 bg-blue-50' : '',
                            day.isSelected ? 'border-blue-600 bg-blue-100 ring-2 ring-blue-500' : '',
                        ]"
                        @click="selectDate(day)"
                    >
                        <div v-if="day.date" class="flex flex-col gap-1">
                            <span
                                :class="[
                                    'text-sm font-medium',
                                    day.isToday ? 'text-blue-600' : 'text-gray-900',
                                ]"
                            >
                                {{ day.date.getDate() }}
                            </span>
                            <div class="flex flex-col gap-1">
                                <div
                                    v-for="(classItem, i) in day.classes.slice(0, 2)"
                                    :key="i"
                                    class="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-900"
                                >
                                    {{ formatTime(classItem.start_time) }}
                                </div>
                                <div
                                    v-if="day.classes.length > 2"
                                    class="text-xs text-gray-500"
                                >
                                    +{{ day.classes.length - 2 }} more
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <!-- Selected Date Classes -->
            <Card v-if="selectedDateClasses.length > 0" class="p-6">
                <h3 class="mb-4 text-lg font-semibold text-gray-900">
                    Classes on {{ selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
                </h3>
                <div class="space-y-3">
                    <div
                        v-for="classItem in selectedDateClasses"
                        :key="classItem.id"
                        @click="handleViewClass(classItem)"
                        class="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                        <div class="flex items-center gap-4">
                            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                                <ClockIcon class="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <div class="font-medium text-gray-900">
                                    {{ classItem.student ? `${classItem.student.first_name || ''} ${classItem.student.last_name || ''}`.trim() || classItem.student.email : 'Student' }}
                                </div>
                                <div class="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                    <span class="flex items-center gap-1">
                                        <ClockIcon class="h-4 w-4" />
                                        {{ formatTime(classItem.start_time) }} - {{ formatTime(classItem.end_time) }}
                                    </span>
                                    <span v-if="classItem.book" class="flex items-center gap-1">
                                        <BookOpenIcon class="h-4 w-4" />
                                        {{ classItem.book.title || 'No book' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Badge
                            :variant="classItem.status === 'completed' ? 'success' : classItem.status === 'scheduled' ? 'primary' : 'warning'"
                        >
                            {{ classItem.status || 'scheduled' }}
                        </Badge>
                    </div>
                </div>
            </Card>

            <!-- Empty State -->
            <Card v-else-if="!loading" class="p-12 text-center">
                <CalendarIcon class="mx-auto h-12 w-12 text-gray-300" />
                <p class="mt-4 text-sm font-medium text-gray-900">No classes scheduled</p>
                <p class="mt-1 text-sm text-gray-500">
                    No classes on {{ selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) }}
                </p>
            </Card>

            <!-- Loading State -->
            <div v-if="loading" class="space-y-4">
                <div class="h-96 rounded-xl bg-gray-200 animate-pulse"></div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>