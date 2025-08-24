'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Shield, 
  MapPin,
  Calendar,
  Mail,
  MoreHorizontal
} from "lucide-react";
import { User } from "@/types/user";

interface UserManagementProps {
  initialUsers?: User[];
}

export function UserManagement({ initialUsers = [] }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [states, setStates] = useState<{code: string, name: string}[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Initialize with provided users and fetch states on mount
  useEffect(() => {
    if (initialUsers.length > 0) {
      setUsers(initialUsers);
    } else {
      fetchUsers();
    }
    fetchStates();
  }, [initialUsers]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      toast.error('Error fetching users');
    }
  };

  const fetchStates = async () => {
    try {
      console.log('🔄 Fetching states...');
      const response = await fetch('/api/states');
      if (response.ok) {
        const statesData = await response.json();
        console.log('✅ States fetched:', statesData);
        setStates(statesData);
      } else {
        console.error('❌ Failed to fetch states:', response.status, response.statusText);
        // Fallback to default states if API fails
        const fallbackStates = [
          { code: 'MH', name: 'Maharashtra' },
          { code: 'KA', name: 'Karnataka' },
          { code: 'TN', name: 'Tamil Nadu' },
          { code: 'AP', name: 'Andhra Pradesh' },
          { code: 'TG', name: 'Telangana' },
          { code: 'GJ', name: 'Gujarat' },
          { code: 'RJ', name: 'Rajasthan' },
          { code: 'UP', name: 'Uttar Pradesh' }
        ];
        console.log('🔄 Using fallback states:', fallbackStates);
        setStates(fallbackStates);
      }
    } catch (error) {
      console.error('❌ Error fetching states:', error);
      // Fallback to default states if fetch fails
      const fallbackStates = [
        { code: 'MH', name: 'Maharashtra' },
        { code: 'KA', name: 'Karnataka' },
        { code: 'TN', name: 'Tamil Nadu' },
        { code: 'AP', name: 'Andhra Pradesh' },
        { code: 'TG', name: 'Telangana' },
        { code: 'GJ', name: 'Gujarat' },
        { code: 'RJ', name: 'Rajasthan' },
        { code: 'UP', name: 'Uttar Pradesh' }
      ];
      console.log('🔄 Using fallback states after error:', fallbackStates);
      setStates(fallbackStates);
    }
  };

  const handleApproveUser = async (user: User, role: string, assignedStates: string[] = []) => {
    setIsLoading(true);
    try {
      const requestData = {
        targetUserId: user.id,
        role,
        status: 'approved',
        assignedStates: role === 'regional_manager' ? assignedStates : []
      };
      
      console.log('🔄 Approving user with data:', requestData);
      
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        console.log('✅ User approved successfully');
        toast.success(`User approved as ${role === 'admin' ? 'Admin' : 'Regional Manager'}`);
        await fetchUsers();
        setSelectedUser(null);
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to approve user:', response.status, errorData);
        toast.error(`Failed to approve user: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error approving user:', error);
      toast.error('Error approving user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectUser = async (user: User) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: user.id,
          status: 'rejected'
        })
      });

      if (response.ok) {
        toast.success('User request rejected');
        await fetchUsers();
      } else {
        toast.error('Failed to reject user');
      }
    } catch (error) {
      toast.error('Error rejecting user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = () => {
    if (!selectedUser || !selectedRole) return;

    handleApproveUser(selectedUser, selectedRole, selectedStates);
  };

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'regional_manager':
        return <Badge className="bg-blue-100 text-blue-800"><MapPin className="w-3 h-3 mr-1" />Regional Manager</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending Role</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="regional_manager">Regional Manager</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3" />
                      Requested: {new Date(user.requestedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(user.status)}
                      {getRoleBadge(user.role)}
                    </div>
                    {user.assignedStates && user.assignedStates.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        States: {user.assignedStates.join(', ')}
                      </div>
                    )}
                  </div>
                  
                  {user.status === 'pending' && (
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedRole("");
                              setSelectedStates([]);
                            }}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve User Access</DialogTitle>
                            <DialogDescription>
                              Assign a role and permissions to {user.firstName} {user.lastName} ({user.email})
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label>Role</Label>
                              <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin - Full access</SelectItem>
                                  <SelectItem value="regional_manager">Regional Manager - State-specific access</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedRole === 'regional_manager' && (
                              <div>
                                <Label>Assigned States</Label>
                                <div className="text-xs text-muted-foreground mb-2">
                                  {states.length} states available
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                                  {states.length === 0 ? (
                                    <div className="col-span-2 text-center text-sm text-muted-foreground py-4">
                                      Loading states...
                                    </div>
                                  ) : (
                                    states.map((state) => (
                                    <div key={state.code} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={state.code}
                                        checked={selectedStates.includes(state.code)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedStates([...selectedStates, state.code]);
                                          } else {
                                            setSelectedStates(selectedStates.filter(s => s !== state.code));
                                          }
                                        }}
                                      />
                                      <Label htmlFor={state.code} className="text-sm">
                                        {state.name} ({state.code})
                                      </Label>
                                    </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedUser(null)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleApproval}
                              disabled={!selectedRole || (selectedRole === 'regional_manager' && selectedStates.length === 0)}
                            >
                              Approve User
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectUser(user)}
                        disabled={isLoading}
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching the current filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
