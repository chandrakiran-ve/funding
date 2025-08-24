import { Funder, StateInfo, fetchFunders, fetchStates } from './sheets';

// Helper functions for CRUD operations
async function appendSheetRows(sheetId: string, range: string, values: string[][]): Promise<void> {
  const { google } = await import("googleapis");
  
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const key = keyRaw?.replace(/\\n/g, "\n");
  
  if (!email || !key) throw new Error("Google Sheets credentials not configured");
  
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  
  const sheets = google.sheets({ version: "v4", auth });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values.map(row => row.map(cell => String(cell || '')))
      }
    });
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw new Error('Failed to append to sheet');
  }
}

async function updateSheetRow(sheetId: string, range: string, values: string[][]): Promise<void> {
  const { google } = await import("googleapis");
  
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const key = keyRaw?.replace(/\\n/g, "\n");
  
  if (!email || !key) throw new Error("Google Sheets credentials not configured");
  
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  
  const sheets = google.sheets({ version: "v4", auth });

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values.map(row => row.map(cell => String(cell || '')))
      }
    });
  } catch (error) {
    console.error('Error updating sheet:', error);
    throw new Error('Failed to update sheet');
  }
}

// Funder CRUD operations
export async function addFunder(funder: Omit<Funder, 'id'>): Promise<Funder> {
  const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) throw new Error("Sheet ID not configured");

  // Generate new ID
  const existingFunders = await fetchFunders(sheetId);
  const newId = `F${(existingFunders.length + 1).toString().padStart(3, '0')}`;
  
  const newFunder: Funder = {
    id: newId,
    ...funder
  };

  // Append to sheet
  const values = [[
    newFunder.id,
    newFunder.name,
    newFunder.type || '',
    newFunder.priority || '',
    newFunder.owner || ''
  ]];

  await appendSheetRows(sheetId, 'Funders!A:E', values);
  
  // Invalidate cache
  try {
    const { dataCache } = await import("./cache");
    dataCache.invalidate('funders');
  } catch (error) {
    console.warn('Cache invalidation failed:', error);
  }
  
  return newFunder;
}

export async function updateFunder(funderId: string, updates: Partial<Funder>): Promise<void> {
  const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) throw new Error("Sheet ID not configured");

  const funders = await fetchFunders(sheetId);
  const funderIndex = funders.findIndex(f => f.id === funderId);
  if (funderIndex === -1) {
    throw new Error(`Funder with ID ${funderId} not found`);
  }

  const updatedFunder = { ...funders[funderIndex], ...updates };
  
  // Update the row
  const values = [[
    updatedFunder.id,
    updatedFunder.name,
    updatedFunder.type || '',
    updatedFunder.priority || '',
    updatedFunder.owner || ''
  ]];

  await updateSheetRow(sheetId, `Funders!A${funderIndex + 2}:E${funderIndex + 2}`, values);
  
  // Invalidate cache
  try {
    const { dataCache } = await import("./cache");
    dataCache.invalidate('funders');
  } catch (error) {
    console.warn('Cache invalidation failed:', error);
  }
}

// State CRUD operations
export async function addState(state: Omit<StateInfo, 'code'>): Promise<StateInfo> {
  const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) throw new Error("Sheet ID not configured");

  // Generate new code (first 2-3 letters of name, uppercase)
  const code = state.name.substring(0, 3).toUpperCase();
  
  const newState: StateInfo = {
    code,
    ...state
  };

  // Append to sheet
  const values = [[
    newState.code,
    newState.name,
    newState.coordinator || ''
  ]];

  await appendSheetRows(sheetId, 'States!A:C', values);
  
  // Invalidate cache
  try {
    const { dataCache } = await import("./cache");
    dataCache.invalidate('states');
  } catch (error) {
    console.warn('Cache invalidation failed:', error);
  }
  
  return newState;
}

export async function updateState(stateCode: string, updates: Partial<StateInfo>): Promise<void> {
  const sheetId = process.env.SHEET_ID_MASTER || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  if (!sheetId) throw new Error("Sheet ID not configured");

  const states = await fetchStates(sheetId);
  const stateIndex = states.findIndex(s => s.code === stateCode);
  if (stateIndex === -1) {
    throw new Error(`State with code ${stateCode} not found`);
  }

  const updatedState = { ...states[stateIndex], ...updates };
  
  // Update the row
  const values = [[
    updatedState.code,
    updatedState.name,
    updatedState.coordinator || ''
  ]];

  await updateSheetRow(sheetId, `States!A${stateIndex + 2}:C${stateIndex + 2}`, values);
  
  // Invalidate cache
  try {
    const { dataCache } = await import("./cache");
    dataCache.invalidate('states');
  } catch (error) {
    console.warn('Cache invalidation failed:', error);
  }
}
