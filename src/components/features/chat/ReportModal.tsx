'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle } from 'lucide-react';
import { User } from '@/types';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, description: string) => Promise<void>;
    reportedUser: Partial<User> | null;
}

export default function ReportModal({ isOpen, onClose, onSubmit, reportedUser }: ReportModalProps) {
    const [reason, setReason] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!reason) {
            setError('Please select a reason for the report.');
            return;
        }
        if (!description.trim()) {
            setError('Please provide a description of the issue.');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            await onSubmit(reason, description);
            // close is handled by parent or success callback usually, but here we expect parent to close
        } catch (err) {
            setError('Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !isSubmitting) {
            onClose();
            // Reset form on close
            setTimeout(() => {
                setReason('');
                setDescription('');
                setError(null);
            }, 300);
        }
    };

    if (!reportedUser) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        Report Conversation
                    </DialogTitle>
                    <DialogDescription>
                        Report <span className="font-semibold text-gray-900">{reportedUser.name}</span> for inappropriate behavior.
                        This conversation will be reviewed by administrators.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Report <span className="text-red-500">*</span></Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="reason">
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Harassment">Harassment</SelectItem>
                                <SelectItem value="Inappropriate Behavior">Inappropriate Behavior</SelectItem>
                                <SelectItem value="Spam">Spam</SelectItem>
                                <SelectItem value="Abuse">Abuse</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="description"
                            placeholder="Please describe the issue..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            A snapshot of the last 20 messages will be included with this report.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-red-700 hover:bg-red-800 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Report'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
