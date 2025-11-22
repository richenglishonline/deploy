<script setup>
import { ref, onMounted, computed } from 'vue';
import { Head, usePage, router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Card from '@/Components/ui/Card.vue';
import Button from '@/Components/ui/Button.vue';
import Badge from '@/Components/ui/Badge.vue';
import {
    EnvelopeIcon,
    PaperAirplaneIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
    CheckIcon,
} from '@heroicons/vue/24/outline';
import api from '@/lib/api';

const page = usePage();
const loading = ref(false);
const users = ref([]);
const messages = ref([]);
const activeUser = ref(null);
const messageText = ref('');
const searchQuery = ref('');

const currentUserId = computed(() => page.props.auth?.user?.id);

const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value;
    const query = searchQuery.value.toLowerCase();
    return users.value.filter(user => {
        const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || '';
        return name.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query);
    });
});

const loadUsers = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/message/users');
        users.value = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error loading users:', error);
        users.value = [];
    } finally {
        loading.value = false;
    }
};

const loadConversation = async (user) => {
    activeUser.value = user;
    loading.value = true;
    try {
        const { data } = await api.get(`/message/${user.id}`);
        messages.value = Array.isArray(data.messages || data) ? (data.messages || data) : [];
        // Scroll to bottom after loading
        setTimeout(() => {
            const container = document.getElementById('messages-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 100);
    } catch (error) {
        console.error('Error loading conversation:', error);
        messages.value = [];
    } finally {
        loading.value = false;
    }
};

const sendMessage = async () => {
    if (!messageText.value.trim() || !activeUser.value) return;
    
    const messageToSend = messageText.value.trim();
    messageText.value = '';
    
    // Optimistically add message
    const tempMessage = {
        id: Date.now(),
        message: messageToSend,
        sender_id: currentUserId.value,
        receiver_id: activeUser.value.id,
        created_at: new Date().toISOString(),
        is_temp: true,
    };
    messages.value.push(tempMessage);
    
    // Scroll to bottom
    setTimeout(() => {
        const container = document.getElementById('messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, 100);
    
    try {
        const { data } = await api.post('/message', {
            receiver_id: activeUser.value.id,
            message: messageToSend,
        });
        
        // Replace temp message with real one
        const tempIndex = messages.value.findIndex(m => m.is_temp);
        if (tempIndex >= 0) {
            messages.value[tempIndex] = data;
        } else {
            messages.value.push(data);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // Remove temp message on error
        const tempIndex = messages.value.findIndex(m => m.is_temp);
        if (tempIndex >= 0) {
            messages.value.splice(tempIndex, 1);
        }
        messageText.value = messageToSend; // Restore message text
        alert('Failed to send message');
    }
};

const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
};

const getUserInitials = (user) => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

onMounted(async () => {
    await loadUsers();
    if (users.value.length > 0) {
        await loadConversation(users.value[0]);
    }
});
</script>

<template>
    <Head title="Messages" />
    
    <AuthenticatedLayout>
        <div class="space-y-6 pb-8">
            <!-- Page Header -->
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Messages</h1>
                <p class="mt-1 text-sm text-gray-500">
                    Communicate with teachers, students, and admins
                </p>
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <!-- Users List -->
                <Card class="p-0 lg:col-span-1">
                    <div class="border-b border-gray-200 p-4">
                        <div class="relative">
                            <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                v-model="searchQuery"
                                type="text"
                                placeholder="Search conversations..."
                                class="block w-full rounded-lg border-0 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div class="max-h-[600px] overflow-y-auto">
                        <button
                            v-for="user in filteredUsers"
                            :key="user.id"
                            @click="loadConversation(user)"
                            :class="[
                                'w-full flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors',
                                activeUser?.id === user.id ? 'bg-blue-50 border-blue-200' : '',
                            ]"
                        >
                            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                <span class="text-sm font-semibold text-white">
                                    {{ getUserInitials(user) }}
                                </span>
                            </div>
                            <div class="flex-1 min-w-0 text-left">
                                <p class="font-medium text-gray-900 truncate">
                                    {{ `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User' }}
                                </p>
                                <p class="text-xs text-gray-500 truncate">{{ user.email || '' }}</p>
                            </div>
                            <Badge v-if="user.unread_count > 0" variant="primary" class="text-xs">
                                {{ user.unread_count }}
                            </Badge>
                        </button>
                        
                        <div v-if="filteredUsers.length === 0" class="p-8 text-center">
                            <ChatBubbleLeftRightIcon class="mx-auto h-12 w-12 text-gray-300" />
                            <p class="mt-4 text-sm font-medium text-gray-900">No conversations</p>
                            <p class="mt-1 text-xs text-gray-500">Start a conversation by selecting a user</p>
                        </div>
                    </div>
                </Card>

                <!-- Messages Area -->
                <Card v-if="activeUser" class="lg:col-span-3 flex flex-col p-0">
                    <!-- Chat Header -->
                    <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                <span class="text-sm font-semibold text-white">
                                    {{ getUserInitials(activeUser) }}
                                </span>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900">
                                    {{ `${activeUser.first_name || ''} ${activeUser.last_name || ''}`.trim() || activeUser.email || 'User' }}
                                </h3>
                                <p class="text-xs text-gray-500">{{ activeUser.email || '' }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Messages Container -->
                    <div
                        id="messages-container"
                        class="flex-1 overflow-y-auto p-6 space-y-4"
                        style="max-height: 500px;"
                    >
                        <div
                            v-for="message in messages"
                            :key="message.id"
                            :class="[
                                'flex gap-3',
                                message.sender_id === currentUserId ? 'justify-end' : 'justify-start',
                            ]"
                        >
                            <div
                                v-if="message.sender_id !== currentUserId"
                                class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex-shrink-0"
                            >
                                <span class="text-xs font-semibold text-white">
                                    {{ getUserInitials(message.sender || activeUser) }}
                                </span>
                            </div>
                            
                            <div
                                :class="[
                                    'max-w-[70%] rounded-2xl px-4 py-2',
                                    message.sender_id === currentUserId
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900',
                                ]"
                            >
                                <p class="text-sm">{{ message.message }}</p>
                                <p
                                    :class="[
                                        'mt-1 text-xs',
                                        message.sender_id === currentUserId
                                            ? 'text-blue-100'
                                            : 'text-gray-500',
                                    ]"
                                >
                                    {{ formatTime(message.created_at) }}
                                </p>
                            </div>
                            
                            <div
                                v-if="message.sender_id === currentUserId"
                                class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0"
                            >
                                <span class="text-xs font-semibold text-white">
                                    {{ getUserInitials({ email: page.props.auth?.user?.email, name: page.props.auth?.user?.name }) }}
                                </span>
                            </div>
                        </div>
                        
                        <div v-if="messages.length === 0 && !loading" class="text-center py-12">
                            <ChatBubbleLeftRightIcon class="mx-auto h-12 w-12 text-gray-300" />
                            <p class="mt-4 text-sm font-medium text-gray-900">No messages yet</p>
                            <p class="mt-1 text-xs text-gray-500">Start the conversation!</p>
                        </div>
                    </div>

                    <!-- Message Input -->
                    <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <form @submit.prevent="sendMessage" class="flex items-center gap-3">
                            <input
                                v-model="messageText"
                                type="text"
                                placeholder="Type a message..."
                                class="flex-1 rounded-lg border-0 bg-white py-2.5 px-4 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                :disabled="!messageText.trim() || loading"
                            >
                                <PaperAirplaneIcon class="h-5 w-5" />
                            </Button>
                        </form>
                    </div>
                </Card>

                <!-- Empty State -->
                <Card v-else class="lg:col-span-3 flex items-center justify-center p-12">
                    <div class="text-center">
                        <ChatBubbleLeftRightIcon class="mx-auto h-16 w-16 text-gray-300" />
                        <p class="mt-4 text-lg font-medium text-gray-900">Select a conversation</p>
                        <p class="mt-1 text-sm text-gray-500">
                            Choose a user from the list to start messaging
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
