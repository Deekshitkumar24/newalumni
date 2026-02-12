'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alumni } from '@/types';
import { initializeData } from '@/lib/data/store';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/Skeleton"
import { Bell, Shield, User, Lock, Trash2 } from 'lucide-react';

export default function AlumniSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<Alumni | null>(null);
    const [loading, setLoading] = useState(true);

    // Mock Settings State
    const [settings, setSettings] = useState({
        emailAlerts: true,
        mentorshipRequests: true,
        eventReminders: true,
        profileVisibility: true,
    });

    // Password Change State
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'alumni') {
            router.push('/login');
            return;
        }

        // Load saved settings if any (mock)
        const savedSettings = localStorage.getItem('vjit_alumni_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }

        setTimeout(() => {
            setUser(currentUser);
            setLoading(false);
        }, 500);
    }, [router]);

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: !prev[key] };
            localStorage.setItem('vjit_alumni_settings', JSON.stringify(newSettings));
            toast.success("Settings updated");
            return newSettings;
        });
    };

    const handleChangePasswordClick = () => {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordError('');
        setIsPasswordDialogOpen(true);
    };

    const handleChangePasswordSubmit = () => {
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

        // Verify current password
        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) return;
        const currentUser = JSON.parse(userStr);

        if (currentUser.password !== passwordForm.currentPassword) {
            setPasswordError('Incorrect current password.');
            return;
        }

        // Update password in current session
        const updatedUser = { ...currentUser, password: passwordForm.newPassword };
        localStorage.setItem('vjit_current_user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Update password in master list (vjit_alumni)
        const alumniStr = localStorage.getItem('vjit_alumni');
        if (alumniStr) {
            const alumniList = JSON.parse(alumniStr);
            const index = alumniList.findIndex((a: Alumni) => a.id === currentUser.id);
            if (index !== -1) {
                alumniList[index].password = passwordForm.newPassword;
                localStorage.setItem('vjit_alumni', JSON.stringify(alumniList));
            }
        }

        toast.success("Password changed successfully!");
        setIsPasswordDialogOpen(false);
    };

    const handleDeleteAccount = () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            toast.error("Account deletion is restricted in this demo.");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="space-y-6">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-[200px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
            </div>
        )
    }

    if (!user) return null;

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
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled
                                value={user?.department || ''}
                            >
                                {['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">Contact admin to change department.</p>
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
                                <Label className="text-base">Mentorship Requests</Label>
                                <p className="text-sm text-gray-500">Get notified when a student sends you a request.</p>
                            </div>
                            <Switch
                                checked={settings.mentorshipRequests}
                                onCheckedChange={() => handleToggle('mentorshipRequests')}
                            />
                        </div>
                        <hr className="border-gray-100" />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Event Reminders</Label>
                                <p className="text-sm text-gray-500">Receive reminders for upcoming events.</p>
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
                                <p className="text-sm text-gray-500">Allow students and other alumni to view your profile in the directory.</p>
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
                            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleChangePasswordSubmit} className="bg-[#800000] hover:bg-[#660000]">Update Password</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
