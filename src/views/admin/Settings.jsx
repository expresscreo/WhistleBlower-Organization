import React, { useState, useEffect, useRef } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldError, FieldSuccess, PageErrorBanner } from '@/components/ui/form-feedback';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/customSupabaseClient';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { useLoadOnce } from '@/hooks/useLoadOnce';

const ProfileSettings = () => {
    const [profileFeedback, setProfileFeedback] = useState({ error: '', success: '' });
    const [passwordFeedback, setPasswordFeedback] = useState({ error: '', success: '' });
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(user) {
            setName(user.user_metadata.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleProfileUpdate = async () => {
        setProfileFeedback({ error: '', success: '' });
        setLoading(true);
        // Update name in users table
        const { error: nameError } = await supabase
            .from('users')
            .update({ name: name })
            .eq('id', user.id);
        
        if (nameError) {
            setProfileFeedback({ error: nameError.message, success: '' });
            setLoading(false);
            return;
        }

        // Update email in auth
        if(email !== user.email) {
            const { error: emailError } = await supabase.auth.updateUser({ email });
            if(emailError) {
                 setProfileFeedback({ error: emailError.message, success: '' });
                 setLoading(false);
                 return;
            }
        }
        setProfileFeedback({ error: '', success: 'Profile updated successfully!' });
        setLoading(false);
    };

    const handlePasswordUpdate = async () => {
        if(password !== confirmPassword || password.length < 6) {
            setPasswordFeedback({ error: 'Passwords must match and be at least 6 characters.', success: '' });
            return;
        }
        setPasswordFeedback({ error: '', success: '' });
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        if(error) {
            setPasswordFeedback({ error: error.message, success: '' });
        } else {
            setPasswordFeedback({ error: '', success: 'Password updated successfully!' });
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8 [&_*]:!transition-none [&_*]:!animate-none">
            <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} className="!transition-none" /></div>
                    <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled className="!transition-none"/></div>
                    <Button onClick={handleProfileUpdate} loading={loading} className="!transition-none">Update Profile</Button>
                    <FieldError message={profileFeedback.error} />
                    <FieldSuccess message={profileFeedback.success} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="new-password">New Password</Label><Input id="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="!transition-none" /></div>
                    <div className="space-y-2"><Label htmlFor="confirm-password">Confirm New Password</Label><Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="!transition-none" /></div>
                    <Button onClick={handlePasswordUpdate} loading={loading} className="!transition-none">Update Password</Button>
                    <FieldError message={passwordFeedback.error} />
                    <FieldSuccess message={passwordFeedback.success} />
                </CardContent>
            </Card>
        </div>
    );
};


const Settings = () => {
  const [settingsFetchError, setSettingsFetchError] = useState('');
  const [settingsSaveFeedback, setSettingsSaveFeedback] = useState({ error: '', success: '' });
  const { profile, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const settingsLoadedRef = useRef(false);
  const [appSettings, setAppSettings] = useState({
    maintenance_mode: false,
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
    notification_new_report: true,
    notification_status_update: true,
    notification_new_message: true,
  });

  useLoadOnce(profile?.user_type === 'super_admin', async () => {
    if (settingsLoadedRef.current) return;

    setLoading(true);
    setSettingsFetchError('');
    const { data, error } = await supabase.from('app_settings').select('*').limit(1).single();
    if (data) {
      setAppSettings(prev => ({...prev, ...data}));
    } else if (error && error.code === 'PGRST116') {
      // No settings found, use defaults
    } else if (error) {
      setSettingsFetchError(error.message);
    }
    setLoading(false);
    settingsLoadedRef.current = true;
  });

  useEffect(() => {
    if (profile && profile.user_type !== 'super_admin') {
      setLoading(false);
    }
  }, [profile?.user_type]);
  
  const handleSettingChange = (key, value) => {
    setAppSettings(prev => ({...prev, [key]: value}));
  };

  const handleSaveSettings = async () => {
    setSettingsSaveFeedback({ error: '', success: '' });
    setSaving(true);
    const { id, interswitch_pk: _interswitchPk, interswitch_sk: _interswitchSk, ...saveData } =
      appSettings;
    const { error } = await supabase.from('app_settings').upsert({ id: id || 1, ...saveData });
    if (error) {
      setSettingsSaveFeedback({ error: error.message, success: '' });
    } else {
      setSettingsSaveFeedback({ error: '', success: 'Settings saved successfully!' });
    }
    setSaving(false);
  };

  const isSuperAdmin = profile?.user_type === 'super_admin';

  if(loading || profileLoading) {
    return (
      <>
        <PageHead title="Loading Settings — WhistleBlower.ng" />
        <NavbarLoader />
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Settings</h1>
            {/* Placeholder for save button to prevent layout shift */}
            <div className="w-32 h-10"></div>
          </div>
          
          {/* Placeholder tabs structure to prevent layout shift */}
          <div className="space-y-4">
            <div className="h-10 bg-muted/20 rounded w-full sm:w-auto"></div>
            <div className="h-96 bg-muted/20 rounded"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title="Settings — WhistleBlower.ng" />
      <div className="space-y-8 [&_*]:!transition-none [&_*]:!animate-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold">Settings</h1>
            {isSuperAdmin && <Button onClick={handleSaveSettings} loading={saving} className="!transition-none w-full sm:w-auto">Save All Settings</Button>}
        </div>

        <PageErrorBanner error={settingsFetchError} title="Could not load settings" />
        <FieldError message={settingsSaveFeedback.error} />
        <FieldSuccess message={settingsSaveFeedback.success} />
        
        <Tabs defaultValue="profile" className="[&_*]:!transition-none">
          <div className="overflow-x-auto">
            <TabsList className="!transition-none w-full sm:w-auto flex-nowrap">
              <TabsTrigger value="profile" className="!transition-none whitespace-nowrap">Profile</TabsTrigger>
              {isSuperAdmin && <TabsTrigger value="general" className="!transition-none whitespace-nowrap">General</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="email" className="!transition-none whitespace-nowrap">Email (Resend)</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="payments" className="!transition-none whitespace-nowrap">Payments</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="notifications" className="!transition-none whitespace-nowrap">Notifications</TabsTrigger>}
            </TabsList>
          </div>
          
          <TabsContent value="profile" className="mt-4">
             <ProfileSettings />
          </TabsContent>

          {isSuperAdmin && (
            <>
                <TabsContent value="general" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>Manage general application settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2 border p-4">
                                <Label htmlFor="maintenance-mode" className="flex flex-col space-y-1">
                                    <span>Maintenance Mode</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        Temporarily disable access to the public website.
                                    </span>
                                </Label>
                                <Switch id="maintenance-mode" checked={appSettings.maintenance_mode} onCheckedChange={(val) => handleSettingChange('maintenance_mode', val)} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="email" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Delivery</CardTitle>
                            <CardDescription>
                                Transactional email is sent through Resend using your verified domain.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>
                                Configure <code className="text-foreground">RESEND_API_KEY</code> on the server.
                                Optional overrides: <code className="text-foreground">RESEND_FROM_EMAIL</code> and{' '}
                                <code className="text-foreground">NOTIFICATION_SUPPORT_EMAIL</code>.
                            </p>
                            <div className="border p-4 space-y-2">
                                <p><span className="font-medium text-foreground">Default from:</span> WhistleBlower.ng &lt;noreply@WhistleBlower.ng&gt;</p>
                                <p><span className="font-medium text-foreground">Support inbox:</span> support@whistleblower.ng</p>
                                <p><span className="font-medium text-foreground">Domain:</span> whistleblower.ng (managed in Resend)</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            
                <TabsContent value="payments" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Monnify Paycode</CardTitle>
                        <CardDescription>
                            Reward payouts use Monnify Paycodes redeemable at Moniepoint POS agents.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            Configure Monnify credentials as server environment variables — never store API secrets in the browser or database.
                        </p>
                        <div className="border p-4 space-y-2">
                            <p><span className="font-medium text-foreground">Required:</span> <code className="text-foreground">MONNIFY_API_KEY</code>, <code className="text-foreground">MONNIFY_SECRET_KEY</code></p>
                            <p><span className="font-medium text-foreground">Optional:</span> <code className="text-foreground">MONNIFY_BASE_URL</code> (defaults to <code className="text-foreground">https://sandbox.monnify.com</code>; use <code className="text-foreground">https://api.monnify.com</code> for live)</p>
                            <p>Ensure Paycode (offline payout) is enabled on your Monnify merchant account and the Monnify wallet is funded before issuing rewards.</p>
                        </div>
                    </CardContent>
                </Card>
                </TabsContent>

                <TabsContent value="notifications" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>Manage when and how notifications are sent.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2 border p-4">
                            <Label htmlFor="notif-new-report" className="flex flex-col space-y-1">
                                <span>New Report Submitted</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Receive an email when a new report is submitted.
                                </span>
                            </Label>
                            <Switch id="notif-new-report" checked={appSettings.notification_new_report} onCheckedChange={(val) => handleSettingChange('notification_new_report', val)} />
                        </div>
                        <div className="flex items-center justify-between space-x-2 border p-4">
                            <Label htmlFor="notif-status-update" className="flex flex-col space-y-1">
                                <span>Report Status Updated</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Notify reporter when their report status changes.
                                </span>
                            </Label>
                            <Switch id="notif-status-update" checked={appSettings.notification_status_update} onCheckedChange={(val) => handleSettingChange('notification_status_update', val)} />
                        </div>
                        <div className="flex items-center justify-between space-x-2 border p-4">
                            <Label htmlFor="notif-new-message" className="flex flex-col space-y-1">
                                <span>New Message in Chat</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Notify reporter when they receive a new message from an admin.
                                </span>
                            </Label>
                            <Switch id="notif-new-message" checked={appSettings.notification_new_message} onCheckedChange={(val) => handleSettingChange('notification_new_message', val)} />
                        </div>
                    </CardContent>
                </Card>
                </TabsContent>
            </>
          )}

        </Tabs>
      </div>
    </>
  );
};

export default Settings;