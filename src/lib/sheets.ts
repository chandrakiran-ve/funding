import { google } from "googleapis";
import { User } from "@/types/user";

export type Funder = {
  id: string;
  name: string;
  type?: string;
  priority?: string;
  owner?: string;
};

export type Contribution = {
  id: string;
  funderId: string;
  stateCode: string;
  schoolId?: string;
  fiscalYear: string; // e.g., "FY24-25"
  date?: string;
  initiative?: string;
  amount: number;
};

export type StateTarget = {
  stateCode: string;
  fiscalYear: string; // e.g., "FY24-25"
  targetAmount: number;
};

export type Prospect = {
  id: string;
  stateCode: string;
  funderName: string;
  stage: string; // e.g., Lead, Contacted, Proposal, Committed
  estimatedAmount: number;
  probability: number; // 0..1
  nextAction?: string;
  dueDate?: string;
  owner?: string;
  description?: string;
  documents?: string; // JSON string or comma-separated URLs
  tags?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  lastContact?: string;
  notes?: string;
};

export type StateInfo = {
  code: string;
  name: string;
  coordinator?: string;
};

export type School = {
  id: string;
  stateCode: string;
  name: string;
  program?: string;
};

// Re-export User type from types file
export type { User } from "@/types/user";

function optionalSheetsClient() {
  const email =
    process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyRaw =
    process.env.GOOGLE_SHEETS_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const key = keyRaw?.replace(/\\n/g, "\n");
  if (!email || !key) return undefined;
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function readSheetRange(sheetId: string, range: string): Promise<string[][]> {
  const sheets = optionalSheetsClient();
  if (!sheets || !sheetId) return [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });
    return res.data.values ?? [];
  } catch {
    return [];
  }
}

async function appendSheetRows(sheetId: string, range: string, values: string[][]): Promise<void> {
  const sheets = optionalSheetsClient();
  if (!sheets || !sheetId) throw new Error("Google Sheets client not available");

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error(`Error appending to sheet range ${range}:`, error);
    throw error;
  }
}

async function updateSheetRow(sheetId: string, range: string, values: string[][]): Promise<void> {
  const sheets = optionalSheetsClient();
  if (!sheets || !sheetId) throw new Error("Google Sheets client not available");

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error(`Error updating sheet range ${range}:`, error);
    throw error;
  }
}

export async function fetchFunders(sheetId: string): Promise<Funder[]> {
  const rows = await readSheetRange(sheetId, "Funders!A2:E");
  return rows.map((r) => ({
    id: r[0],
    name: r[1],
    type: r[2],
    priority: r[3],
    owner: r[4],
  }));
}

export async function fetchContributions(sheetId: string): Promise<Contribution[]> {
  const rows = await readSheetRange(sheetId, "Contributions!A2:H");
  return rows.map((r) => ({
    id: r[0],
    funderId: r[1],
    stateCode: r[2],
    schoolId: r[3],
    fiscalYear: r[4],
    date: r[5],
    initiative: r[6],
    amount: Number(r[7] || 0),
  }));
}

export async function fetchStateTargets(sheetId: string): Promise<StateTarget[]> {
  const rows = await readSheetRange(sheetId, "StateTargets!A2:C");
  return rows.map((r) => ({
    stateCode: r[0],
    fiscalYear: r[1],
    targetAmount: Number(r[2] || 0),
  }));
}

export async function fetchProspects(sheetId: string): Promise<Prospect[]> {
  const rows = await readSheetRange(sheetId, "Prospects!A2:P"); // Extended to column P for additional fields
  return rows.map((r) => ({
    id: r[0],
    stateCode: r[1],
    funderName: r[2],
    stage: r[3],
    estimatedAmount: Number(r[4] || 0),
    probability: Number(r[5] || 0),
    nextAction: r[6],
    dueDate: r[7],
    owner: r[8],
    description: r[9],
    documents: r[10],
    tags: r[11],
    contactPerson: r[12],
    contactEmail: r[13],
    contactPhone: r[14],
    lastContact: r[15],
    notes: r[16],
  }));
}

export async function fetchStates(sheetId: string): Promise<StateInfo[]> {
  const rows = await readSheetRange(sheetId, "States!A2:C");
  return rows.map((r) => ({
    code: r[0],
    name: r[1],
    coordinator: r[2],
  }));
}

export async function fetchSchools(sheetId: string): Promise<School[]> {
  const rows = await readSheetRange(sheetId, "Schools!A2:D");
  return rows.map((r) => ({
    id: r[0],
    stateCode: r[1],
    name: r[2],
    program: r[3],
  }));
}

// Import cache utilities
import { getCachedData, CACHE_KEYS } from "./cache";

export const getFunders = async (): Promise<Funder[]> => {
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) return [];
  
  return getCachedData(
    CACHE_KEYS.FUNDERS,
    () => fetchFunders(sheetId),
    10 // Cache for 10 minutes
  );
};

export const getContributions = async (): Promise<Contribution[]> => {
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) return [];
  
  return getCachedData(
    CACHE_KEYS.CONTRIBUTIONS,
    () => fetchContributions(sheetId),
    5 // Cache for 5 minutes (more frequently updated)
  );
};

export const getStateTargets = async (): Promise<StateTarget[]> => {
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) return [];
  
  return getCachedData(
    CACHE_KEYS.STATE_TARGETS,
    () => fetchStateTargets(sheetId),
    15 // Cache for 15 minutes (less frequently updated)
  );
};

export const getProspects = async (): Promise<Prospect[]> => {
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) return [];
  
  return getCachedData(
    CACHE_KEYS.PROSPECTS,
    () => fetchProspects(sheetId),
    5 // Cache for 5 minutes
  );
};

export const getStates = async (): Promise<StateInfo[]> => {
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) return [];
  
  return getCachedData(
    CACHE_KEYS.STATES,
    () => fetchStates(sheetId),
    30 // Cache for 30 minutes (rarely changes)
  );
};

export const getSchools = async (): Promise<School[]> => {
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) return [];
  
  return getCachedData(
    CACHE_KEYS.SCHOOLS,
    () => fetchSchools(sheetId),
    20 // Cache for 20 minutes
  );
};

export async function fetchUsers(sheetId: string): Promise<User[]> {
  const rows = await readSheetRange(sheetId, "Users!A2:I");
  return rows.map((r) => ({
    id: r[0],
    email: r[1],
    firstName: r[2],
    lastName: r[3],
    role: r[4] as 'admin' | 'regional_manager' | 'pending',
    status: r[5] as 'approved' | 'pending' | 'rejected',
    assignedStates: r[6] ? r[6].split(',').map((s: string) => s.trim()) : [],
    requestedAt: r[7],
    approvedAt: r[8],
    approvedBy: r[9],
  }));
}

export const getUsers = async (): Promise<User[]> => {
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) return [];
  
  return getCachedData(
    CACHE_KEYS.USERS,
    () => fetchUsers(sheetId),
    2 // Cache for 2 minutes (frequently updated)
  );
};

export async function addUser(sheetId: string, user: Omit<User, 'id'>, userId: string): Promise<void> {
  const values = [
    [
      userId,
      user.email,
      user.firstName || '',
      user.lastName || '',
      user.role,
      user.status,
      user.assignedStates?.join(', ') || '',
      user.requestedAt,
      user.approvedAt || '',
      user.approvedBy || '',
    ]
  ];
  await appendSheetRows(sheetId, "Users!A:J", values);
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.USERS);
}

export async function updateUser(sheetId: string, userId: string, updates: Partial<User>): Promise<void> {
  console.log("🔄 updateUser called with:", { userId, updates });
  
  const users = await fetchUsers(sheetId);
  console.log("📊 Found", users.length, "users in sheet");
  console.log("🔍 Looking for user ID:", userId);
  console.log("👥 Available user IDs:", users.map(u => u.id));
  
  const userIndex = users.findIndex(u => u.id === userId);
  console.log("📍 User index found:", userIndex);
  
  if (userIndex === -1) {
    console.error("❌ User not found with ID:", userId);
    console.log("🔍 Trying to find by email...");
    
    // Try to find by email as fallback
    const userByEmail = users.find(u => u.email && updates.email && u.email === updates.email);
    if (userByEmail) {
      console.log("✅ Found user by email:", userByEmail.email);
      const emailUserIndex = users.findIndex(u => u.email === userByEmail.email);
      if (emailUserIndex !== -1) {
        console.log("📍 Using email-based index:", emailUserIndex);
        return updateUserByIndex(sheetId, users, emailUserIndex, updates);
      }
    }
    
    throw new Error(`User with ID ${userId} not found in sheet`);
  }

  return updateUserByIndex(sheetId, users, userIndex, updates);
}

async function updateUserByIndex(sheetId: string, users: User[], userIndex: number, updates: Partial<User>): Promise<void> {
  const updatedUser = { ...users[userIndex], ...updates };
  console.log("📝 Updated user data:", updatedUser);
  
  const values = [
    updatedUser.id,
    updatedUser.email,
    updatedUser.firstName || '',
    updatedUser.lastName || '',
    updatedUser.role,
    updatedUser.status,
    updatedUser.assignedStates?.join(', ') || '',
    updatedUser.requestedAt,
    updatedUser.approvedAt || '',
    updatedUser.approvedBy || '',
  ];
  console.log("📊 Sheet values to update:", values);

  await updateSheetRow(sheetId, `Users!A${userIndex + 2}:J${userIndex + 2}`, [values]);
  console.log("✅ Sheet row updated successfully");
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.USERS);
  console.log("🔄 Cache invalidated");
}

// CRUD operations for Contributions
export async function addContribution(sheetId: string, contribution: Omit<Contribution, 'id'>): Promise<void> {
  const id = `contrib-${Date.now()}`;
  const values = [
    [
      id,
      contribution.funderId || '',
      contribution.stateCode || '',
      contribution.schoolId || '',
      contribution.fiscalYear || '',
      contribution.date || '',
      contribution.initiative || '',
      String(contribution.amount || 0)
    ]
  ];
  await appendSheetRows(sheetId, "Contributions!A:H", values);
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.CONTRIBUTIONS);
}

export async function updateContribution(sheetId: string, contributionId: string, updates: Partial<Contribution>): Promise<void> {
  const contributions = await fetchContributions(sheetId);
  const contributionIndex = contributions.findIndex(c => c.id === contributionId);
  
  if (contributionIndex === -1) {
    throw new Error(`Contribution with ID ${contributionId} not found`);
  }

  const updatedContribution = { ...contributions[contributionIndex], ...updates };
  const values = [
    updatedContribution.id || '',
    updatedContribution.funderId || '',
    updatedContribution.stateCode || '',
    updatedContribution.schoolId || '',
    updatedContribution.fiscalYear || '',
    updatedContribution.date || '',
    updatedContribution.initiative || '',
    String(updatedContribution.amount || 0)
  ];

  await updateSheetRow(sheetId, `Contributions!A${contributionIndex + 2}:H${contributionIndex + 2}`, [values]);
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.CONTRIBUTIONS);
}

// CRUD operations for StateTargets
export async function addStateTarget(sheetId: string, target: StateTarget): Promise<void> {
  const values = [
    [
      target.stateCode || '',
      target.fiscalYear || '',
      String(target.targetAmount || 0)
    ]
  ];
  await appendSheetRows(sheetId, "StateTargets!A:C", values);
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.STATE_TARGETS);
}

export async function updateStateTarget(sheetId: string, stateCode: string, fiscalYear: string, updates: Partial<StateTarget>): Promise<void> {
  const targets = await fetchStateTargets(sheetId);
  const targetIndex = targets.findIndex(t => t.stateCode === stateCode && t.fiscalYear === fiscalYear);
  
  if (targetIndex === -1) {
    throw new Error(`StateTarget for ${stateCode} in ${fiscalYear} not found`);
  }

  const updatedTarget = { ...targets[targetIndex], ...updates };
  const values = [
    updatedTarget.stateCode || '',
    updatedTarget.fiscalYear || '',
    String(updatedTarget.targetAmount || 0)
  ];

  await updateSheetRow(sheetId, `StateTargets!A${targetIndex + 2}:C${targetIndex + 2}`, [values]);
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.STATE_TARGETS);
}

// CRUD operations for Schools
export async function addSchool(sheetId: string, school: School): Promise<void> {
  const id = school.id || `school-${Date.now()}`;
  const values = [
    [
      id,
      school.stateCode || '',
      school.name || '',
      school.program || ''
    ]
  ];
  await appendSheetRows(sheetId, "Schools!A:D", values);
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.SCHOOLS);
}

export async function updateSchool(sheetId: string, schoolId: string, updates: Partial<School>): Promise<void> {
  const schools = await fetchSchools(sheetId);
  const schoolIndex = schools.findIndex(s => s.id === schoolId);
  
  if (schoolIndex === -1) {
    throw new Error(`School with ID ${schoolId} not found`);
  }

  const updatedSchool = { ...schools[schoolIndex], ...updates };
  const values = [
    updatedSchool.id || '',
    updatedSchool.stateCode || '',
    updatedSchool.name || '',
    updatedSchool.program || ''
  ];

  await updateSheetRow(sheetId, `Schools!A${schoolIndex + 2}:D${schoolIndex + 2}`, [values]);
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.SCHOOLS);
}

// CRUD operations for Prospects
export async function addProspect(sheetId: string, prospect: Prospect): Promise<void> {
  const values = [[
    prospect.id || `prospect-${Date.now()}`,
    prospect.stateCode || '',
    prospect.funderName || '',
    prospect.stage || 'Lead',
    String(prospect.estimatedAmount || 0),
    String(prospect.probability || 0),
    prospect.nextAction || '',
    prospect.dueDate || '',
    prospect.owner || '',
    prospect.description || '',
    prospect.documents || '',
    prospect.tags || '',
    prospect.contactPerson || '',
    prospect.contactEmail || '',
    prospect.contactPhone || '',
    prospect.lastContact || '',
    prospect.notes || ''
  ]];
  
  await appendSheetRows(sheetId, "Prospects!A:Q", values);
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.PROSPECTS);
}

export async function updateProspect(sheetId: string, prospectId: string, updates: Partial<Prospect>): Promise<void> {
  const prospects = await fetchProspects(sheetId);
  const prospectIndex = prospects.findIndex(p => p.id === prospectId);
  if (prospectIndex === -1) {
    throw new Error(`Prospect with ID ${prospectId} not found`);
  }
  
  const updatedProspect = { ...prospects[prospectIndex], ...updates };
  const values = [
    updatedProspect.id || '',
    updatedProspect.stateCode || '',
    updatedProspect.funderName || '',
    updatedProspect.stage || 'Lead',
    String(updatedProspect.estimatedAmount || 0),
    String(updatedProspect.probability || 0),
    updatedProspect.nextAction || '',
    updatedProspect.dueDate || '',
    updatedProspect.owner || '',
    updatedProspect.description || '',
    updatedProspect.documents || '',
    updatedProspect.tags || '',
    updatedProspect.contactPerson || '',
    updatedProspect.contactEmail || '',
    updatedProspect.contactPhone || '',
    updatedProspect.lastContact || '',
    updatedProspect.notes || ''
  ];
  
  await updateSheetRow(sheetId, `Prospects!A${prospectIndex + 2}:Q${prospectIndex + 2}`, [values]);
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.PROSPECTS);
}

export async function deleteProspect(sheetId: string, prospectId: string): Promise<void> {
  const prospects = await fetchProspects(sheetId);
  const prospectIndex = prospects.findIndex(p => p.id === prospectId);
  if (prospectIndex === -1) {
    throw new Error(`Prospect with ID ${prospectId} not found`);
  }
  
  // Delete the row by clearing it (Google Sheets API doesn't have a direct delete row method)
  const emptyValues = [Array(17).fill('')]; // 17 columns (A to Q)
  await updateSheetRow(sheetId, `Prospects!A${prospectIndex + 2}:Q${prospectIndex + 2}`, emptyValues);
  
  // Invalidate cache
  const { dataCache } = await import("./cache");
  dataCache.invalidate(CACHE_KEYS.PROSPECTS);
}


