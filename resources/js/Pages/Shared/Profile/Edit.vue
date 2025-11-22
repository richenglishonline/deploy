<script setup>
import { computed } from 'vue';
import { Head, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import DeleteUserForm from '@/Pages/SuperAdmin/Shared/Profile/Partials/DeleteUserForm.vue';
import UpdatePasswordForm from '@/Pages/SuperAdmin/Shared/Profile/Partials/UpdatePasswordForm.vue';
import UpdateProfileInformationForm from '@/Pages/SuperAdmin/Shared/Profile/Partials/UpdateProfileInformationForm.vue';
import {
    UserIcon,
    EnvelopeIcon,
    KeyIcon,
    TrashIcon,
    CameraIcon,
} from '@heroicons/vue/24/outline';

defineProps({
    mustVerifyEmail: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        default: '',
    },
});

const page = usePage();
const user = computed(() => page.props.auth?.user);
const userInitials = computed(() => {
    const name = user.value?.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});
</script>

<template>
    <Head title="Profile" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Profile</h1>
                <p class="mt-1 text-sm text-gray-500">
                    Manage your profile information and account settings
                </p>
            </div>

            <!-- Profile Header -->
            <Card class="p-6">
                <div class="flex items-center gap-6">
                    <div class="relative">
                        <div class="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-semibold text-white">
                            {{ userInitials }}
                        </div>
                        <button class="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2 text-white shadow-lg hover:bg-blue-700 transition-colors">
                            <CameraIcon class="h-4 w-4" />
                        </button>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-gray-900">{{ user?.name || 'User' }}</h2>
                        <p class="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <EnvelopeIcon class="h-4 w-4" />
                            {{ user?.email || '' }}
                        </p>
                        <div class="mt-2">
                            <Badge :variant="user?.role === 'super-admin' ? 'primary' : user?.role === 'admin' ? 'success' : 'secondary'">
                                {{ user?.role || 'teacher' }}
                            </Badge>
                        </div>
                    </div>
                </div>
            </Card>

            <!-- Profile Information -->
            <Card class="p-6">
                <div class="mb-6 flex items-center gap-3">
                    <div class="rounded-lg bg-blue-50 p-2">
                        <UserIcon class="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900">Profile Information</h2>
                </div>
                <UpdateProfileInformationForm
                    :must-verify-email="mustVerifyEmail"
                    :status="status"
                    class="max-w-2xl"
                />
            </Card>

            <!-- Password Update -->
            <Card class="p-6">
                <div class="mb-6 flex items-center gap-3">
                    <div class="rounded-lg bg-green-50 p-2">
                        <KeyIcon class="h-6 w-6 text-green-600" />
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900">Update Password</h2>
                </div>
                <UpdatePasswordForm class="max-w-2xl" />
            </Card>

            <!-- Delete Account -->
            <Card class="p-6 border-red-200">
                <div class="mb-6 flex items-center gap-3">
                    <div class="rounded-lg bg-red-50 p-2">
                        <TrashIcon class="h-6 w-6 text-red-600" />
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900">Delete Account</h2>
                </div>
                <DeleteUserForm class="max-w-2xl" />
            </Card>
        </div>
    </AuthenticatedLayout>
</template>
