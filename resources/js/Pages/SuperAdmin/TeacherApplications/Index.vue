<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import Button from '@/Components/ui/Button.vue';
import Dialog from '@/Components/ui/dialog/Dialog.vue';
import DialogContent from '@/Components/ui/dialog/DialogContent.vue';
import DialogHeader from '@/Components/ui/dialog/DialogHeader.vue';
import DialogTitle from '@/Components/ui/dialog/DialogTitle.vue';
import DialogFooter from '@/Components/ui/dialog/DialogFooter.vue';
import {
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    AcademicCapIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    PhoneIcon,
    GlobeAltIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const applications = ref([]);
const selectedApplication = ref(null);
const reviewDialogOpen = ref(false);
const reviewing = ref(false);

const columns = [
    {
        key: 'applicant',
        label: 'Applicant',
        sortable: true,
    },
    {
        key: 'email',
        label: 'Email',
        sortable: true,
    },
    {
        key: 'country',
        label: 'Country',
        sortable: true,
    },
    {
        key: 'degree',
        label: 'Education',
        sortable: true,
    },
    {
        key: 'status',
        label: 'Status',
        sortable: true,
        align: 'center',
    },
    {
        key: 'submitted_at',
        label: 'Submitted',
        sortable: true,
        format: 'date',
    },
];

const filters = [
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: '', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
        ],
    },
    {
        key: 'country',
        label: 'Country',
        type: 'select',
        options: [
            { value: '', label: 'All Countries' },
            { value: 'Philippines', label: 'Philippines' },
            { value: 'USA', label: 'USA' },
            { value: 'India', label: 'India' },
        ],
    },
];

const fetchApplications = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/teacher-applications');
        applications.value = Array.isArray(data.applications || data) ? (data.applications || data).map(app => ({
            ...app,
            applicant: `${app.first_name || ''} ${app.last_name || ''}`.trim() || app.email || 'Unnamed',
            email: app.email || 'N/A',
            country: app.country || 'N/A',
            degree: app.degree || 'N/A',
            status: app.accepted ? 'approved' : (app.meta?.teacher_application_status === 'rejected' ? 'rejected' : 'pending'),
            submitted_at: app.created_at || app.submitted_at,
        })) : [];
    } catch (error) {
        console.error('Error fetching applications:', error);
        applications.value = [];
    } finally {
        loading.value = false;
    }
};

const openReview = (application) => {
    selectedApplication.value = application;
    reviewDialogOpen.value = true;
};

const handleApprove = async () => {
    if (!selectedApplication.value) return;
    reviewing.value = true;
    try {
        await api.patch(`/teacher-applications/${selectedApplication.value.id}`, {
            status: 'approved',
        });
        await fetchApplications();
        reviewDialogOpen.value = false;
        selectedApplication.value = null;
    } catch (error) {
        console.error('Error approving application:', error);
        alert('Failed to approve application');
    } finally {
        reviewing.value = false;
    }
};

const handleReject = async () => {
    if (!selectedApplication.value) return;
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    reviewing.value = true;
    try {
        await api.patch(`/teacher-applications/${selectedApplication.value.id}`, {
            status: 'rejected',
            notes: reason,
        });
        await fetchApplications();
        reviewDialogOpen.value = false;
        selectedApplication.value = null;
    } catch (error) {
        console.error('Error rejecting application:', error);
        alert('Failed to reject application');
    } finally {
        reviewing.value = false;
    }
};

const handleView = (row) => {
    router.visit(`/super-admin/teacher-applications/${row.id}/review`);
};

onMounted(() => {
    fetchApplications();
});
</script>

<template>
    <Head title="Teacher Applications" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Teacher Applications</h1>
                <p class="mt-1 text-sm text-gray-500">
                    Review and manage teacher applications
                </p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Applications</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ applications.length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <DocumentTextIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Pending Review</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ applications.filter(a => a.status === 'pending').length }}
                            </p>
                            <p class="mt-1 text-xs text-yellow-600">Requires action</p>
                        </div>
                        <div class="rounded-lg bg-yellow-50 p-3">
                            <ClockIcon class="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Approved</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ applications.filter(a => a.status === 'approved').length }}
                            </p>
                            <p class="mt-1 text-xs text-green-600">This month</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <CheckCircleIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Applications Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Applications"
                :columns="columns"
                :data="applications"
                :searchable="true"
                :paginated="true"
                :exportable="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
            >
                <template #cell-applicant="{ row }">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                            <span class="text-sm font-semibold text-white">
                                {{ row.applicant.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
                            </span>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">{{ row.applicant }}</div>
                            <div v-if="row.phone" class="text-xs text-gray-500 flex items-center gap-1">
                                <PhoneIcon class="h-3 w-3" />
                                {{ row.phone }}
                            </div>
                        </div>
                    </div>
                </template>

                <template #cell-email="{ row }">
                    <div class="flex items-center gap-2 text-gray-900">
                        <EnvelopeIcon class="h-4 w-4 text-gray-400" />
                        {{ row.email }}
                    </div>
                </template>

                <template #cell-country="{ row }">
                    <div class="flex items-center gap-2 text-gray-900">
                        <GlobeAltIcon class="h-4 w-4 text-gray-400" />
                        {{ row.country }}
                    </div>
                </template>

                <template #cell-degree="{ row }">
                    <div class="text-gray-900">{{ row.degree }}</div>
                </template>

                <template #cell-status="{ row }">
                    <Badge 
                        :variant="row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'"
                    >
                        {{ row.status || 'pending' }}
                    </Badge>
                </template>

                <template #row-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            @click="openReview(row)"
                            class="rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            title="Review Application"
                        >
                            Review
                        </button>
                        <button
                            @click="handleView(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            title="View Details"
                        >
                            <EyeIcon class="h-5 w-5" />
                        </button>
                    </div>
                </template>
            </AdvancedTable>

            <!-- Loading State -->
            <div v-else class="space-y-4">
                <div class="h-64 rounded-xl bg-gray-200 animate-pulse"></div>
            </div>
        </div>

        <!-- Review Dialog -->
        <Dialog v-model:open="reviewDialogOpen">
            <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Review Application</DialogTitle>
                </DialogHeader>
                
                <div v-if="selectedApplication" class="space-y-6 py-4">
                    <!-- Applicant Info -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Name</p>
                            <p class="mt-1 text-gray-900">{{ selectedApplication.applicant }}</p>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600">Email</p>
                            <p class="mt-1 text-gray-900">{{ selectedApplication.email }}</p>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600">Phone</p>
                            <p class="mt-1 text-gray-900">{{ selectedApplication.phone || 'N/A' }}</p>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600">Country</p>
                            <p class="mt-1 text-gray-900">{{ selectedApplication.country }}</p>
                        </div>
                    </div>

                    <!-- Education -->
                    <div>
                        <p class="text-sm font-medium text-gray-600">Education</p>
                        <p class="mt-1 text-gray-900">{{ selectedApplication.degree }} in {{ selectedApplication.major || 'N/A' }}</p>
                    </div>

                    <!-- Equipment & Availability -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Equipment</p>
                            <div class="mt-1 flex gap-2">
                                <Badge v-if="selectedApplication.has_webcam" variant="success">Webcam</Badge>
                                <Badge v-if="selectedApplication.has_headset" variant="success">Headset</Badge>
                                <Badge v-if="selectedApplication.has_backup_internet" variant="success">Backup Internet</Badge>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600">English Level</p>
                            <p class="mt-1 text-gray-900">{{ selectedApplication.english_level || 'N/A' }}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" @click="reviewDialogOpen = false">Cancel</Button>
                    <Button variant="danger" @click="handleReject" :disabled="reviewing">
                        <XCircleIcon class="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                    <Button variant="primary" @click="handleApprove" :disabled="reviewing">
                        <CheckCircleIcon class="h-4 w-4 mr-2" />
                        Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </AuthenticatedLayout>
</template>