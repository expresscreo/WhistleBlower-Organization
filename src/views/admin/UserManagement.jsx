import React, { useState, useCallback } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { FieldError, FieldSuccess, PageErrorBanner, FormFeedback } from '@/components/ui/form-feedback';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Eye, EyeOff, CheckCircle, Ban } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import PageHeader from '@/components/admin/PageHeader';
import { useLoadOnce, useLoadOnDeps } from '@/hooks/useLoadOnce';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', organization_id: '', user_type: 'staff' });
  const [showPassword, setShowPassword] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [listFeedback, setListFeedback] = useState({ error: '', success: '' });
  const [addFeedback, setAddFeedback] = useState({ error: '', success: '' });
  const [editFeedback, setEditFeedback] = useState({ error: '', success: '' });
  const [deleteFeedback, setDeleteFeedback] = useState({ error: '', success: '' });
  const { profile, loading: profileLoading, permissions } = useAuth();
  const profileId = profile?.id;
  const profileUserType = profile?.user_type;
  const profileOrganizationId = profile?.organization_id;
  
  const isSuperAdmin = !profileLoading && profileUserType === 'super_admin';
  const isExecutiveAdmin = !profileLoading && profileUserType === 'executive_admin';
  const canManageUsers = isSuperAdmin || isExecutiveAdmin || (!profileLoading && (permissions['User Management']));

  const userTypes = ['super_admin', 'executive_admin', 'organization_admin', 'staff', 'customer_care'];

  const fetchUsers = useCallback(async () => {
    if (profileLoading || !profileId) return;

    setLoading(true);
    setFetchError('');
    let query = supabase
      .from('users')
      .select('*, organizations(name, plans(id, name)), assigned_reports:report_assignments!assigned_to(count)');
      
    if (profileUserType === 'organization_admin' || profileUserType === 'executive_admin') {
      query = query.eq('organization_id', profileOrganizationId);
    }

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      setFetchError(error.message);
      setUsers([]);
    } else {
      const usersWithCounts = data.map(user => ({
        ...user,
        assigned_reports_count: user.assigned_reports[0]?.count || 0,
        plan_name: user.organizations?.plans?.name,
        organization_name: user.organizations?.name
      }));
      
      let filteredUsers = [...usersWithCounts];
      
      if (selectedOrganization !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.organization_name === selectedOrganization);
      }
      
      if (selectedPlan !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.plan_name === selectedPlan);
      }
      
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'active') {
          filteredUsers = filteredUsers.filter(user => user.is_active === true);
        } else if (selectedStatus === 'suspended') {
          filteredUsers = filteredUsers.filter(user => user.is_active === false);
        }
      }
      
      filteredUsers.sort((a, b) => a.name.localeCompare(b.name));
      
      setUsers(filteredUsers);
    }
    setLoading(false);
  }, [
    searchTerm,
    selectedOrganization,
    selectedPlan,
    selectedStatus,
    profileId,
    profileUserType,
    profileOrganizationId,
    profileLoading,
  ]);

  const { reload: reloadUsers } = useLoadOnDeps(
    !profileLoading && Boolean(profileId),
    fetchUsers,
    [searchTerm, selectedOrganization, selectedPlan, selectedStatus, profileId]
  );

  const loadDropdownData = useCallback(async () => {
    let orgQuery = supabase.from('organizations').select('id, name, plans(id, name)');
    if (profileUserType === 'organization_admin' || profileUserType === 'executive_admin') {
      orgQuery = orgQuery.eq('id', profileOrganizationId);
    }
    const { data: orgsData } = await orgQuery;
    setOrganizations(orgsData || []);

    const { data: plansData } = await supabase.from('plans').select('id, name');
    setPlans(plansData || []);
  }, [profileUserType, profileOrganizationId]);

  useLoadOnce(!profileLoading && Boolean(profileId), loadDropdownData);

  const handleOpenAddModal = () => {
    setAddFeedback({ error: '', success: '' });
    setNewUser({ name: '', email: '', password: '', organization_id: profile?.organization_id || '', user_type: 'staff' });
    setIsAddModalOpen(true);
  };
  
  const handleAddUser = async () => {
    setAddFeedback({ error: '', success: '' });
    if(!newUser.email || !newUser.password || !newUser.name || !newUser.user_type || !newUser.organization_id){
        setAddFeedback({ error: 'Please fill out all required fields.', success: '' });
        return;
    }

    setIsAdding(true);
    try {
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
          setAddFeedback({ error: error.message, success: '' });
      } else {
          setAddFeedback({ error: '', success: 'User created successfully. Confirmation email sent.' });
          setIsAddModalOpen(false);
          reloadUsers();
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (user) => {
    setEditFeedback({ error: '', success: '' });
    setSelectedUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleDelete = (user) => {
    setDeleteFeedback({ error: '', success: '' });
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    setDeleteFeedback({ error: '', success: '' });
    setIsDeletingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
          body: { user_id: selectedUser.id },
      });

      if (error || (data && data.error)) {
          setDeleteFeedback({ error: error?.message || data.error, success: '' });
      } else {
          setDeleteFeedback({ error: '', success: 'User deleted successfully' });
          reloadUsers();
      }
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setEditFeedback({ error: '', success: '' });

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

    setIsSaving(true);
    try {
      const { error } = await supabase.from('users').update(userData).eq('id', selectedUser.id);

      if (error) {
        setEditFeedback({ error: error.message, success: '' });
      } else {
        setEditFeedback({ error: '', success: 'User updated successfully' });
        reloadUsers();
      }
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserStatus = async (user) => {
    setListFeedback({ error: '', success: '' });
    const newStatus = !user.is_active;
    const { error } = await supabase.from('users').update({ is_active: newStatus }).eq('id', user.id);
    if (error) {
      setListFeedback({ error: error.message, success: '' });
    } else {
      setListFeedback({ error: '', success: `User ${newStatus ? 'activated' : 'suspended'} successfully` });
      reloadUsers();
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
      <PageHead title="User Management — WhistleBlower.ng" />
      <div className="space-y-8">
        <PageHeader 
          title="User Management"
          description="Manage all platform users and their permissions."
        >
          {canManageUsers && <Button onClick={handleOpenAddModal}><PlusCircle className="mr-2 h-4 w-4" />Add User</Button>}
        </PageHeader>

        <PageErrorBanner error={fetchError} title="Could not load users" />
        <FieldError message={listFeedback.error} />
        <FieldSuccess message={listFeedback.success} />
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input 
            placeholder="Search by name or email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0"
          />
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
            <Select value={selectedOrganization} onValueChange={(value) => {
              console.log('Organization filter changed to:', value);
              setSelectedOrganization(value);
            }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter by Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.name}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPlan} onValueChange={(value) => {
              console.log('Plan filter changed to:', value);
              setSelectedPlan(value);
            }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter by Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(value) => {
              console.log('Status filter changed to:', value);
              setSelectedStatus(value);
            }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Users Table */}
        <Card>
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
                  {loading || profileLoading ? (
                    <>
                      <NavbarLoader />
                      <TableRow><TableCell colSpan="8" className="text-center">
                        {/* Loading indication is handled by NavbarLoader */}
                      </TableCell></TableRow>
                    </>
                  ) :
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
          <FormFeedback error={editFeedback.error} success={editFeedback.success} className="px-6" />
          <DialogFooter><Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</Button><Button onClick={handleSave} loading={isSaving}>Save Changes</Button></DialogFooter>
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
            <FormFeedback error={addFeedback.error} success={addFeedback.success} className="px-6" />
            <DialogFooter><Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isAdding}>Cancel</Button><Button onClick={handleAddUser} loading={isAdding}>Create User</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the user "{selectedUser?.email}".</DialogDescription>
          </DialogHeader>
          <FormFeedback error={deleteFeedback.error} success={deleteFeedback.success} className="px-6" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} loading={isDeletingUser}>Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagement;