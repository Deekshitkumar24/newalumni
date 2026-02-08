'use client';

import { useState } from 'react';
import { createMentorshipRequest } from '@/lib/data/store';
import { Alumni, User } from '@/types';

interface MentorshipRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: User;
    alumni: Alumni;
}

export default function MentorshipRequestModal({ isOpen, onClose, student, alumni }: MentorshipRequestModalProps) {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (message.length < 20) {
            setError('Please write a slightly longer message (at least 20 characters) to explain why you want to connect.');
            setLoading(false);
            return;
        }

        try {
            // Simulate network delay
            setTimeout(() => {
                createMentorshipRequest(student.id, alumni.id, message);
                setSuccess(true);
                setLoading(false);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setMessage('');
                }, 2000);
            }, 800);
        } catch (err) {
            setError('Failed to send request. Please try again later.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="bg-[#800000] p-6 text-white text-center">
                    <h3 className="text-xl font-bold mb-1">Request Mentorship</h3>
                    <p className="text-sm opacity-90">Connect with {alumni.name}</p>
                </div>

                {/* Body */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                                ✓
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Request Sent!</h4>
                            <p className="text-gray-600">
                                {alumni.name} has received your request. You will be notified once they accept it.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                                    <div className="w-10 h-10 bg-[#800000] text-white rounded-full flex items-center justify-center font-bold">
                                        {alumni.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{alumni.currentRole}</div>
                                        <div className="text-xs text-gray-500">at {alumni.currentCompany}</div>
                                    </div>
                                </div>

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Personalize your message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    placeholder={`Hi ${alumni.name.split(' ')[0]}, I'm a student at VJIT interested in your field. I'd love to ask a few questions about...`}
                                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent text-sm"
                                    required
                                />
                                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                                <p className="text-xs text-gray-500 mt-2">
                                    Be professional and specific. Alumni are more likely to accept requests with clear intent.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#800000] text-white py-2.5 rounded-md font-medium hover:bg-[#660000] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                            >
                                {loading ? 'Sending Request...' : 'Send Mentorship Request'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
