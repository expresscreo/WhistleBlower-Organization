import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';

const ProfileSettings = () => {
    const { toast } = useToast();
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
        setLoading(true);
        // Update name in users table
        const { error: nameError } = await supabase
            .from('users')
            .update({ name: name })
            .eq('id', user.id);
        
        if (nameError) {
            toast({ variant: 'destructive', title: 'Error updating name', description: nameError.message });
            setLoading(false);
            return;
        }

        // Update email in auth
        if(email !== user.email) {
            const { error: emailError } = await supabase.auth.updateUser({ email });
            if(emailError) {
                 toast({ variant: 'destructive', title: 'Error updating email', description: emailError.message });
                 setLoading(false);
                 return;
            }
        }
        toast({ title: 'Profile updated successfully!' });
        setLoading(false);
    };

    const handlePasswordUpdate = async () => {
        if(password !== confirmPassword || password.length < 6) {
            toast({ variant: 'destructive', title: 'Password Error', description: 'Passwords must match and be at least 6 characters.' });
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        if(error) {
            toast({ variant: 'destructive', title: 'Error updating password', description: error.message });
        } else {
            toast({ title: 'Password updated successfully!' });
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
                    <Button onClick={handleProfileUpdate} disabled={loading} className="!transition-none">{loading ? <Loader2 className="mr-2 h-4 w-4"/> : null} Update Profile</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="new-password">New Password</Label><Input id="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="!transition-none" /></div>
                    <div className="space-y-2"><Label htmlFor="confirm-password">Confirm New Password</Label><Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="!transition-none" /></div>
                    <Button onClick={handlePasswordUpdate} disabled={loading} className="!transition-none">{loading ? <Loader2 className="mr-2 h-4 w-4"/> : null} Update Password</Button>
                </CardContent>
            </Card>
        </div>
    );
};


const Settings = () => {
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const settingsLoadedRef = useRef(false);
  const [appSettings, setAppSettings] = useState({
    maintenance_mode: false,
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
    interswitch_pk: '',
    interswitch_sk: '',
    notification_new_report: true,
    notification_status_update: true,
    notification_new_message: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      // Prevent refetching if already loaded
      if (settingsLoadedRef.current) return;
      
      setLoading(true);
      const { data, error } = await supabase.from('app_settings').select('*').limit(1).single();
      if (data) {
        setAppSettings(prev => ({...prev, ...data}));
      } else if (error && error.code === 'PGRST116') {
        // No settings found, use defaults
      } else if (error) {
        toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
      }
      setLoading(false);
      settingsLoadedRef.current = true;
    };
    
    if(profile?.user_type === 'super_admin'){
        fetchSettings();
    } else {
        setLoading(false);
    }
  }, [toast, profile?.user_type]); // Only depend on user_type, not the entire profile object
  
  const handleSettingChange = (key, value) => {
    setAppSettings(prev => ({...prev, [key]: value}));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    const { id, ...saveData } = appSettings;
    const { error } = await supabase.from('app_settings').upsert({ id: id || 1, ...saveData });
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to save settings', description: error.message });
    } else {
      toast({ title: 'Settings saved successfully!' });
    }
    setLoading(false);
  };

  const isSuperAdmin = profile?.user_type === 'super_admin';

  if(loading || profileLoading) {
    return (
      <>
        <Helmet><title>Loading Settings - WhistleBlower.ng</title></Helmet>
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
      <Helmet>
        <title>Settings - WhistleBlower.ng</title>
      </Helmet>
      <div className="space-y-8 [&_*]:!transition-none [&_*]:!animate-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold">Settings</h1>
            {isSuperAdmin && <Button onClick={handleSaveSettings} disabled={loading} className="!transition-none w-full sm:w-auto">{loading ? <Loader2 className="mr-2 h-4 w-4" /> : null}Save All Settings</Button>}
        </div>
        
        <Tabs defaultValue="profile" className="[&_*]:!transition-none">
          <div className="overflow-x-auto">
            <TabsList className="!transition-none w-full sm:w-auto flex-nowrap">
              <TabsTrigger value="profile" className="!transition-none whitespace-nowrap">Profile</TabsTrigger>
              {isSuperAdmin && <TabsTrigger value="general" className="!transition-none whitespace-nowrap">General</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="email" className="!transition-none whitespace-nowrap">Email (SMTP)</TabsTrigger>}
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
                            <CardTitle>SMTP Settings</CardTitle>
                            <CardDescription>Configure email sending service. Settings are securely stored.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="smtp-host">Host</Label><Input id="smtp-host" value={appSettings.smtp_host || ''} onChange={e => handleSettingChange('smtp_host', e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="smtp-port">Port</Label><Input id="smtp-port" type="number" value={appSettings.smtp_port || ''} onChange={e => handleSettingChange('smtp_port', e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="smtp-user">Username</Label><Input id="smtp-user" value={appSettings.smtp_user || ''} onChange={e => handleSettingChange('smtp_user', e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="smtp-pass">Password</Label><Input id="smtp-pass" type="password" value={appSettings.smtp_pass || ''} onChange={e => handleSettingChange('smtp_pass', e.target.value)} /></div>
                        </CardContent>
                    </Card>
                </TabsContent>
            
                <TabsContent value="payments" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Interswitch API Keys</CardTitle>
                        <CardDescription>Manage keys for reward payments. Keys are securely stored.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="isw-pk">Public Key</Label><Input id="isw-pk" value={appSettings.interswitch_pk || ''} onChange={e => handleSettingChange('interswitch_pk', e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="isw-sk">Secret Key</Label><Input id="isw-sk" type="password" value={appSettings.interswitch_sk || ''} onChange={e => handleSettingChange('interswitch_sk', e.target.value)} /></div>
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