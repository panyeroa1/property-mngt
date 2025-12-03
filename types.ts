export interface Listing {
  id: string;
  name: string;
  address: string;
  price: number;
  imageUrls: string[];
  energyClass: string;
  type: 'apartment' | 'house' | 'studio' | 'villa' | 'loft';
  size: number;
  description: string;
  bedrooms: number;
  petsAllowed: boolean;
  ownerId?: string; // Link to an owner
}

export type ApartmentSearchFilters = {
  city?: string | null;
  neighborhood?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minSize?: number | null;
  maxSize?: number | null;
  bedrooms?: number | null;
  petsAllowed?: boolean | null;
  type?: string | null;
  energyClassMin?: string | null;
  sortBy?: "price_asc" | "price_desc" | "size" | "energy_asc" | "energy_desc" | "default" | null;
};

export interface NLUResponse {
  intent: "APARTMENT_SEARCH" | "REFINE_FILTERS" | "ASK_DETAILS" | "SMALL_TALK" | "END_SESSION";
  filters: ApartmentSearchFilters;
  assistantReply: string;
  targetListingId?: string | null;
}

export interface VoiceSearchState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  lastReply: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- New Types for Multi-Role Support ---

export type UserRole = 'admin' | 'contractor' | 'owner' | 'broker' | 'tenant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  rentedListingId?: string; // If tenant
}

export type MaintenanceStatus = 'open' | 'pending' | 'resolved';

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  listingId: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  createdAt: string;
  assignedTo?: string; // Contractor ID
}