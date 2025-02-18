import axios from 'axios';

export interface PovFile {
  id: string;
  projectId: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    duration?: number;
    numberOfNodes?: number;
    [key: string]: any;
  };
}

export interface PovMetadata {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    duration?: number;
    numberOfNodes?: number;
    [key: string]: any;
  };
}

export class PovApiService {
  private static instance: PovApiService;
  private baseUrl: string = '/api/pov';

  private constructor() {}

  public static getInstance(): PovApiService {
    if (!PovApiService.instance) {
      PovApiService.instance = new PovApiService();
    }
    return PovApiService.instance;
  }

  public async getPovFile(id: string): Promise<PovFile> {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  public async getPovMetadata(id: string): Promise<PovMetadata> {
    try {
      const response = await axios.get(`${this.baseUrl}/metadata/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  public async listProjectPovFiles(projectId: string): Promise<PovMetadata[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/project/${projectId}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  public async savePovFile(povFile: Omit<PovFile, 'createdAt' | 'updatedAt'>): Promise<PovFile> {
    try {
      const response = await axios.post(this.baseUrl, povFile);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  public async deletePovFile(id: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw error;
    }
  }
}

export default PovApiService;
