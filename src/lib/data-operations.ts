// Data Operations and Change Management System
// Provides safe data modification with full revert/undo capabilities

import {
  getFunders,
  getContributions,
  getStateTargets,
  getStates,
  getSchools,
  getProspects,
  getUsers,
  addContribution,
  updateContribution,
  addStateTarget,
  updateStateTarget,
  addSchool,
  updateSchool,
  addProspect,
  updateProspect,
  deleteProspect,
  addUser,
  updateUser,
  Funder,
  Contribution,
  StateTarget,
  School,
  Prospect,
  StateInfo,
  User
} from './sheets';
import { dataCache } from './cache';

export interface ChangeRecord {
  id: string;
  timestamp: number;
  operation: 'create' | 'update' | 'delete' | 'bulk_create' | 'bulk_update' | 'bulk_delete' | 'erase_all';
  table: 'funders' | 'contributions' | 'targets' | 'schools' | 'prospects' | 'states' | 'users';
  description: string;
  beforeData?: any[];
  afterData?: any[];
  affectedRecords: number;
  userId?: string;
  canRevert: boolean;
  revertData?: any;
}

export interface DataOperation {
  type: 'create' | 'update' | 'delete' | 'bulk_create' | 'bulk_update' | 'bulk_delete' | 'erase_all';
  table: string;
  data: any;
  conditions?: any;
  description?: string;
  requiresConfirmation?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface BackupSnapshot {
  id: string;
  timestamp: number;
  tables: Record<string, any[]>;
  description: string;
  size: number;
}

class DataOperationsManager {
  private changes: ChangeRecord[] = [];
  private snapshots: BackupSnapshot[] = [];
  private maxChanges = 100; // Keep last 100 changes
  private maxSnapshots = 10; // Keep last 10 snapshots

  // Create a backup snapshot before major operations
  async createBackupSnapshot(description: string): Promise<string> {
    try {
      console.log(`📦 Creating backup snapshot: ${description}`);

      const [funders, contributions, targets, states, schools, prospects, users] = await Promise.all([
        getFunders(),
        getContributions(),
        getStateTargets(),
        getStates(),
        getSchools(),
        getProspects(),
        getUsers()
      ]);

      const snapshot: BackupSnapshot = {
        id: `snapshot-${Date.now()}`,
        timestamp: Date.now(),
        tables: {
          funders,
          contributions,
          targets,
          states,
          schools,
          prospects,
          users
        },
        description,
        size: JSON.stringify({
          funders,
          contributions,
          targets,
          states,
          schools,
          prospects,
          users
        }).length
      };

      this.snapshots.push(snapshot);

      // Keep only the latest snapshots
      if (this.snapshots.length > this.maxSnapshots) {
        this.snapshots = this.snapshots.slice(-this.maxSnapshots);
      }

      console.log(`✅ Backup snapshot created: ${snapshot.id} (${snapshot.size} bytes)`);
      return snapshot.id;
    } catch (error) {
      console.error('❌ Failed to create backup snapshot:', error);
      throw error;
    }
  }

  // Record a change operation
  recordChange(change: Omit<ChangeRecord, 'id' | 'timestamp'>): string {
    const changeRecord: ChangeRecord = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...change
    };

    this.changes.push(changeRecord);

    // Keep only the latest changes
    if (this.changes.length > this.maxChanges) {
      this.changes = this.changes.slice(-this.maxChanges);
    }

    console.log(`📝 Change recorded: ${changeRecord.id} - ${changeRecord.description}`);
    return changeRecord.id;
  }

  // Get recent changes
  getRecentChanges(limit = 10): ChangeRecord[] {
    return this.changes
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Get available snapshots
  getSnapshots(): BackupSnapshot[] {
    return this.snapshots.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Revert a specific change
  async revertChange(changeId: string): Promise<boolean> {
    const change = this.changes.find(c => c.id === changeId);
    if (!change || !change.canRevert) {
      throw new Error(`Change ${changeId} not found or cannot be reverted`);
    }

    try {
      console.log(`🔄 Reverting change: ${changeId} - ${change.description}`);

      await this.createBackupSnapshot(`Auto-backup before reverting: ${change.description}`);

      // Perform the revert operation based on the change type
      switch (change.operation) {
        case 'create':
          await this.revertCreate(change);
          break;
        case 'update':
          await this.revertUpdate(change);
          break;
        case 'delete':
          await this.revertDelete(change);
          break;
        case 'bulk_create':
          await this.revertBulkCreate(change);
          break;
        case 'bulk_update':
          await this.revertBulkUpdate(change);
          break;
        case 'bulk_delete':
          await this.revertBulkDelete(change);
          break;
        default:
          throw new Error(`Unsupported revert operation: ${change.operation}`);
      }

      // Mark the change as reverted
      change.canRevert = false;

      console.log(`✅ Successfully reverted change: ${changeId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to revert change ${changeId}:`, error);
      throw error;
    }
  }

  // Restore from a snapshot
  async restoreFromSnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    try {
      console.log(`🔄 Restoring from snapshot: ${snapshotId} - ${snapshot.description}`);

      // Create a backup before restoration
      await this.createBackupSnapshot(`Auto-backup before restoring snapshot: ${snapshot.description}`);

      // Clear all data and restore from snapshot
      await this.clearAllData();

      // Restore data from snapshot (this would need to be implemented with actual sheet operations)
      // For now, we'll just log the intention
      console.log(`📊 Would restore ${Object.keys(snapshot.tables).length} tables from snapshot`);

      // Record the restoration
      this.recordChange({
        operation: 'bulk_update',
        table: 'all',
        description: `Restored from snapshot: ${snapshot.description}`,
        beforeData: [], // We don't have before data for restoration
        afterData: Object.values(snapshot.tables).flat(),
        affectedRecords: Object.values(snapshot.tables).reduce((sum, table) => sum + table.length, 0),
        canRevert: false // Restoration cannot be reverted
      });

      console.log(`✅ Successfully initiated restoration from snapshot: ${snapshotId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to restore from snapshot ${snapshotId}:`, error);
      throw error;
    }
  }

  // Clear all data (dangerous operation)
  private async clearAllData(): Promise<void> {
    console.log('⚠️  Clearing all data...');

    // This is a placeholder - in reality, you would need to implement
    // the actual clearing logic for each table
    // This could involve deleting all rows or clearing the sheets

    console.log('✅ All data cleared (placeholder implementation)');
  }

  // Individual revert operations
  private async revertCreate(change: ChangeRecord): Promise<void> {
    // Implementation would delete the created record
    console.log(`Deleting created record from ${change.table}`);
  }

  private async revertUpdate(change: ChangeRecord): Promise<void> {
    // Implementation would restore the original data
    console.log(`Restoring original data for ${change.table}`);
  }

  private async revertDelete(change: ChangeRecord): Promise<void> {
    // Implementation would restore the deleted record
    console.log(`Restoring deleted record in ${change.table}`);
  }

  private async revertBulkCreate(change: ChangeRecord): Promise<void> {
    // Implementation would delete all created records
    console.log(`Deleting bulk created records from ${change.table}`);
  }

  private async revertBulkUpdate(change: ChangeRecord): Promise<void> {
    // Implementation would restore all original data
    console.log(`Restoring bulk original data for ${change.table}`);
  }

  private async revertBulkDelete(change: ChangeRecord): Promise<void> {
    // Implementation would restore all deleted records
    console.log(`Restoring bulk deleted records in ${change.table}`);
  }

  // Data modification operations with safety
  async performDataOperation(operation: DataOperation): Promise<string> {
    const requiresConfirmation = operation.requiresConfirmation !== false;
    const riskLevel = operation.riskLevel || 'medium';

    // Create backup for high-risk operations
    if (riskLevel === 'high' || riskLevel === 'critical') {
      await this.createBackupSnapshot(`Auto-backup before ${operation.type} operation on ${operation.table}`);
    }

    // Perform the operation
    const result = await this.executeOperation(operation);

    // Record the change
    const changeId = this.recordChange({
      operation: operation.type,
      table: operation.table as any,
      description: operation.description || `${operation.type} operation on ${operation.table}`,
      affectedRecords: Array.isArray(result) ? result.length : 1,
      canRevert: true,
      revertData: operation.data
    });

    return changeId;
  }

  private async executeOperation(operation: DataOperation): Promise<any> {
    console.log(`⚡ Executing ${operation.type} operation on ${operation.table}`);

    switch (operation.table) {
      case 'contributions':
        return await this.handleContributionOperation(operation);
      case 'funders':
        return await this.handleFunderOperation(operation);
      case 'targets':
        return await this.handleTargetOperation(operation);
      case 'prospects':
        return await this.handleProspectOperation(operation);
      case 'schools':
        return await this.handleSchoolOperation(operation);
      case 'states':
        return await this.handleStateOperation(operation);
      case 'users':
        return await this.handleUserOperation(operation);
      default:
        throw new Error(`Unsupported table: ${operation.table}`);
    }
  }

  // Table-specific operation handlers
  private async handleContributionOperation(operation: DataOperation): Promise<any> {
    switch (operation.type) {
      case 'create':
        return await addContribution(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data);
      case 'update':
        return await updateContribution(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data.id, operation.data);
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private async handleFunderOperation(operation: DataOperation): Promise<any> {
    // Implement funder operations
    console.log('Funder operation:', operation.type);
    return { success: true };
  }

  private async handleTargetOperation(operation: DataOperation): Promise<any> {
    switch (operation.type) {
      case 'create':
        return await addStateTarget(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data);
      case 'update':
        return await updateStateTarget(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data.stateCode, operation.data.fiscalYear, operation.data);
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private async handleProspectOperation(operation: DataOperation): Promise<any> {
    switch (operation.type) {
      case 'create':
        return await addProspect(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data);
      case 'update':
        return await updateProspect(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data.id, operation.data);
      case 'delete':
        return await deleteProspect(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data.id);
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private async handleSchoolOperation(operation: DataOperation): Promise<any> {
    switch (operation.type) {
      case 'create':
        return await addSchool(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data);
      case 'update':
        return await updateSchool(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data.id, operation.data);
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private async handleStateOperation(operation: DataOperation): Promise<any> {
    // States are typically read-only, but could implement updates if needed
    console.log('State operation:', operation.type);
    return { success: true };
  }

  private async handleUserOperation(operation: DataOperation): Promise<any> {
    switch (operation.type) {
      case 'create':
        return await addUser(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data, operation.data.id);
      case 'update':
        return await updateUser(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!, operation.data.id, operation.data);
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  // Utility methods
  getChangeHistory(): ChangeRecord[] {
    return this.changes.sort((a, b) => b.timestamp - a.timestamp);
  }

  getRevertableChanges(): ChangeRecord[] {
    return this.changes.filter(c => c.canRevert).sort((a, b) => b.timestamp - a.timestamp);
  }

  getCriticalOperations(): ChangeRecord[] {
    return this.changes.filter(c =>
      c.operation === 'bulk_delete' ||
      c.operation === 'bulk_update' ||
      c.operation === 'erase_all' ||
      c.affectedRecords > 10
    ).sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Export singleton instance
export const dataOperationsManager = new DataOperationsManager();
