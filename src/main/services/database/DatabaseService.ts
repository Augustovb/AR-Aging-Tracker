import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import logger from '../../utils/logger';

class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'ar-tracker.db');
  }

  initialize(): void {
    try {
      logger.info(`Initializing database at ${this.dbPath}`);

      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Open database connection
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');

      // Run migrations
      this.runMigrations();

      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private runMigrations(): void {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // Execute schema
      this.db.exec(schema);

      logger.info('Database migrations completed');
    } catch (error) {
      logger.error('Failed to run migrations:', error);
      throw error;
    }
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('Database connection closed');
    }
  }
}

export default new DatabaseService();
