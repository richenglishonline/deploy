<template>
    <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div class="mb-6 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button
                class="text-sm font-medium text-blue-600 hover:text-blue-700"
                @click="$emit('view-all')"
            >
                View all
            </button>
        </div>
        <div class="space-y-4">
            <div
                v-for="(activity, index) in activities"
                :key="index"
                class="relative flex gap-4 pb-4 last:pb-0"
            >
                <div
                    v-if="index < activities.length - 1"
                    class="absolute left-4 top-8 h-full w-0.5 bg-gray-200"
                ></div>
                <div
                    :class="[
                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-white',
                        activity.iconBg,
                    ]"
                >
                    <component
                        :is="activity.icon"
                        :class="[activity.iconColor, 'h-4 w-4']"
                    />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">
                        {{ activity.title }}
                    </p>
                    <p class="mt-1 text-sm text-gray-500">{{ activity.description }}</p>
                    <p class="mt-1 text-xs text-gray-400">{{ activity.time }}</p>
                </div>
            </div>
            <div v-if="activities.length === 0" class="py-8 text-center">
                <p class="text-sm text-gray-500">No recent activity</p>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    activities: {
        type: Array,
        default: () => [],
    },
});

defineEmits(['view-all']);
</script>

