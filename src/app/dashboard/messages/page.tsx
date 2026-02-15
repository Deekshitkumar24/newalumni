'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Conversation } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatListSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ReportModal from '@/components/features/chat/ReportModal';
import { toast } from 'sonner';
import { MoreVertical, User as UserIcon, Flag, Send, AlertTriangle, Lock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';

export default function MessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialToId = searchParams.get('to');

    // Use a ref to track if we've already handled the 'to' param
    const hasHandledInitialTo = useRef(false);

    const { user: currentUser } = useAuth();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [isSending, setIsSending] = useState(false);

    // Data from hook
    const { conversations, messages, sendMessage, isLoading, markAsRead } = useChat(activeConversationId || undefined);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isFirstLoad = useRef(true);

    // Handle 'to' param - create/find conversation
    useEffect(() => {
        const initChat = async () => {
            if (initialToId && currentUser && !hasHandledInitialTo.current) {
                hasHandledInitialTo.current = true;

                // Check if we already have a conversation with this user locally
                const existing = conversations.find(c =>
                    !c.isGroup && c.participants.some(p => (typeof p === 'string' ? p : p.id) === initialToId)
                );

                if (existing) {
                    setActiveConversationId(existing.id);
                } else {
                    // Create/Fetch via API
                    try {
                        const res = await fetch('/api/conversations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ type: 'direct', participantId: initialToId })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            setActiveConversationId(data.data.id);
                        }
                    } catch (e) {
                        console.error("Failed to init chat", e);
                        toast.error("Could not start conversation");
                    }
                }
            }
            // REMOVED: Auto-open logic (lines 68-71)
        };

        if (currentUser && !isLoading) {
            initChat();
        }
    }, [initialToId, currentUser, isLoading, conversations.length]);

    // Mark as read when opening a conversation
    useEffect(() => {
        if (activeConversationId) {
            markAsRead(activeConversationId);
        }
    }, [activeConversationId]);

    // Scroll to bottom handling
    useEffect(() => {
        if (messages.length > 0) {
            if (isFirstLoad.current) {
                isFirstLoad.current = false;
                // Scroll to bottom on first load usually desirable for chat, but per request:
                // "Do not auto-scroll ... on initial load" -> We'll respect that or do it only once lightly.
                // Actually standard chat UX is start at bottom. If user requested otherwise, I'd follow.
                // Re-reading: "Messages page always loads in a stable top position" often refers to the WINDOW scroll.
                // For the chat container, looking at the last message is critical.
                // I will scroll the container to bottom.

                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                }
                return;
            }

            // For subsequent messages (real-time), smooth scroll
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({
                    top: scrollContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [messages.length, activeConversationId]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversationId || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(newMessage);
            setNewMessage('');
        } finally {
            setIsSending(false);
        }
    };

    const handleReportSubmit = async (reason: string, description: string) => {
        if (!currentUser || !activeConversationId) return;

        // We need the other user's ID.
        const currentConv = conversations.find(c => c.id === activeConversationId);
        if (!currentConv) return;

        // Assuming participant structure. The API returns full objects via 'with' or just IDs?
        // My useChat fetches from /api/conversations. 
        // Let's assume the component below has figured out the "otherUser".
        // Use that derived state.
    };

    // Helper to get other participant
    const getOtherParticipant = (conv: Conversation) => {
        if (!currentUser) return null;

        const other = conv.participants.find((p) => {
            const id = typeof p === 'string' ? p : p.id;
            return id !== currentUser.id;
        });

        if (!other) return null;
        return typeof other === 'string' ? { id: other } : other;
    };

    const currentConv = conversations.find(c => c.id === activeConversationId);
    const otherUser = currentConv ? getOtherParticipant(currentConv) : null;

    const handleReportSubmitFinal = async (reason: string, description: string) => {
        if (!currentUser || !otherUser || !activeConversationId) return;

        try {
            // Capture last 20 messages as snapshot
            const snapshot = messages.slice(-20).map(msg => ({
                id: msg.id,
                senderId: msg.senderId,
                senderName: msg.senderId === currentUser.id ? (currentUser.name || 'You') : (otherUser.name || 'Other'),
                content: msg.content,
                createdAt: msg.createdAt,
            }));

            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    reportedId: otherUser.id,
                    reason,
                    description,
                    conversationId: activeConversationId,
                    snapshot,
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Report submitted successfully');
                setIsReportModalOpen(false);
            } else {
                const errMsg = typeof data.error === 'string' ? data.error : Array.isArray(data.error) ? data.error.map((e: any) => e.message).join(', ') : 'Submission failed';
                toast.error(errMsg);
            }
        } catch (e) {
            toast.error('Error submitting report');
        }
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-[#800000]">Messages</h1>
            </div>

            <div className="flex-grow flex gap-4 overflow-hidden h-full mt-4">
                {/* Sidebar */}
                <div className="w-full md:w-1/3 bg-white border border-gray-200 flex flex-col h-full rounded-lg overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-700">Conversations</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-4 space-y-4">
                                {[1, 2, 3].map(i => <ChatListSkeleton key={i} />)}
                            </div>
                        ) : conversations.length > 0 ? (
                            conversations.map(conv => {
                                const other = getOtherParticipant(conv);
                                const isActive = activeConversationId === conv.id;

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => setActiveConversationId(conv.id)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${isActive ? 'bg-red-50 border-l-4 border-l-[#800000]' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 shrink-0">
                                                <AvatarImage src={other?.profileImage} alt={other?.name} />
                                                <AvatarFallback className="bg-[#800000] text-white font-bold text-sm">
                                                    {other?.name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="overflow-hidden min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {other?.name || (conv.isGroup ? conv.groupName : 'Unknown')}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                                    {conv.isBlocked && <Lock size={12} className="text-red-500" />}
                                                    {conv.isBlocked ? <span className="text-red-500 italic">Chat blocked</span> : conv.lastMessage}
                                                </div>
                                            </div>
                                            <div className="ml-auto flex flex-col items-end gap-1 self-start mt-1">
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                    {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}
                                                </span>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                <EmptyState
                                    icon="💬"
                                    title="No conversations"
                                    description="Start chatting with alumni or students."
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="w-full md:w-2/3 bg-white border border-gray-200 flex flex-col h-full rounded-lg overflow-hidden shadow-sm">
                    {activeConversationId && currentConv ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                                <div className="font-semibold text-[#800000] flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={otherUser?.profileImage} />
                                        <AvatarFallback className="bg-[#800000] text-white font-bold">
                                            {otherUser?.name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div>{otherUser?.name || (currentConv.isGroup ? currentConv.groupName : 'Chat')}</div>
                                        {otherUser && (
                                            <div className="text-xs text-gray-500 font-normal">
                                                {otherUser.role ? otherUser.role.charAt(0).toUpperCase() + otherUser.role.slice(1) : ''}
                                                {otherUser.department ? ` • ${otherUser.department}` : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {otherUser && (
                                            <DropdownMenuItem onClick={() => router.push(`/${otherUser.role === 'alumni' ? 'alumni-directory' : 'students'}/${otherUser.id}`)}>
                                                <UserIcon className="mr-2 h-4 w-4" /> View Profile
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => setIsReportModalOpen(true)}>
                                            <Flag className="mr-2 h-4 w-4" /> Report Conversation
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#f9f9f9]">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderId === currentUser?.id;
                                    return (
                                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${isMe ? 'bg-[#800000] text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                                                <div className="break-words leading-relaxed">{msg.content}</div>
                                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'opacity-70' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Blocking Banner & Input Area */}
                            {currentConv.isBlocked ? (
                                <div className="p-4 bg-red-50 border-t border-red-200 text-red-800 flex flex-col items-center justify-center text-center space-y-2 shrink-0">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <AlertTriangle className="h-5 w-5" />
                                        <span>Chat Blocked</span>
                                    </div>
                                    <p className="text-sm opacity-90">
                                        This conversation has been blocked. You cannot send messages.
                                    </p>
                                    {currentConv.blockedReason && (
                                        <div className="text-xs bg-red-100 px-2 py-1 rounded inline-block">
                                            Reason: {currentConv.blockedReason}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 border-t border-gray-200 bg-white shrink-0">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-grow border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000] bg-gray-50"
                                        />
                                        <button type="submit" disabled={!newMessage.trim() || isSending} className="bg-[#800000] text-white px-4 py-3 rounded-full hover:bg-[#660000] disabled:opacity-50 transition-colors">
                                            <Send size={20} />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50">
                            <EmptyState icon="💬" title="No chat selected" description="Select a conversation to start messaging." />
                        </div>
                    )}
                </div>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReportSubmitFinal}
                reportedUser={otherUser}
            />
        </div>
    );
}
