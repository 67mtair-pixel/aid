import { supabase } from '../lib/supabaseClient';

interface BackupMetadata {
  id: string;
  timestamp: string;
  tables: string[];
  recordCounts: { [table: string]: number };
  size: number;
  status: 'completed' | 'failed' | 'in_progress';
}

export class BackupService {
  private static instance: BackupService;

  private constructor() {}

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  async createFullBackup(): Promise<BackupMetadata | null> {
    try {
      const backupId = `backup_${Date.now()}`;
      const timestamp = new Date().toISOString();

      const tables = [
        'beneficiaries',
        'organizations',
        'families',
        'packages',
        'tasks',
        'couriers',
        'alerts',
        'notifications',
        'inventory',
        'distribution_centers',
        'courier_locations',
        'emergency_contacts',
        'feedback',
        'system_users',
        'roles',
        'system_settings'
      ];

      const backupData: { [key: string]: any[] } = {};
      const recordCounts: { [table: string]: number } = {};

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Error backing up table ${table}:`, error);
          continue;
        }

        backupData[table] = data || [];
        recordCounts[table] = data?.length || 0;
      }

      const backupString = JSON.stringify(backupData);
      const backupSize = new Blob([backupString]).size;

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        tables,
        recordCounts,
        size: backupSize,
        status: 'completed'
      };

      const backupBlob = new Blob([backupString], { type: 'application/json' });
      const backupUrl = URL.createObjectURL(backupBlob);

      const link = document.createElement('a');
      link.href = backupUrl;
      link.download = `lasonm_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(backupUrl);

      return metadata;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  }

  async createTableBackup(tableName: string): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;

      const backupString = JSON.stringify(data, null, 2);
      const backupBlob = new Blob([backupString], { type: 'application/json' });
      const backupUrl = URL.createObjectURL(backupBlob);

      const link = document.createElement('a');
      link.href = backupUrl;
      link.download = `${tableName}_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(backupUrl);

      return data;
    } catch (error) {
      console.error(`Error backing up table ${tableName}:`, error);
      return null;
    }
  }

  async restoreFromBackup(backupFile: File): Promise<boolean> {
    try {
      const fileContent = await backupFile.text();
      const backupData = JSON.parse(fileContent);

      const tables = Object.keys(backupData);

      for (const table of tables) {
        const records = backupData[table];

        if (!Array.isArray(records) || records.length === 0) {
          continue;
        }

        const { error } = await supabase
          .from(table)
          .upsert(records, { onConflict: 'id' });

        if (error) {
          console.error(`Error restoring table ${table}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }

  async scheduleAutomaticBackup(frequency: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    const intervals = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };

    const interval = intervals[frequency];

    setInterval(async () => {
      console.log('Running automatic backup...');
      await this.createFullBackup();
    }, interval);
  }

  async exportDataToCSV(tableName: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;
      if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
      }

      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const csvUrl = URL.createObjectURL(csvBlob);

      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = `${tableName}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(csvUrl);
    } catch (error) {
      console.error(`Error exporting ${tableName} to CSV:`, error);
    }
  }

  async exportDataToExcel(tableName: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;
      if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
      }

      const headers = Object.keys(data[0]);
      let excelContent = '<table>';

      excelContent += '<thead><tr>';
      headers.forEach(header => {
        excelContent += `<th>${header}</th>`;
      });
      excelContent += '</tr></thead>';

      excelContent += '<tbody>';
      for (const row of data) {
        excelContent += '<tr>';
        headers.forEach(header => {
          const value = row[header];
          const cellValue = value === null || value === undefined
            ? ''
            : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);
          excelContent += `<td>${cellValue}</td>`;
        });
        excelContent += '</tr>';
      }
      excelContent += '</tbody></table>';

      const excelBlob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
      const excelUrl = URL.createObjectURL(excelBlob);

      const link = document.createElement('a');
      link.href = excelUrl;
      link.download = `${tableName}_export_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(excelUrl);
    } catch (error) {
      console.error(`Error exporting ${tableName} to Excel:`, error);
    }
  }

  async getBackupHistory(): Promise<BackupMetadata[]> {
    const backupHistory = localStorage.getItem('lasonm_backup_history');
    if (!backupHistory) return [];

    try {
      return JSON.parse(backupHistory);
    } catch {
      return [];
    }
  }

  async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const history = await this.getBackupHistory();
    history.unshift(metadata);

    if (history.length > 50) {
      history.splice(50);
    }

    localStorage.setItem('lasonm_backup_history', JSON.stringify(history));
  }

  async deleteOldBackups(daysToKeep: number = 30): Promise<number> {
    const history = await this.getBackupHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredHistory = history.filter(backup => {
      return new Date(backup.timestamp) >= cutoffDate;
    });

    const deletedCount = history.length - filteredHistory.length;
    localStorage.setItem('lasonm_backup_history', JSON.stringify(filteredHistory));

    return deletedCount;
  }

  async validateBackup(backupFile: File): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const fileContent = await backupFile.text();
      const backupData = JSON.parse(fileContent);

      const errors: string[] = [];

      if (typeof backupData !== 'object' || backupData === null) {
        errors.push('Invalid backup format: root must be an object');
      }

      const requiredTables = ['beneficiaries', 'packages', 'tasks'];
      for (const table of requiredTables) {
        if (!backupData[table]) {
          errors.push(`Missing required table: ${table}`);
        }
      }

      for (const [table, records] of Object.entries(backupData)) {
        if (!Array.isArray(records)) {
          errors.push(`Invalid data format for table ${table}: expected array`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Failed to parse backup file: ' + (error as Error).message]
      };
    }
  }
}

export const backupService = BackupService.getInstance();
