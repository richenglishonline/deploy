<script setup>
import { ref } from "vue";
import Sidebar from "@/Components/Layout/Sidebar.vue";
import TopNav from "@/Components/Layout/TopNav.vue";

const sidebarOpen = ref(false);

const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
    sidebarOpen.value = false;
};
</script>

<template>
    <div class="flex h-screen overflow-hidden bg-gray-50">
        <!-- Sidebar -->
        <Sidebar :is-open="sidebarOpen" @close="closeSidebar" />

        <!-- Main Content -->
        <div class="flex flex-1 flex-col overflow-hidden lg:pl-64">
            <!-- Top Navigation -->
            <TopNav @toggle-sidebar="toggleSidebar" />

            <!-- Page Content -->
            <main class="flex-1 overflow-y-auto">
                <div class="py-6">
                    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <slot name="header" />
                        <slot />
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>
