import { Suspense } from "react";
import { UserManagement } from "@/components/admin/user-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { getUsers } from "@/lib/sheets";

export default async function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user access requests, roles, and permissions
          </p>
        </div>
      </div>

      <Suspense fallback={<UserManagementSkeleton />}>
        <UserManagementStats />
      </Suspense>

      <Suspense fallback={<div>Loading user management...</div>}>
        <UserManagementWrapper />
      </Suspense>
    </div>
  );
}

async function UserManagementWrapper() {
  const users = await getUsers().catch(() => []);
  return <UserManagement initialUsers={users} />;
}

async function UserManagementStats() {
  const users = await getUsers().catch(() => []);
  
  const stats = {
    total: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length,
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.total,
      icon: Users,
      description: "All registered users"
    },
    {
      title: "Pending Approval",
      value: stats.pending,
      icon: Clock,
      description: "Awaiting admin review",
      className: "border-yellow-200 bg-yellow-50"
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: UserCheck,
      description: "Active users",
      className: "border-green-200 bg-green-50"
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: UserX,
      description: "Denied access",
      className: "border-red-200 bg-red-50"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={stat.className || ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserManagementSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-1" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
