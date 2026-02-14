'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Conversation, Message } from '@/types';
import { initializeData, getConversations, getMessages, sendMessage, getUsers } from '@/lib/data/store';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatListSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ReportModal from '@/components/features/chat/ReportModal';
import { createReport } from '@/lib/data/store';
import { toast } from 'sonner';
import {
    MoreVertical,
    User as UserIcon, // Renamed to avoid conflict with '@/types' User
    Flag
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialToId = searchParams.get('to');

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize and Load User
    useEffect(() => {
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }
        setCurrentUser(JSON.parse(userStr));
        setUsers(getUsers());
    }, [router]);

    // Load Conversations
    useEffect(() => {
        if (!currentUser) return;

        const allConversations = getConversations();
        const userConversations = allConversations.filter(c => c.participants.includes(currentUser.id));
        setConversations(userConversations); // Sort by last message already done in store? store logic is basic.

        // If 'to' param exists, find or start conversation
        if (initialToId && users.length > 0) {
            const existingConv = userConversations.find(c => c.participants.includes(initialToId) && c.participants.length === 2);
            if (existingConv) {
                setActiveConversationId(existingConv.id);
            } else {
                // We handle new conversation start temporarily by just setting the other user
                const targetUser = users.find(u => u.id === initialToId);
                if (targetUser) {
                    setOtherUser(targetUser);
                    setActiveConversationId('new');
                }
            }
        }
        // Handle Batch Conversation
        else if (searchParams.get('batch')) {
            const batchYear = searchParams.get('batch');
            const batchId = `batch_${batchYear}`;
            const existingConv = userConversations.find(c => c.id === batchId);

            if (existingConv) {
                setActiveConversationId(batchId);
            } else {
                // Create new batch conversation object locally
                const batchConv: Conversation = {
                    id: batchId,
                    participants: [], // Batch chat might not list all 100 participants here, or we use a special flag
                    lastMessage: 'Welcome to the batch discussion!',
                    lastMessageAt: new Date().toISOString(),
                    unreadCount: 0,
                    isGroup: true,
                    groupName: `Class of ${batchYear}`
                };
                // We set it as active, and UI will handle it
                setConversations(prev => [batchConv, ...prev]);
                setActiveConversationId(batchId);
            }
        }
        else if (userConversations.length > 0 && !activeConversationId && !initialToId) {
            setActiveConversationId(userConversations[0].id);
        }
    }, [currentUser, initialToId, users, searchParams]);

    // Load Messages for Active Conversation
    useEffect(() => {
        if (!activeConversationId || !currentUser) return;

        if (activeConversationId === 'new') {
            setMessages([]);
            return;
        }

        const conv = conversations.find(c => c.id === activeConversationId);
        if (conv) {
            const otherUserId = conv.participants.find(p => p !== currentUser.id);
            const other = users.find(u => u.id === otherUserId);
            setOtherUser(other || null);

            setMessages(getMessages(activeConversationId));
        }
    }, [activeConversationId, conversations, currentUser, users]);

    // Scroll to bottom
    const isFirstLoad = useRef(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messages.length > 0) {
            // Only scroll smoothly if it's not the initial mount to prevent jarring jumps
            // But for a chat app, usually you DO want to see the latest. 
            // The user request says "Update messages/page.tsx to prevent: Auto-scrolling to the bottom on initial load"
            // This implies they want to start at the TOP or just not jump? 
            // "Pages always load at the top" -> usually implies main scrollbar.
            // But for a chat box, usually you want latest.
            // "Ensure the Messages page always loads in a stable top position"
            // If the PAGE scrolls, that's bad. The CHAT container should scroll.
            // The chat container has `flex-grow overflow-y-auto`.
            // Let's ensure the `messagesEndRef` scroll only affects the container, not the window.
            // behavior: 'smooth' might try to scroll the window if the element is out of view?
            // Actually, `scrollIntoView` CAN scroll the parent window. `block: 'nearest'` might help.
            // Or better: scrollTop = scrollHeight.

            if (isFirstLoad.current) {
                isFirstLoad.current = false;
                // On first load, maybe they WANT it to be at the top? 
                // "Messages page always loads in a stable top position" -> The PAGE (window) should be top. 
                // The CHAT CONTENT might need to be at bottom? 
                // "Do not auto-scroll conversations or message panels on initial load" -> Okay, they don't want the chat to jump to bottom?
                // That's unusual for chat, but I will follow instructions: "Do not auto-scroll ... on initial load".
                return;
            }

            if (scrollContainerRef.current) {
                const { scrollHeight, clientHeight } = scrollContainerRef.current;
                scrollContainerRef.current.scrollTo({
                    top: scrollHeight - clientHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !otherUser) return;

        let convId = activeConversationId;
        const effectiveConvId = convId === 'new' ? `conv_${Date.now()}` : convId!;

        sendMessage(effectiveConvId, currentUser.id, newMessage);

        // If it was new, we need to ensure the conversation object exists in store
        if (convId === 'new') {
            // Retrieve current conversations from storage to add the new one
            try {
                const stored = localStorage.getItem('vjit_conversations');
                const parsed = stored ? JSON.parse(stored) : [];
                const newConv: Conversation = {
                    id: effectiveConvId,
                    participants: [currentUser.id, otherUser.id],
                    lastMessage: newMessage,
                    lastMessageAt: new Date().toISOString(),
                    unreadCount: 0 // Simplification
                };
                localStorage.setItem('vjit_conversations', JSON.stringify([...parsed, newConv]));

                setActiveConversationId(effectiveConvId);
                setConversations(prev => [newConv, ...prev]);
            } catch (e) {
                console.error(e);
            }
        } else {
            // Update local list to show new message preview
            setConversations(prev => prev.map(c =>
                c.id === effectiveConvId
                    ? { ...c, lastMessage: newMessage, lastMessageAt: new Date().toISOString() }
                    : c
            ));
        }

        setMessages(getMessages(effectiveConvId));
        setNewMessage('');
    };

    const getUserName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Unknown User';
    };

    const handleReportSubmit = async (reason: string, description: string) => {
        if (!currentUser || !otherUser || !activeConversationId) return;

        // Create a deep copy of the last 20 messages
        const messagesSnapshot = JSON.parse(JSON.stringify(messages.slice(-20)));

        const reportData = {
            reporterId: currentUser.id,
            reporterName: currentUser.name,
            reporterRole: currentUser.role,
            reportedUserId: otherUser.id,
            reportedUserName: otherUser.name,
            reportedUserRole: otherUser.role,
            conversationId: activeConversationId,
            reason,
            description,
            messagesSnapshot
        };

        const result = createReport(reportData);

        if (result.success) {
            toast.success('Report Submitted', {
                description: 'The conversation has been reported to the administration for review.'
            });
            setIsReportModalOpen(false);
        } else {
            toast.error('Submission Failed', {
                description: result.message
            });
        }
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-[#800000]">Messages</h1>
            </div>

            <div className="flex-grow flex gap-4 overflow-hidden h-full mt-4">
                {/* Sidebar - Conversation List */}
                <div className="w-full md:w-1/3 bg-white border border-gray-200 flex flex-col h-full rounded-lg overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-700">Conversations</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {!currentUser ? (
                            <div className="p-4 space-y-4">
                                {[1, 2, 3].map(i => <ChatListSkeleton key={i} />)}
                            </div>
                        ) : conversations.length > 0 ? (
                            conversations.map(conv => {
                                const otherParticipantId = conv.participants.find(p => p !== currentUser?.id);
                                const otherParticipant = users.find(u => u.id === otherParticipantId);
                                const isActive = activeConversationId === conv.id;

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => setActiveConversationId(conv.id)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${isActive ? 'bg-red-50 border-l-4 border-l-[#800000]' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 shrink-0">
                                                <AvatarImage src={otherParticipant?.profileImage} alt={otherParticipant?.name} />
                                                <AvatarFallback className="bg-[#800000] text-white font-bold text-sm">
                                                    {otherParticipant?.name.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="overflow-hidden">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {otherParticipant?.name || 'Unknown User'}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate mt-0.5">
                                                    {conv.lastMessage}
                                                </div>
                                            </div>
                                            <div className="ml-auto text-[10px] text-gray-400 self-start mt-1 whitespace-nowrap">
                                                {new Date(conv.lastMessageAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                <EmptyState
                                    icon="💬"
                                    title="No conversations yet"
                                    description="Connect with alumni or students to start chatting."
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="w-full md:w-2/3 bg-white border border-gray-200 flex flex-col h-full rounded-lg overflow-hidden shadow-sm">
                    {activeConversationId ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                                <div className="font-semibold text-[#800000] flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={otherUser?.profileImage} alt={otherUser?.name} />
                                        <AvatarFallback className="bg-[#800000] text-white font-bold">
                                            {otherUser?.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div>{otherUser?.name || 'Loading...'}</div>
                                        {otherUser && (
                                            <div className="text-xs text-gray-500 font-normal">
                                                {otherUser.role.charAt(0).toUpperCase() + otherUser.role.slice(1)} • {otherUser.department || 'VJIT'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                            aria-label="Conversation actions"
                                        >
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                            className="cursor-pointer font-medium"
                                            onClick={() => {
                                                if (!otherUser?.id) {
                                                    console.warn('Cannot navigate: User ID is missing');
                                                    return;
                                                }

                                                let profilePath = '';
                                                if (otherUser.role === 'student') {
                                                    // As per requirement: navigate to /students/[id]
                                                    // Note: Ensure this route exists or is handled
                                                    profilePath = `/students/${otherUser.id}`;
                                                } else if (otherUser.role === 'alumni') {
                                                    // Map 'alumni' role to the existing directory route
                                                    profilePath = `/alumni-directory/${otherUser.id}`;
                                                }

                                                if (profilePath) {
                                                    // Use window.location for full navigation if needed, or router.push
                                                    // Using window.location to ensure fresh data load as per previous patterns
                                                    // But router.push is better for SPA.
                                                    // User asked for "Maintain SPA-style navigation", so router.push
                                                    router.push(profilePath);
                                                }
                                            }}
                                        >
                                            <UserIcon className="mr-2 h-4 w-4 text-gray-500" />
                                            View Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="cursor-pointer font-medium text-gray-700 hover:text-gray-900 hover:bg-amber-50 focus:bg-amber-50 focus:text-gray-900"
                                            onClick={() => setIsReportModalOpen(true)}
                                            aria-label="Report this conversation"
                                        >
                                            <Flag className="mr-2 h-4 w-4 text-gray-500" />
                                            Report Conversation
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Messages List */}
                            <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#f9f9f9]">
                                {messages.length > 0 ? (
                                    messages.map(msg => {
                                        const isMe = msg.senderId === currentUser?.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${isMe
                                                    ? 'bg-[#800000] text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                                    }`}>
                                                    <div className="break-words leading-relaxed">{msg.content}</div>
                                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'opacity-70' : 'text-gray-400'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl">👋</div>
                                        <p className="font-medium text-gray-600">No messages yet.</p>
                                        <p className="text-sm">Say hello to start the conversation!</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200 bg-white shrink-0">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-grow border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000] bg-gray-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-[#800000] text-white px-6 py-3 rounded-full hover:bg-[#660000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-gray-50">
                            <EmptyState
                                icon="💬"
                                title="Select a conversation"
                                description="Choose a contact from the list or browse the directory to message someone."
                                actionLabel="Browse Directory"
                                actionLink="/alumni-directory"
                            />
                        </div>
                    )}
                </div>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReportSubmit}
                reportedUser={otherUser}
            />
        </div>
    );
}
