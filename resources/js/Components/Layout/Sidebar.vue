<template>
    <aside
        :class="[
            'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0',
            isOpen ? 'translate-x-0' : '-translate-x-full',
        ]"
    >
        <!-- Logo Section -->
        <div class="flex h-16 items-center justify-between border-b border-gray-200 px-6">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
                    <span class="text-xl font-bold text-white">RE</span>
                </div>
                <div>
                    <h1 class="text-sm font-semibold text-gray-900">Rich English</h1>
                    <p class="text-xs text-gray-500">Learning Platform</p>
                </div>
            </div>
            <button
                @click="$emit('close')"
                class="lg:hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
                <XMarkIcon class="h-5 w-5" />
            </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <div v-for="section in navigationSections" :key="section.name" class="mb-6">
                <p
                    v-if="section.label"
                    class="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                    {{ section.label }}
                </p>
                <div class="mt-2 space-y-1">
                    <Link
                        v-for="item in section.items"
                        :key="item.name"
                        :href="item.href"
                        :class="[
                            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                            isActive(item.href)
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                        ]"
                    >
                        <component
                            :is="item.icon"
                            :class="[
                                'h-5 w-5 flex-shrink-0',
                                isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600',
                            ]"
                        />
                        <span class="flex-1">{{ item.name }}</span>
                        <span
                            v-if="item.badge"
                            class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                            {{ item.badge }}
                        </span>
                    </Link>
                </div>
            </div>
        </nav>

        <!-- User Section -->
        <div class="border-t border-gray-200 p-4">
            <div class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                    <span class="text-sm font-semibold text-white">
                        {{ userInitials }}
                    </span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">
                        {{ userName }}
                    </p>
                    <p class="text-xs text-gray-500 truncate">{{ userRole }}</p>
                </div>
            </div>
        </div>
    </aside>

    <!-- Overlay for mobile -->
    <div
        v-if="isOpen"
        @click="$emit('close')"
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
    ></div>
</template>

<script setup>
import { computed } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';
import { route } from 'ziggy-js';
import {
    HomeIcon,
    UserGroupIcon,
    AcademicCapIcon,
    BookOpenIcon,
    CalendarIcon,
    ClipboardDocumentListIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    BellIcon,
    XMarkIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false,
    },
});

defineEmits(['close']);

const page = usePage();
const user = computed(() => page.props.auth?.user);
const userName = computed(() => user.value?.name || 'User');
const userRole = computed(() => {
    const role = user.value?.role || 'teacher';
    return role.charAt(0).toUpperCase() + role.slice(1);
});
const userInitials = computed(() => {
    const name = userName.value;
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
});

const isActive = (href) => {
    if (typeof window === 'undefined') return false;
    const currentPath = window.location.pathname;
    return currentPath === href || currentPath.startsWith(href + '/');
};

const navigationSections = computed(() => {
    const role = user.value?.role || 'teacher';
    
    try {
        const baseItems = [
            { name: 'Dashboard', href: route('dashboard'), icon: HomeIcon },
        ];

        if (role === 'teacher') {
            return [
                {
                    label: 'Main',
                    items: [
                        ...baseItems,
                        { name: 'Schedule', href: route('schedule.index'), icon: CalendarIcon },
                        { name: 'Classes', href: route('classes.index'), icon: AcademicCapIcon },
                        { name: 'Students', href: route('students.index'), icon: UserGroupIcon },
                        { name: 'Books', href: route('books.index'), icon: BookOpenIcon },
                        { name: 'Attendance', href: route('attendance.index'), icon: ClipboardDocumentListIcon },
                        { name: 'Salary', href: route('salary.index'), icon: CurrencyDollarIcon },
                    ],
                },
                {
                    label: 'Other',
                    items: [
                        { name: 'Recordings', href: route('recordings.index'), icon: ChartBarIcon },
                        { name: 'Screenshots', href: route('screenshots.index'), icon: ChartBarIcon },
                        { name: 'Notifications', href: route('notifications.index'), icon: BellIcon, badge: '3' },
                        { name: 'Settings', href: route('settings.index'), icon: Cog6ToothIcon },
                    ],
                },
            ];
        }

        if (role === 'admin' || role === 'super-admin') {
            return [
                {
                    label: 'Main',
                    items: [
                        ...baseItems,
                        { name: 'Teachers', href: route('teachers.index'), icon: AcademicCapIcon },
                        { name: 'Students', href: route('students.index'), icon: UserGroupIcon },
                        { name: 'Classes', href: route('classes.index'), icon: CalendarIcon },
                        { name: 'Books', href: route('books.index'), icon: BookOpenIcon },
                        { name: 'Attendance', href: route('attendance.index'), icon: ClipboardDocumentListIcon },
                    ],
                },
                {
                    label: 'Management',
                    items: [
                        { name: 'Payouts', href: route('payouts.index'), icon: CurrencyDollarIcon },
                        { name: 'Reports', href: route('reports.index'), icon: ChartBarIcon },
                        { name: 'Settings', href: route('settings.index'), icon: Cog6ToothIcon },
                    ],
                },
            ];
        }

        return [{ items: baseItems }];
    } catch (e) {
        // Fallback to simple paths if routes aren't available
        const baseItems = [
            { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        ];
        return [{ items: baseItems }];
    }
});
</script>

