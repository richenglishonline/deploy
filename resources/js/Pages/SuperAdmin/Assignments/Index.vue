<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import AdvancedTable from '@/Components/ui/AdvancedTable.vue';
import Button from '@/Components/ui/Button.vue';
import Badge from '@/Components/ui/Badge.vue';
import Card from '@/Components/ui/Card.vue';
import {
    PlusIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    BookOpenIcon,
    AcademicCapIcon,
    UserGroupIcon,
    CalendarIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const assignments = ref([]);
const stats = ref(null);
const teacherOptions = ref([]);
const studentOptions = ref([]);
const bookOptions = ref([]);

const columns = [
    {
        key: 'student',
        label: 'Student',
        sortable: true,
    },
    {
        key: 'teacher',
        label: 'Teacher',
        sortable: true,
    },
    {
        key: 'book',
        label: 'Book',
        sortable: true,
    },
    {
        key: 'assigned_date',
        label: 'Assigned',
        sortable: true,
        format: 'date',
    },
    {
        key: 'due_date',
        label: 'Due Date',
        sortable: true,
        format: 'date',
    },
    {
        key: 'progress',
        label: 'Progress',
        sortable: true,
        align: 'center',
        format: 'percentage',
    },
    {
        key: 'status',
        label: 'Status',
        sortable: true,
        align: 'center',
    },
];

const filters = [
    {
        key: 'teacher_id',
        label: 'Teacher',
        type: 'select',
        options: [
            { value: '', label: 'All Teachers' },
            ...teacherOptions.value.map(t => ({
                value: t.id,
                label: `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.email,
            })),
        ],
    },
    {
        key: 'student_id',
        label: 'Student',
        type: 'select',
        options: [
            { value: '', label: 'All Students' },
            ...studentOptions.value.map(s => ({
                value: s.id,
                label: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email,
            })),
        ],
    },
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: '', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'overdue', label: 'Overdue' },
        ],
    },
];

const fetchAssignments = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/book-assign');
        assignments.value = Array.isArray(data.assignments || data) ? (data.assignments || data).map(assignment => ({
            ...assignment,
            student: assignment.student ? `${assignment.student.first_name || ''} ${assignment.student.last_name || ''}`.trim() || assignment.student.email : 'N/A',
            teacher: assignment.teacher ? `${assignment.teacher.first_name || ''} ${assignment.teacher.last_name || ''}`.trim() || assignment.teacher.email : 'N/A',
            book: assignment.book?.title || 'N/A',
            assigned_date: assignment.created_at || assignment.assigned_date,
            due_date: assignment.due_date,
            progress: assignment.progress || 0,
            status: assignment.status || 'active',
        })) : [];
    } catch (error) {
        console.error('Error fetching assignments:', error);
        assignments.value = [];
    } finally {
        loading.value = false;
    }
};

const fetchOptions = async () => {
    try {
        const [teachersRes, studentsRes, booksRes] = await Promise.all([
            api.get('/teacher').catch(() => ({ data: { teachers: [] } })),
            api.get('/students').catch(() => ({ data: [] })),
            api.get('/books').catch(() => ({ data: { books: [] } })),
        ]);
        teacherOptions.value = teachersRes.data?.teachers || teachersRes.data || [];
        studentOptions.value = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data?.students || []);
        bookOptions.value = booksRes.data?.books || booksRes.data || [];
    } catch (error) {
        console.error('Error fetching options:', error);
    }
};

const fetchStats = async () => {
    try {
        const { data } = await api.get('/dashboard/stats');
        stats.value = data?.stats || {};
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
};

const handleCreate = () => {
    router.visit('/super-admin/assignments/create');
};

const handleView = (row) => {
    router.visit(`/super-admin/assignments/${row.id}`);
};

const handleDelete = async (assignment) => {
    if (!confirm(`Are you sure you want to delete this assignment?`)) return;
    
    try {
        await api.delete(`/book-assign/${assignment.id}`);
        await fetchAssignments();
        await fetchStats();
    } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Failed to delete assignment');
    }
};

const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.value.length} assignment(s)?`)) return;
    
    try {
        await Promise.all(selectedRows.value.map(assignment => api.delete(`/book-assign/${assignment.id}`)));
        selectedRows.value = [];
        await fetchAssignments();
        await fetchStats();
    } catch (error) {
        console.error('Error bulk deleting assignments:', error);
        alert('Failed to delete some assignments');
    }
};

const handleExport = (data) => {
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
        columns.map(col => `"${row[col.key] || ''}"`).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

onMounted(() => {
    fetchOptions();
    fetchAssignments();
    fetchStats();
});
</script>

<template>
    <Head title="Assignments Management" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Assignments Management</h1>
                    <p class="mt-1 text-sm text-gray-500">
                        Manage book assignments to students
                    </p>
                </div>
                <Button @click="handleCreate" variant="primary">
                    <PlusIcon class="h-5 w-5 mr-2" />
                    Create Assignment
                </Button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Assignments</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ assignments.length }}
                            </p>
                        </div>
                        <div class="rounded-lg bg-blue-50 p-3">
                            <BookOpenIcon class="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Active</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ assignments.filter(a => a.status === 'active').length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">In progress</p>
                        </div>
                        <div class="rounded-lg bg-green-50 p-3">
                            <CalendarIcon class="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Completed</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ assignments.filter(a => a.status === 'completed').length }}
                            </p>
                            <p class="mt-1 text-xs text-gray-500">Finished</p>
                        </div>
                        <div class="rounded-lg bg-emerald-50 p-3">
                            <BookOpenIcon class="h-8 w-8 text-emerald-600" />
                        </div>
                    </div>
                </Card>
                
                <Card class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Overdue</p>
                            <p class="mt-2 text-3xl font-semibold text-gray-900">
                                {{ assignments.filter(a => a.status === 'overdue').length }}
                            </p>
                            <p class="mt-1 text-xs text-red-600">Needs attention</p>
                        </div>
                        <div class="rounded-lg bg-red-50 p-3">
                            <CalendarIcon class="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Assignments Table -->
            <AdvancedTable
                v-if="!loading"
                title="All Assignments"
                :columns="columns"
                :data="assignments"
                :searchable="true"
                :paginated="true"
                :selectable="true"
                :exportable="true"
                :filters="filters"
                :items-per-page="25"
                row-key="id"
                @export="handleExport"
                @bulk-delete="handleBulkDelete"
            >
                <template #cell-student="{ row }">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-600">
                            <span class="text-sm font-semibold text-white">
                                {{ row.student.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
                            </span>
                        </div>
                        <span class="font-medium text-gray-900">{{ row.student }}</span>
                    </div>
                </template>

                <template #cell-teacher="{ row }">
                    <div class="flex items-center gap-2">
                        <AcademicCapIcon class="h-4 w-4 text-gray-400" />
                        <span class="text-gray-900">{{ row.teacher }}</span>
                    </div>
                </template>

                <template #cell-book="{ row }">
                    <div class="flex items-center gap-2">
                        <BookOpenIcon class="h-4 w-4 text-gray-400" />
                        <span class="text-gray-900">{{ row.book }}</span>
                    </div>
                </template>

                <template #cell-progress="{ row }">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">{{ row.progress || 0 }}%</span>
                        <div class="h-2 w-16 rounded-full bg-gray-200">
                            <div 
                                class="h-2 rounded-full bg-green-500"
                                :style="{ width: `${Math.min(row.progress || 0, 100)}%` }"
                            ></div>
                        </div>
                    </div>
                </template>

                <template #cell-status="{ row }">
                    <Badge 
                        :variant="row.status === 'completed' ? 'success' : row.status === 'overdue' ? 'danger' : 'primary'"
                    >
                        {{ row.status || 'active' }}
                    </Badge>
                </template>

                <template #row-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            @click="handleView(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            title="View Details"
                        >
                            <EyeIcon class="h-5 w-5" />
                        </button>
                        <button
                            @click="handleDelete(row)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 transition-colors"
                            title="Delete"
                        >
                            <TrashIcon class="h-5 w-5" />
                        </button>
                    </div>
                </template>
            </AdvancedTable>

            <!-- Loading State -->
            <div v-else class="space-y-4">
                <div class="h-64 rounded-xl bg-gray-200 animate-pulse"></div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>