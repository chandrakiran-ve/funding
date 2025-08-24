// AI Data Controller - Natural Language Data Operations
// Allows AI agent to perform safe data modifications with revert capabilities

import { dataOperationsManager, DataOperation, ChangeRecord, BackupSnapshot } from './data-operations';
import { intelligentDataAccess } from './intelligent-data-access';
import { getCurrentFY } from './fy';

export interface AICommand {
  action: string;
  target: string;
  parameters: Record<string, any>;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: boolean;
}

export interface CommandResult {
  success: boolean;
  changeId?: string;
  message: string;
  affectedRecords?: number;
  canRevert?: boolean;
  confirmationRequired?: boolean;
}

export class AIDataController {
  private pendingOperations: Map<string, DataOperation> = new Map();

  // Parse natural language commands into structured operations
  parseCommand(userMessage: string): AICommand | null {
    const message = userMessage.toLowerCase().trim();

    // Create operations
    if (message.includes('create') || message.includes('add') || message.includes('new')) {
      return this.parseCreateCommand(userMessage);
    }

    // Update operations
    if (message.includes('update') || message.includes('change') || message.includes('modify') || message.includes('edit')) {
      return this.parseUpdateCommand(userMessage);
    }

    // Delete operations
    if (message.includes('delete') || message.includes('remove') || message.includes('erase')) {
      return this.parseDeleteCommand(userMessage);
    }

    // Bulk operations
    if (message.includes('bulk') || message.includes('all') || message.includes('every')) {
      return this.parseBulkCommand(userMessage);
    }

    // Revert operations
    if (message.includes('revert') || message.includes('undo') || message.includes('rollback')) {
      return this.parseRevertCommand(userMessage);
    }

    // Backup/restore operations
    if (message.includes('backup') || message.includes('restore') || message.includes('snapshot')) {
      return this.parseBackupCommand(userMessage);
    }

    return null;
  }

  // Execute a parsed command
  async executeCommand(command: AICommand): Promise<CommandResult> {
    try {
      console.log(`🤖 AI Data Controller executing: ${command.action} on ${command.target}`);

      // Create the data operation
      const operation = this.createDataOperation(command);

      if (!operation) {
        return {
          success: false,
          message: `Unable to create operation for command: ${command.description}`
        };
      }

      // Check if confirmation is required
      if (command.requiresConfirmation) {
        const operationId = `pending-${Date.now()}`;
        this.pendingOperations.set(operationId, operation);

        return {
          success: true,
          message: `⚠️ This operation requires confirmation: ${command.description}\n\n**Risk Level:** ${command.riskLevel.toUpperCase()}\n**Target:** ${command.target}\n**Action:** ${command.action}\n\nTo proceed, please confirm by saying "confirm ${operationId}" or "cancel ${operationId}" to cancel.`,
          confirmationRequired: true,
          canRevert: false
        };
      }

      // Execute the operation
      const changeId = await dataOperationsManager.performDataOperation(operation);

      // Invalidate caches to reflect changes
      await this.invalidateCaches();

      return {
        success: true,
        changeId,
        message: `✅ Operation completed successfully: ${command.description}\n\n**Change ID:** ${changeId}\n**Can Revert:** Yes (use "revert ${changeId}")`,
        canRevert: true
      };

    } catch (error) {
      console.error('❌ AI Data Controller error:', error);
      return {
        success: false,
        message: `❌ Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Confirm a pending operation
  async confirmOperation(operationId: string): Promise<CommandResult> {
    const operation = this.pendingOperations.get(operationId);
    if (!operation) {
      return {
        success: false,
        message: `❌ No pending operation found with ID: ${operationId}`
      };
    }

    try {
      const changeId = await dataOperationsManager.performDataOperation(operation);
      this.pendingOperations.delete(operationId);

      // Invalidate caches
      await this.invalidateCaches();

      return {
        success: true,
        changeId,
        message: `✅ Confirmed operation completed: ${operation.description}\n\n**Change ID:** ${changeId}\n**Can Revert:** Yes (use "revert ${changeId}")`,
        canRevert: true
      };
    } catch (error) {
      this.pendingOperations.delete(operationId);
      return {
        success: false,
        message: `❌ Confirmed operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Cancel a pending operation
  cancelOperation(operationId: string): CommandResult {
    const operation = this.pendingOperations.get(operationId);
    if (!operation) {
      return {
        success: false,
        message: `❌ No pending operation found with ID: ${operationId}`
      };
    }

    this.pendingOperations.delete(operationId);
    return {
      success: true,
      message: `✅ Operation cancelled: ${operation.description}`
    };
  }

  // Revert a change
  async revertChange(changeId: string): Promise<CommandResult> {
    try {
      const success = await dataOperationsManager.revertChange(changeId);

      if (success) {
        // Invalidate caches
        await this.invalidateCaches();

        return {
          success: true,
          message: `✅ Successfully reverted change: ${changeId}\n\nThe data has been restored to its previous state.`
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to revert change: ${changeId}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Revert failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get status information
  getStatusInfo(): {
    recentChanges: ChangeRecord[];
    revertableChanges: ChangeRecord[];
    criticalOperations: ChangeRecord[];
    snapshots: BackupSnapshot[];
    pendingOperations: string[];
  } {
    return {
      recentChanges: dataOperationsManager.getRecentChanges(5),
      revertableChanges: dataOperationsManager.getRevertableChanges(),
      criticalOperations: dataOperationsManager.getCriticalOperations(),
      snapshots: dataOperationsManager.getSnapshots(),
      pendingOperations: Array.from(this.pendingOperations.keys())
    };
  }

  // Command parsers
  private parseCreateCommand(message: string): AICommand {
    const riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const requiresConfirmation = false;

    if (message.includes('contribution') || message.includes('donation')) {
      return {
        action: 'create',
        target: 'contribution',
        parameters: this.extractContributionData(message),
        description: 'Create a new contribution record',
        riskLevel,
        requiresConfirmation
      };
    }

    if (message.includes('prospect') || message.includes('lead')) {
      return {
        action: 'create',
        target: 'prospect',
        parameters: this.extractProspectData(message),
        description: 'Create a new prospect record',
        riskLevel,
        requiresConfirmation
      };
    }

    return {
      action: 'create',
      target: 'unknown',
      parameters: {},
      description: 'Create a new record',
      riskLevel,
      requiresConfirmation
    };
  }

  private parseUpdateCommand(message: string): AICommand {
    const riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    const requiresConfirmation = true;

    if (message.includes('contribution') && message.includes('amount')) {
      return {
        action: 'update',
        target: 'contribution',
        parameters: this.extractUpdateData(message),
        description: 'Update contribution amount',
        riskLevel,
        requiresConfirmation
      };
    }

    return {
      action: 'update',
      target: 'unknown',
      parameters: {},
      description: 'Update existing record',
      riskLevel,
      requiresConfirmation
    };
  }

  private parseDeleteCommand(message: string): AICommand {
    const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
      message.includes('all') || message.includes('everything') ? 'critical' : 'high';
    const requiresConfirmation = true;

    if (message.includes('prospect')) {
      return {
        action: 'delete',
        target: 'prospect',
        parameters: this.extractDeleteData(message),
        description: 'Delete prospect record(s)',
        riskLevel,
        requiresConfirmation
      };
    }

    if (message.includes('all data') || message.includes('everything') || message.includes('database')) {
      return {
        action: 'erase_all',
        target: 'database',
        parameters: {},
        description: 'ERASE ALL DATA - This will delete everything!',
        riskLevel: 'critical',
        requiresConfirmation
      };
    }

    return {
      action: 'delete',
      target: 'unknown',
      parameters: {},
      description: 'Delete record(s)',
      riskLevel,
      requiresConfirmation
    };
  }

  private parseBulkCommand(message: string): AICommand {
    const riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'high';
    const requiresConfirmation = true;

    if (message.includes('delete all') || message.includes('remove all')) {
      return {
        action: 'bulk_delete',
        target: 'all_records',
        parameters: { table: this.extractTableFromMessage(message) },
        description: 'Bulk delete all records in table',
        riskLevel,
        requiresConfirmation
      };
    }

    return {
      action: 'bulk_operation',
      target: 'multiple_records',
      parameters: {},
      description: 'Bulk operation on multiple records',
      riskLevel,
      requiresConfirmation
    };
  }

  private parseRevertCommand(message: string): AICommand {
    const changeId = this.extractChangeId(message);

    return {
      action: 'revert',
      target: 'change',
      parameters: { changeId },
      description: `Revert change: ${changeId}`,
      riskLevel: 'medium',
      requiresConfirmation: false
    };
  }

  private parseBackupCommand(message: string): AICommand {
    if (message.includes('backup') || message.includes('snapshot')) {
      return {
        action: 'backup',
        target: 'database',
        parameters: { description: this.extractDescription(message) },
        description: 'Create data backup snapshot',
        riskLevel: 'low',
        requiresConfirmation: false
      };
    }

    if (message.includes('restore')) {
      return {
        action: 'restore',
        target: 'database',
        parameters: { snapshotId: this.extractSnapshotId(message) },
        description: 'Restore from backup snapshot',
        riskLevel: 'critical',
        requiresConfirmation: true
      };
    }

    return {
      action: 'backup',
      target: 'database',
      parameters: {},
      description: 'Data backup operation',
      riskLevel: 'low',
      requiresConfirmation: false
    };
  }

  // Data extraction helpers
  private extractContributionData(message: string): any {
    // Extract amount, funder, state, fiscal year from message
    const amount = this.extractAmount(message);
    const funder = this.extractFunder(message);
    const state = this.extractState(message);
    const fiscalYear = this.extractFiscalYear(message) || getCurrentFY();

    return {
      amount,
      funderId: funder,
      stateCode: state,
      fiscalYear,
      date: new Date().toISOString().split('T')[0]
    };
  }

  private extractProspectData(message: string): any {
    const amount = this.extractAmount(message);
    const funderName = this.extractFunderName(message);
    const state = this.extractState(message);

    return {
      estimatedAmount: amount,
      funderName,
      stateCode: state,
      stage: 'Lead',
      probability: 0.5
    };
  }

  private extractUpdateData(message: string): any {
    return {
      field: this.extractFieldToUpdate(message),
      value: this.extractNewValue(message)
    };
  }

  private extractDeleteData(message: string): any {
    return {
      identifier: this.extractIdentifier(message)
    };
  }

  // Utility extractors
  private extractAmount(message: string): number {
    const amountMatch = message.match(/₹?(\d+(?:,\d+)*(?:\.\d{2})?)/);
    return amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  }

  private extractFunder(message: string): string {
    // This would need to be more sophisticated with actual funder matching
    return 'unknown-funder';
  }

  private extractFunderName(message: string): string {
    // Extract funder name from message
    return 'Unknown Funder';
  }

  private extractState(message: string): string {
    const stateMap: Record<string, string> = {
      'karnataka': 'KA',
      'tamil nadu': 'TN',
      'tamilnadu': 'TN',
      'kerala': 'KL',
      'maharashtra': 'MH'
    };

    for (const [name, code] of Object.entries(stateMap)) {
      if (message.includes(name)) {
        return code;
      }
    }

    return 'XX';
  }

  private extractFiscalYear(message: string): string | null {
    const fyMatch = message.match(/FY(\d{2}-\d{2})/i);
    return fyMatch ? `FY${fyMatch[1]}` : null;
  }

  private extractChangeId(message: string): string {
    const idMatch = message.match(/revert\s+([a-zA-Z0-9-]+)/);
    return idMatch ? idMatch[1] : '';
  }

  private extractSnapshotId(message: string): string {
    const idMatch = message.match(/restore\s+([a-zA-Z0-9-]+)/);
    return idMatch ? idMatch[1] : '';
  }

  private extractDescription(message: string): string {
    return `AI Command: ${message.slice(0, 50)}${message.length > 50 ? '...' : ''}`;
  }

  private extractTableFromMessage(message: string): string {
    if (message.includes('contribution')) return 'contributions';
    if (message.includes('prospect')) return 'prospects';
    if (message.includes('target')) return 'targets';
    if (message.includes('school')) return 'schools';
    return 'unknown';
  }

  private extractFieldToUpdate(message: string): string {
    return 'amount'; // Default field
  }

  private extractNewValue(message: string): any {
    return this.extractAmount(message);
  }

  private extractIdentifier(message: string): string {
    return 'unknown-id';
  }

  // Create data operation from command
  private createDataOperation(command: AICommand): DataOperation | null {
    switch (command.target) {
      case 'contribution':
        return {
          type: command.action as any,
          table: 'contributions',
          data: command.parameters,
          description: command.description,
          requiresConfirmation: command.requiresConfirmation,
          riskLevel: command.riskLevel
        };

      case 'prospect':
        return {
          type: command.action as any,
          table: 'prospects',
          data: command.parameters,
          description: command.description,
          requiresConfirmation: command.requiresConfirmation,
          riskLevel: command.riskLevel
        };

      case 'change':
        return {
          type: 'revert',
          table: 'changes',
          data: command.parameters,
          description: command.description,
          requiresConfirmation: false,
          riskLevel: 'medium'
        };

      case 'database':
        if (command.action === 'backup') {
          return {
            type: 'backup',
            table: 'all',
            data: command.parameters,
            description: command.description,
            requiresConfirmation: false,
            riskLevel: 'low'
          };
        }
        if (command.action === 'erase_all') {
          return {
            type: 'erase_all',
            table: 'all',
            data: {},
            description: command.description,
            requiresConfirmation: true,
            riskLevel: 'critical'
          };
        }
        break;
    }

    return null;
  }

  // Invalidate all caches after data changes
  private async invalidateCaches(): Promise<void> {
    try {
      // Clear data cache
      const { dataCache } = await import('./cache');
      dataCache.invalidate('funders');
      dataCache.invalidate('contributions');
      dataCache.invalidate('state_targets');
      dataCache.invalidate('prospects');
      dataCache.invalidate('states');
      dataCache.invalidate('schools');
      dataCache.invalidate('users');

      // Reinitialize intelligent data access
      await intelligentDataAccess.initialize();

      console.log('🔄 All caches invalidated and refreshed');
    } catch (error) {
      console.error('❌ Failed to invalidate caches:', error);
    }
  }
}

// Export singleton instance
export const aiDataController = new AIDataController();
