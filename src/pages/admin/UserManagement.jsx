import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, MoreHorizontal, Edit, Trash2, Eye, EyeOff, CheckCircle, Ban } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', organization_id: '', user_type: 'staff' });
  const [showPassword, setShowPassword] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const { toast } = useToast();
  const { profile, loading: profileLoading, permissions } = useAuth();
  
  const isSuperAdmin = !profileLoading && profile?.user_type === 'super_admin';
  const isExecutiveAdmin = !profileLoading && profile?.user_type === 'executive_admin';
  const canManageUsers = isSuperAdmin || isExecutiveAdmin || (!profileLoading && (permissions['User Management']));

  const userTypes = ['super_admin', 'executive_admin', 'organization_admin', 'staff', 'customer_care'];

  const fetchUsers = useCallback(async () => {
    if (profileLoading) return;
    setLoading(true);
    let query = supabase
      .from('users')
      .select('*, organizations(name, plans(id, name)), assigned_reports:report_assignments!assigned_to(count)');
      
    if (profile?.user_type === 'organization_admin' || profile?.user_type === 'executive_admin') {
      query = query.eq('organization_id', profile.organization_id);
    }

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching users', description: error.message });
      setUsers([]);
    } else {
      const usersWithCounts = data.map(user => ({
        ...user,
        assigned_reports_count: user.assigned_reports[0]?.count || 0,
        plan_name: user.organizations?.plans?.name
      }));
      setUsers(usersWithCounts);
    }
    setLoading(false);
  }, [searchTerm, toast, profile, profileLoading]);

  useEffect(() => {
    if (!profileLoading) {
        fetchUsers();
    }
    const fetchDropdownData = async () => {
      let orgQuery = supabase.from('organizations').select('id, name, plans(id, name)');
      if (profile?.user_type === 'organization_admin' || profile?.user_type === 'executive_admin') {
          orgQuery = orgQuery.eq('id', profile.organization_id);
      }
      const { data: orgsData } = await orgQuery;
      setOrganizations(orgsData || []);
    };

    if (!profileLoading) {
      fetchDropdownData();
    }
  }, [fetchUsers, profileLoading, profile]);

  const handleOpenAddModal = () => {
    setNewUser({ name: '', email: '', password: '', organization_id: profile?.organization_id || '', user_type: 'staff' });
    setIsAddModalOpen(true);
  };
  
  const handleAddUser = async () => {
    if(!newUser.email || !newUser.password || !newUser.name || !newUser.user_type || !newUser.organization_id){
        toast({variant: 'destructive', title: 'Missing fields', description: 'Please fill out all required fields.'});
        return;
    }
    
    const { error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
            data: {
                name: newUser.name,
                organization_id: newUser.organization_id,
                user_type: newUser.user_type,
            }
        }
    });

    if (error) {
        toast({variant: 'destructive', title: 'Failed to add user', description: error.message});
    } else {
        toast({title: 'User created successfully', description: 'Confirmation email sent.'});
        setIsAddModalOpen(false);
        fetchUsers();
    }
  };

  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: selectedUser.id },
    });
    
    if (error || (data && data.error)) {
        toast({ variant: 'destructive', title: 'Error deleting user', description: error?.message || data.error });
    } else {
        toast({ title: 'User deleted successfully' });
        fetchUsers();
    }
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    const selectedOrg = organizations.find(o => o.id === selectedUser.organization_id);
    const newPlanId = selectedOrg?.plans?.id;

    const userData = {
      name: selectedUser.name,
      email: selectedUser.email,
      organization_id: selectedUser.organization_id,
      plan_id: newPlanId, 
      is_active: selectedUser.is_active,
      user_type: selectedUser.user_type,
    };

    const { error } = await supabase.from('users').update(userData).eq('id', selectedUser.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error saving user', description: error.message });
    } else {
      toast({ title: 'User updated successfully' });
      fetchUsers();
    }
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const toggleUserStatus = async (user) => {
    const newStatus = !user.is_active;
    const { error } = await supabase.from('users').update({ is_active: newStatus }).eq('id', user.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error updating user status', description: error.message });
    } else {
      toast({ title: `User ${newStatus ? 'activated' : 'suspended'} successfully` });
      fetchUsers();
    }
  };
  
  const getEditableUserTypes = () => {
    if (isSuperAdmin) {
        return userTypes;
    }
    if (isExecutiveAdmin) {
        return ['staff', 'customer_care', 'organization_admin', 'executive_admin'];
    }
    return ['staff', 'customer_care'];
  };

  return (
    <>
      <Helmet><title>User Management - WhistleBlower.ng</title></Helmet>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Management</h1>
          {canManageUsers && <Button onClick={handleOpenAddModal}><PlusCircle className="mr-2 h-4 w-4" />Add User</Button>}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage all platform users and their permissions.</CardDescription>
            <div className="mt-4"><Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>User Type</TableHead>
                    <TableHead>Assigned Reports</TableHead>
                    <TableHead>Status</TableHead>
                    {canManageUsers && <TableHead><span className="sr-only">Actions</span></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading || profileLoading ? <TableRow><TableCell colSpan="8" className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow> :
                  users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.organizations?.name || 'N/A'}</TableCell>
                      <TableCell>{user.plan_name || 'N/A'}</TableCell>
                      <TableCell>{user.user_type ? user.user_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</TableCell>
                      <TableCell className="text-center">{user.assigned_reports_count}</TableCell>
                      <TableCell>
                        <span className={`flex items-center ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {user.is_active ? <CheckCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                          {user.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </TableCell>
                      {canManageUsers && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={!isSuperAdmin && user.id === profile.id && user.user_type === 'executive_admin'}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEdit(user)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleUserStatus(user)}>
                                {user.is_active ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                {user.is_active ? 'Suspend' : 'Activate'}
                              </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive" disabled={!isSuperAdmin}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={selectedUser.name || ''} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={selectedUser.email || ''} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} /></div>
              {(isSuperAdmin || isExecutiveAdmin) && <div className="space-y-2"><Label htmlFor="organization">Organization</Label><Select disabled={!isSuperAdmin} value={selectedUser.organization_id || ''} onValueChange={(value) => setSelectedUser({ ...selectedUser, organization_id: value })}><SelectTrigger><SelectValue placeholder="Select an organization" /></SelectTrigger><SelectContent>{organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}</SelectContent></Select></div>}
              <div className="space-y-2"><Label htmlFor="user_type">User Type</Label><Select value={selectedUser.user_type || ''} onValueChange={(value) => setSelectedUser({ ...selectedUser, user_type: value })}><SelectTrigger><SelectValue placeholder="Select user type" /></SelectTrigger><SelectContent>{getEditableUserTypes().map(type => (<SelectItem key={type} value={type} className="capitalize">{type.replace('_', ' ')}</SelectItem>))}</SelectContent></Select></div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="is_active">Active Status</Label>
                <Select value={selectedUser.is_active ? 'true' : 'false'} onValueChange={(value) => setSelectedUser({ ...selectedUser, is_active: value === 'true' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Add New User</DialogTitle><DialogDescription>Create a new user account and assign their roles.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2"><Label htmlFor="newName">Full Name</Label><Input id="newName" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} /></div>
                <div className="space-y-2"><Label htmlFor="newEmail">Email</Label><Input id="newEmail" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} /></div>
                <div className="relative space-y-2"><Label htmlFor="newPassword">Password</Label><Input id="newPassword" type={showPassword ? 'text' : 'password'} value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div>
                {(isSuperAdmin || isExecutiveAdmin) && <div className="space-y-2"><Label htmlFor="newOrganization">Organization</Label><Select disabled={!isSuperAdmin} value={newUser.organization_id} onValueChange={(value) => setNewUser({...newUser, organization_id: value})}><SelectTrigger><SelectValue placeholder="Select an organization" /></SelectTrigger><SelectContent>{organizations.map(org => (<SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>))}</SelectContent></Select></div>}
                <div className="space-y-2"><Label htmlFor="newUserType">User Type</Label><Select value={newUser.user_type} onValueChange={(value) => setNewUser({...newUser, user_type: value})}><SelectTrigger><SelectValue placeholder="Select user type" /></SelectTrigger><SelectContent>{getEditableUserTypes().map(type => (<SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, ' ')}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={handleAddUser}>Create User</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the user "{selectedUser?.email}".</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagement;