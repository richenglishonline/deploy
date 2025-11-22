<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Head, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Card from '@/Components/ui/Card.vue';
import Button from '@/Components/ui/Button.vue';
import FormField from '@/Components/ui/FormField.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    Cog6ToothIcon,
    BellIcon,
    EnvelopeIcon,
    ShieldCheckIcon,
    ServerIcon,
    GlobeAltIcon,
    CheckCircleIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const saving = ref(false);
const settings = ref({});

const formData = reactive({
    site_name: '',
    site_email: '',
    site_url: '',
    timezone: 'UTC',
    date_format: 'Y-m-d',
    currency: 'USD',
    maintenance_mode: false,
    email_notifications: true,
    system_notifications: true,
});

const fetchSettings = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/settings');
        Object.assign(formData, data.settings || data || {});
        settings.value = data.settings || data || {};
    } catch (error) {
        console.error('Error fetching settings:', error);
    } finally {
        loading.value = false;
    }
};

const saveSettings = async () => {
    saving.value = true;
    try {
        await api.put('/settings', formData);
        alert('Settings saved successfully');
        await fetchSettings();
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings');
    } finally {
        saving.value = false;
    }
};

const testEmail = async () => {
    try {
        await api.post('/settings/test-email');
        alert('Test email sent successfully');
    } catch (error) {
        console.error('Error sending test email:', error);
        alert('Failed to send test email');
    }
};

onMounted(() => {
    fetchSettings();
});
</script>

<template>
    <Head title="System Settings" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">System Settings</h1>
                <p class="mt-1 text-sm text-gray-500">
                    Configure global system settings
                </p>
            </div>

            <!-- General Settings -->
            <Card class="p-6">
                <div class="mb-6 flex items-center gap-3">
                    <div class="rounded-lg bg-blue-50 p-2">
                        <Cog6ToothIcon class="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900">General Settings</h2>
                </div>
                
                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                        v-model="formData.site_name"
                        label="Site Name"
                        placeholder="Rich English Learning Platform"
                        hint="The name displayed throughout the platform"
                    />
                    
                    <FormField
                        v-model="formData.site_email"
                        label="Site Email"
                        type="email"
                        placeholder="admin@richenglish.com"
                        hint="Default email for system notifications"
                    />
                    
                    <FormField
                        v-model="formData.site_url"
                        label="Site URL"
                        placeholder="https://richenglish.com"
                        hint="Base URL of the application"
                    />
                    
                    <FormField
                        v-model="formData.timezone"
                        label="Timezone"
                        placeholder="UTC"
                        hint="Default timezone for the system"
                    />
                    
                    <FormField
                        v-model="formData.date_format"
                        label="Date Format"
                        placeholder="Y-m-d"
                        hint="Default date format (e.g., Y-m-d, m/d/Y)"
                    />
                    
                    <FormField
                        v-model="formData.currency"
                        label="Currency"
                        placeholder="USD"
                        hint="Default currency code"
                    />
                </div>
            </Card>

            <!-- System Settings -->
            <Card class="p-6">
                <div class="mb-6 flex items-center gap-3">
                    <div class="rounded-lg bg-purple-50 p-2">
                        <ServerIcon class="h-6 w-6 text-purple-600" />
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900">System Settings</h2>
                </div>
                
                <div class="space-y-4">
                    <label class="flex items-center gap-3">
                        <input
                            v-model="formData.maintenance_mode"
                            type="checkbox"
                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                            <span class="text-sm font-medium text-gray-900">Maintenance Mode</span>
                            <p class="text-xs text-gray-500">Enable to put the site in maintenance mode</p>
                        </div>
                    </label>
                </div>
            </Card>

            <!-- Notification Settings -->
            <Card class="p-6">
                <div class="mb-6 flex items-center gap-3">
                    <div class="rounded-lg bg-green-50 p-2">
                        <BellIcon class="h-6 w-6 text-green-600" />
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900">Notification Settings</h2>
                </div>
                
                <div class="space-y-4">
                    <label class="flex items-center gap-3">
                        <input
                            v-model="formData.email_notifications"
                            type="checkbox"
                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                            <span class="text-sm font-medium text-gray-900">Email Notifications</span>
                            <p class="text-xs text-gray-500">Enable email notifications system-wide</p>
                        </div>
                    </label>
                    
                    <label class="flex items-center gap-3">
                        <input
                            v-model="formData.system_notifications"
                            type="checkbox"
                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                            <span class="text-sm font-medium text-gray-900">System Notifications</span>
                            <p class="text-xs text-gray-500">Enable in-app notifications</p>
                        </div>
                    </label>
                </div>
                
                <div class="mt-6">
                    <Button @click="testEmail" variant="secondary">
                        <EnvelopeIcon class="h-4 w-4 mr-2" />
                        Send Test Email
                    </Button>
                </div>
            </Card>

            <!-- Security Settings -->
            <Card class="p-6">
                <div class="mb-6 flex items-center gap-3">
                    <div class="rounded-lg bg-red-50 p-2">
                        <ShieldCheckIcon class="h-6 w-6 text-red-600" />
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900">Security Settings</h2>
                </div>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div>
                            <p class="text-sm font-medium text-gray-900">Session Timeout</p>
                            <p class="text-xs text-gray-500">Automatic logout after inactivity</p>
                        </div>
                        <Badge variant="success">24 hours</Badge>
                    </div>
                    
                    <div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div>
                            <p class="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                            <p class="text-xs text-gray-500">Enhanced security for all users</p>
                        </div>
                        <Badge variant="warning">Optional</Badge>
                    </div>
                </div>
            </Card>

            <!-- Save Button -->
            <div class="flex justify-end gap-3">
                <Button variant="secondary" @click="fetchSettings">Reset</Button>
                <Button variant="primary" @click="saveSettings" :disabled="saving">
                    <CheckCircleIcon v-if="!saving" class="h-4 w-4 mr-2" />
                    {{ saving ? 'Saving...' : 'Save Settings' }}
                </Button>
            </div>
        </div>
    </AuthenticatedLayout>
</template>