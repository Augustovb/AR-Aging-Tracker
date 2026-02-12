import * as XLSX from 'xlsx';
import logger from '../../utils/logger';

export interface ExcelRow {
  [key: string]: any;
}

export class ExcelParser {
  static parseFile(filePath: string, sheetName?: string): ExcelRow[] {
    try {
      logger.info(`Parsing Excel file: ${filePath}`);

      // Read the workbook
      const workbook = XLSX.readFile(filePath);

      // Get the first sheet or specified sheet
      const sheet = sheetName
        ? workbook.Sheets[sheetName]
        : workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new Error(`Sheet ${sheetName || 'first sheet'} not found`);
      }

      // Convert to JSON
      const data: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

      logger.info(`Parsed ${data.length} rows from Excel file`);
      return data;
    } catch (error) {
      logger.error('Failed to parse Excel file:', error);
      throw error;
    }
  }

  static getSheetNames(filePath: string): string[] {
    try {
      const workbook = XLSX.readFile(filePath);
      return workbook.SheetNames;
    } catch (error) {
      logger.error('Failed to get sheet names:', error);
      throw error;
    }
  }

  static previewData(filePath: string, limit: number = 5): ExcelRow[] {
    const allData = this.parseFile(filePath);
    return allData.slice(0, limit);
  }
}
