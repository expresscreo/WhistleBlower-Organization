import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building, PlusCircle, MoreHorizontal, Edit, Trash2, Ban, CheckCircle, Users, FileText, Calendar } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CompaniesManagement = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [plans, setPlans] = useState([]);
  const { toast } = useToast();

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('organizations').select('*, plans(name)');
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }
    const { data, error } = await query;
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching organizations', description: error.message });
    } else {
      setOrganizations(data);
    }
    setLoading(false);
  }, [searchTerm, toast]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase.from('plans').select('id, name');
      if (!error) setPlans(data);
    };
    fetchPlans();
  }, []);

  const handleAdd = () => {
    setSelectedOrg({ name: '', plan_id: '', status: 'active' });
    setIsModalOpen(true);
  };

  const handleEdit = (org) => {
    setSelectedOrg(org);
    setIsModalOpen(true);
  };

  const handleDelete = (org) => {
    setSelectedOrg(org);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const { error } = await supabase.from('organizations').delete().eq('id', selectedOrg.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting organization', description: error.message });
    } else {
      toast({ title: 'Organization deleted successfully' });
      fetchOrganizations();
    }
    setIsDeleteModalOpen(false);
    setSelectedOrg(null);
  };

  const handleSave = async () => {
    const orgData = {
      name: selectedOrg.name,
      plan_id: selectedOrg.plan_id,
      status: selectedOrg.status,
    };

    let error;
    if (selectedOrg.id) {
      ({ error } = await supabase.from('organizations').update(orgData).eq('id', selectedOrg.id));
    } else {
      ({ error } = await supabase.from('organizations').insert(orgData));
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Error saving organization', description: error.message });
    } else {
      toast({ title: `Organization ${selectedOrg.id ? 'updated' : 'added'} successfully` });
      fetchOrganizations();
    }
    setIsModalOpen(false);
    setSelectedOrg(null);
  };

  return (
    <>
      <Helmet><title>Organizations Management - WhistleBlower.ng</title></Helmet>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Organizations Management</h1>
          <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Add Organization</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Organizations</CardTitle>
            <CardDescription>Manage partner organizations and their details.</CardDescription>
            <div className="mt-4"><Input placeholder="Search organizations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? <p>Loading...</p> : organizations.map(org => (
                <Card key={org.id}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5" />{org.name}</CardTitle>
                      <CardDescription>{org.plans?.name || 'No Plan'} Plan</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(org)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(org)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center">
                      {org.status === 'active' ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Ban className="mr-2 h-4 w-4 text-red-500" />}
                      Status: <span className="font-semibold ml-1 capitalize">{org.status}</span>
                    </div>
                    <div className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground" />Staff: <span className="font-semibold ml-1">5</span></div>
                    <div className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground" />Reports: <span className="font-semibold ml-1">25</span></div>
                    <div className="flex items-center"><Calendar className="mr-2 h-4 w-4 text-muted-foreground" />Created: <span className="font-semibold ml-1">{new Date(org.created_at).toLocaleDateString()}</span></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedOrg?.id ? 'Edit' : 'Add'} Organization</DialogTitle>
            <DialogDescription>Fill in the details for the organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" value={selectedOrg?.name || ''} onChange={(e) => setSelectedOrg({ ...selectedOrg, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select value={selectedOrg?.plan_id || ''} onValueChange={(value) => setSelectedOrg({ ...selectedOrg, plan_id: value })}>
                <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                <SelectContent>{plans.map(plan => <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedOrg?.status || 'active'} onValueChange={(value) => setSelectedOrg({ ...selectedOrg, status: value })}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the organization "{selectedOrg?.name}".</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompaniesManagement;