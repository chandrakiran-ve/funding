export type User = {
  id: string; // Clerk user ID
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'regional_manager' | 'pending';
  status: 'approved' | 'pending' | 'rejected';
  assignedStates?: string[]; // Array of state codes for regional managers
  requestedAt: string; // ISO date string
  approvedAt?: string; // ISO date string
  approvedBy?: string; // Admin user ID who approved
};

export type StateInfo = {
  code: string;
  name: string;
  coordinator?: string;
};
