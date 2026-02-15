'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Student } from '@/types';
import { useAuth } from '@/hooks/useAuth'; // Use real auth
import { toast } from 'sonner';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/Skeleton"
import { Bell, Shield, User, Lock, Trash2 } from 'lucide-react';

export default function StudentSettingsPage() {
    const router = useRouter();
    const { user, mutate } = useAuth();

    // Default Settings
    const defaultSettings = {
        emailAlerts: true,
        jobPostings: true,
        eventReminders: true,
        profileVisibility: true,
    };

    const [settings, setSettings] = useState(defaultSettings);

    // Password Change State
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user?.settings) {
            // Merge defaults with user settings to handle missing keys
            setSettings(prev => ({ ...prev, ...(user.settings as any) }));
        }
    }, [user]);

    const handleToggle = async (key: keyof typeof settings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings); // Optimistic update

        try {
            const res = await fetch('/api/profile/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: newSettings })
            });

            if (!res.ok) throw new Error('Failed to save settings');
            toast.success("Settings updated");
            mutate();
        } catch (error) {
            console.error(error);
            setSettings(settings); // Revert
            toast.error("Failed to save settings");
        }
    };

    const handleChangePasswordClick = () => {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordError('');
        setIsPasswordDialogOpen(true);
    };

    const handleChangePasswordSubmit = async () => {
        setPasswordError('');

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordError('All fields are essential.');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters.');
            return;
        }

        try {
            setIsSaving(true);
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setPasswordError(data.error || 'Failed to change password');
                return;
            }

            toast.success("Password changed successfully!");
            setIsPasswordDialogOpen(false);
        } catch (error) {
            setPasswordError('Something went wrong. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            // Implement delete API later
            toast.error("Please contact admin to delete your account.");
        }
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="space-y-6">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-[200px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
            </div>
        );
    }

    // Role check - redirect if not student? 
    // useAuth handles fetching, but we should ensure role match or generic page.
    // For now assuming middleware or parent layout handles role, or just render.

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-[#800000] mb-2">Settings</h1>
            <p className="text-gray-500 mb-8">Manage your account preferences and privacy settings.</p>

            <div className="space-y-8">
                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="text-[#800000]" size={20} />
                            <CardTitle>Profile Details</CardTitle>
                        </div>
                        <CardDescription>Update your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Input value={(user as any).department || 'N/A'} disabled />
                            <p className="text-xs text-gray-500">Contact admin to change department.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user.email} disabled />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="text-[#800000]" size={20} />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>Control what emails and alerts you receive.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Email Alerts</Label>
                                <p className="text-sm text-gray-500">Receive daily summaries of activity.</p>
                            </div>
                            <Switch
                                checked={settings.emailAlerts}
                                onCheckedChange={() => handleToggle('emailAlerts')}
                            />
                        </div>
                        <hr className="border-gray-100" />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">New Job Postings</Label>
                                <p className="text-sm text-gray-500">Get notified when new jobs match your profile.</p>
                            </div>
                            <Switch
                                checked={settings.jobPostings}
                                onCheckedChange={() => handleToggle('jobPostings')}
                            />
                        </div>
                        <hr className="border-gray-100" />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Event Reminders</Label>
                                <p className="text-sm text-gray-500">Receive reminders for upcoming events you've registered for.</p>
                            </div>
                            <Switch
                                checked={settings.eventReminders}
                                onCheckedChange={() => handleToggle('eventReminders')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="text-[#800000]" size={20} />
                            <CardTitle>Privacy</CardTitle>
                        </div>
                        <CardDescription>Manage who can see your profile information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Profile Visibility</Label>
                                <p className="text-sm text-gray-500">Allow alumni and other students to view your profile in the directory.</p>
                            </div>
                            <Switch
                                checked={settings.profileVisibility}
                                onCheckedChange={() => handleToggle('profileVisibility')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Account Section */}
                <Card className="border-red-100">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="text-[#800000]" size={20} />
                            <CardTitle>Account</CardTitle>
                        </div>
                        <CardDescription>Update your password or delete your account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Change Password</Label>
                                <p className="text-sm text-gray-500">Update your password regularly to keep your account secure.</p>
                            </div>
                            <Button variant="outline" onClick={handleChangePasswordClick} className="flex gap-2">
                                <Lock size={16} /> Change Password
                            </Button>
                        </div>
                        <hr className="border-gray-100" />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-red-600">Delete Account</Label>
                                <p className="text-sm text-red-400">Permanently remove your account and all data.</p>
                            </div>
                            <Button variant="destructive" onClick={handleDeleteAccount} className="flex gap-2 bg-red-600 hover:bg-red-700">
                                <Trash2 size={16} /> Delete Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Dialog */}
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                                Enter your current password and a new password to update your account.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {passwordError && (
                                <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">
                                    {passwordError}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="current">Current Password</Label>
                                <Input
                                    id="current"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new">New Password</Label>
                                <Input
                                    id="new"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm">Confirm New Password</Label>
                                <Input
                                    id="confirm"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                            <Button onClick={handleChangePasswordSubmit} className="bg-[#800000] hover:bg-[#660000]" disabled={isSaving}>
                                {isSaving ? 'Updating...' : 'Update Password'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
