<template>
    <header class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
        <!-- Mobile menu button -->
        <button
            @click="$emit('toggle-sidebar')"
            class="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
            <Bars3Icon class="h-6 w-6" />
        </button>

        <!-- Search -->
        <div class="flex-1 max-w-lg">
            <div class="relative">
                <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search..."
                    class="block w-full rounded-lg border-0 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>

        <!-- Right side actions -->
        <div class="flex items-center gap-2">
            <!-- Notifications -->
            <button class="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                <BellIcon class="h-5 w-5" />
                <span class="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            <!-- User menu -->
            <div class="relative" ref="userMenuRef">
                <button
                    @click="showUserMenu = !showUserMenu"
                    class="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
                >
                    <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                        <span class="text-xs font-semibold text-white">
                            {{ userInitials }}
                        </span>
                    </div>
                    <ChevronDownIcon class="hidden h-4 w-4 text-gray-400 sm:block" />
                </button>

                <!-- Dropdown menu -->
                <Transition
                    enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95"
                    enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75"
                    leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95"
                >
                    <div
                        v-if="showUserMenu"
                        class="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
                    >
                        <div class="border-b border-gray-100 px-4 py-3">
                            <p class="text-sm font-medium text-gray-900">{{ userName }}</p>
                            <p class="text-xs text-gray-500">{{ userEmail }}</p>
                        </div>
                        <a
                            href="/profile"
                            class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <UserIcon class="h-4 w-4" />
                            Profile
                        </a>
                        <a
                            href="/settings"
                            class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <Cog6ToothIcon class="h-4 w-4" />
                            Settings
                        </a>
                        <div class="border-t border-gray-100"></div>
                        <form method="POST" action="/logout">
                            <button
                                type="submit"
                                class="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <ArrowRightOnRectangleIcon class="h-4 w-4" />
                                Sign out
                            </button>
                        </form>
                    </div>
                </Transition>
            </div>
        </div>
    </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { usePage } from '@inertiajs/vue3';
import {
    Bars3Icon,
    MagnifyingGlassIcon,
    BellIcon,
    ChevronDownIcon,
    UserIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline';

defineEmits(['toggle-sidebar']);

const page = usePage();
const showUserMenu = ref(false);
const userMenuRef = ref(null);

const user = computed(() => page.props.auth?.user);
const userName = computed(() => user.value?.name || 'User');
const userEmail = computed(() => user.value?.email || '');
const userInitials = computed(() => {
    const name = userName.value;
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
});

const handleClickOutside = (event) => {
    if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
        showUserMenu.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

