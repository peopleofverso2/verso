const { PovFile, PovMetadata } = require('../types/pov');
import { LoggingService } from '../../services/LoggingService';

class PovService {
  static instance;
  logger;
  povFiles;

  constructor() {
    this.logger = LoggingService.getInstance();
    this.povFiles = new Map();
  }

  static getInstance() {
    if (!PovService.instance) {
      PovService.instance = new PovService();
    }
    return PovService.instance;
  }

  async getPovFile(id) {
    try {
      const povFile = this.povFiles.get(id);
      if (!povFile) {
        this.logger.warn('POV file not found', { id });
        return null;
      }
      return povFile;
    } catch (error) {
      this.logger.error('Error getting POV file', { error, id });
      throw error;
    }
  }

  async getPovMetadata(id) {
    try {
      const povFile = await this.getPovFile(id);
      if (!povFile) return null;

      const { content, ...metadata } = povFile;
      return metadata;
    } catch (error) {
      this.logger.error('Error getting POV metadata', { error, id });
      throw error;
    }
  }

  async savePovFile(povFile) {
    try {
      const now = new Date().toISOString();
      const existingFile = this.povFiles.get(povFile.id);

      const newPovFile = {
        ...povFile,
        createdAt: existingFile?.createdAt || now,
        updatedAt: now
      };

      this.povFiles.set(povFile.id, newPovFile);
      this.logger.info('POV file saved', { id: povFile.id });

      return newPovFile;
    } catch (error) {
      this.logger.error('Error saving POV file', { error, id: povFile.id });
      throw error;
    }
  }

  async deletePovFile(id) {
    try {
      const deleted = this.povFiles.delete(id);
      if (deleted) {
        this.logger.info('POV file deleted', { id });
      } else {
        this.logger.warn('POV file not found for deletion', { id });
      }
      return deleted;
    } catch (error) {
      this.logger.error('Error deleting POV file', { error, id });
      throw error;
    }
  }

  async listPovFiles(projectId) {
    try {
      const povFiles = Array.from(this.povFiles.values())
        .filter(file => file.projectId === projectId)
        .map(({ content, ...metadata }) => metadata);

      return povFiles;
    } catch (error) {
      this.logger.error('Error listing POV files', { error, projectId });
      throw error;
    }
  }
}

export { PovService };
