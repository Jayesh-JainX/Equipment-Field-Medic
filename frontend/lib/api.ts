export interface User {
  id: string;
  name: string;
  email: string;
  gearKit?: { name: string; category: string; available: boolean }[];
}

export interface RepairStep {
  stepNumber: number;
  title: string;
  instruction: string;
  materialsNeeded: string[];
  safetyWarning?: string;
  estimatedTimeMinutes?: number;
}

export interface RepairProtocol {
  equipmentName: string;
  identifiedMaterial: string;
  confidenceScore: number;
  issueDescription: string;
  durabilityRating: 'Emergency Field Patch (Temporary)' | 'High Durability (Multi-day)' | 'Permanent Field Fix';
  requiredTools: string[];
  steps: RepairStep[];
  batteryTips: string[];
  voiceIntro: string;
}

export interface SavedRepairLog {
  _id: string;
  equipmentName: string;
  category: string;
  identifiedMaterial: string;
  confidenceScore: number;
  issueDescription: string;
  durabilityRating: string;
  requiredTools: string[];
  steps: RepairStep[];
  batteryTips: string[];
  createdAt: string;
}

export interface GearItem {
  id?: string;
  _id?: string;
  name: string;
  category: string;
  material?: string;
  inPack: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('field_medic_token');
  }
  return null;
};

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API Request Failed');
  }

  return data;
};
