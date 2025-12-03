import { ApartmentSearchFilters, Listing, User, MaintenanceRequest, MaintenanceStatus, UserRole } from '../types';

let MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    name: 'Modern Loft in City Center',
    address: 'Grote Markt 12, Ieper',
    price: 850,
    imageUrls: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'A',
    type: 'apartment',
    size: 85,
    description: 'Beautiful loft with high ceilings and view of the market square.',
    bedrooms: 1,
    petsAllowed: false,
    ownerId: 'owner1'
  },
  {
    id: '2',
    name: 'Spacious Family House',
    address: 'Rijselstraat 45, Ieper',
    price: 1200,
    imageUrls: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'B',
    type: 'house',
    size: 150,
    description: 'Renovated family home with a small garden.',
    bedrooms: 3,
    petsAllowed: true,
    ownerId: 'owner1'
  },
  {
    id: '3',
    name: 'Cozy Studio near Station',
    address: 'Stationsstraat 8, Ieper',
    price: 550,
    imageUrls: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'C',
    type: 'studio',
    size: 40,
    description: 'Perfect for students or singles. Close to public transport.',
    bedrooms: 0,
    petsAllowed: false
  },
  {
    id: '4',
    name: 'Luxury Apartment with Terrace',
    address: 'Boterstraat 36, Ieper',
    price: 950,
    imageUrls: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'A+',
    type: 'apartment',
    size: 95,
    description: 'Modern finishing, large terrace, underground parking included.',
    bedrooms: 2,
    petsAllowed: true
  },
  {
    id: '5',
    name: 'Historic Townhouse',
    address: 'Menenstraat 20, Ieper',
    price: 1100,
    imageUrls: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'D',
    type: 'house',
    size: 130,
    description: 'Charming authentic house. Needs some love but full of character.',
    bedrooms: 3,
    petsAllowed: true
  },
  {
    id: '6',
    name: 'Budget 2-Bedroom',
    address: 'Diksmuidseweg 100, Ieper',
    price: 700,
    imageUrls: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'C',
    type: 'apartment',
    size: 75,
    description: 'Affordable apartment just outside the center. Features a cozy living area and basic amenities.',
    bedrooms: 2,
    petsAllowed: true
  }
];

const MOCK_USERS: User[] = [
  { id: 'admin1', email: 'admin@eburon.ai', name: 'System Administrator', role: 'admin' },
  { id: 'contractor1', email: 'fixit@eburon.ai', name: 'Joe The Plumber', role: 'contractor' },
  { id: 'owner1', email: 'owner@eburon.ai', name: 'Landlord Larry', role: 'owner' },
  { id: 'tenant1', email: 'tenant@eburon.ai', name: 'Jane Doe', role: 'tenant', rentedListingId: '1' },
];

let MOCK_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
  {
    id: 'm1',
    tenantId: 'tenant1',
    listingId: '1',
    title: 'Leaking Tap',
    description: 'The kitchen tap is dripping constantly.',
    status: 'open',
    createdAt: new Date().toISOString(),
    assignedTo: 'contractor1'
  },
  {
    id: 'm2',
    tenantId: 'tenant1',
    listingId: '1',
    title: 'Flickering Light',
    description: 'Living room light flickers when turned on.',
    status: 'resolved',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    assignedTo: 'contractor1'
  }
];

// --- Helpers ---

function getEnergyScore(energyClass: string): number {
  switch (energyClass) {
    case 'A+': return 1;
    case 'A': return 2;
    case 'B': return 3;
    case 'C': return 4;
    case 'D': return 5;
    case 'E': return 6;
    case 'F': return 7;
    default: return 8;
  }
}

// --- Listings ---

export async function searchListings(filters: ApartmentSearchFilters): Promise<Listing[]> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Lower latency for snappy feel

  let results = [...MOCK_LISTINGS];

  if (filters.city) {
    const city = filters.city.toLowerCase();
    results = results.filter(l => l.address.toLowerCase().includes(city));
  }

  if (filters.neighborhood) {
    const hood = filters.neighborhood.toLowerCase();
    results = results.filter(l => l.address.toLowerCase().includes(hood));
  }

  if (filters.minPrice != null) results = results.filter(l => l.price >= filters.minPrice!);
  if (filters.maxPrice != null) results = results.filter(l => l.price <= filters.maxPrice!);
  if (filters.minSize != null) results = results.filter(l => l.size >= filters.minSize!);
  if (filters.maxSize != null) results = results.filter(l => l.size <= filters.maxSize!);
  if (filters.type) {
    const type = filters.type.toLowerCase();
    results = results.filter(l => l.type.toLowerCase() === type);
  }
  if (filters.bedrooms != null) results = results.filter(l => l.bedrooms >= filters.bedrooms!);
  if (filters.petsAllowed === true) results = results.filter(l => l.petsAllowed === true);

  // Sorting Logic
  if (filters.sortBy === 'price_asc') {
    results.sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === 'price_desc') {
    results.sort((a, b) => b.price - a.price);
  } else if (filters.sortBy === 'size') {
    results.sort((a, b) => b.size - a.size);
  } else if (filters.sortBy === 'energy_asc') {
    // Best (A+) to Worst (F)
    results.sort((a, b) => getEnergyScore(a.energyClass) - getEnergyScore(b.energyClass));
  } else if (filters.sortBy === 'energy_desc') {
    // Worst (F) to Best (A+)
    results.sort((a, b) => getEnergyScore(b.energyClass) - getEnergyScore(a.energyClass));
  }

  return results;
}

export async function createListing(listing: Omit<Listing, 'id'>): Promise<Listing> {
  const newListing = { ...listing, id: Math.random().toString(36).substr(2, 9) };
  MOCK_LISTINGS.push(newListing);
  return newListing;
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  return MOCK_LISTINGS.find(l => l.id === id);
}

// --- Users ---

export async function authenticateUser(email: string): Promise<User | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_USERS.find(u => u.email === email) || null;
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
  MOCK_USERS.push(newUser);
  return newUser;
}

export async function getUsers(): Promise<User[]> {
  return [...MOCK_USERS];
}

// --- Maintenance ---

export async function getMaintenanceRequests(role: UserRole, userId: string): Promise<MaintenanceRequest[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (role === 'admin') return [...MOCK_MAINTENANCE_REQUESTS];
  
  if (role === 'contractor') {
    // Contractors see open requests or assigned to them
    return MOCK_MAINTENANCE_REQUESTS.filter(r => r.assignedTo === userId || r.status === 'open');
  }
  
  if (role === 'owner') {
     // Owners see requests for their properties
     const myListingIds = MOCK_LISTINGS.filter(l => l.ownerId === userId).map(l => l.id);
     return MOCK_MAINTENANCE_REQUESTS.filter(r => myListingIds.includes(r.listingId));
  }

  if (role === 'tenant') {
    return MOCK_MAINTENANCE_REQUESTS.filter(r => r.tenantId === userId);
  }

  return [];
}

export async function createMaintenanceRequest(req: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'status'>): Promise<MaintenanceRequest> {
  const newReq: MaintenanceRequest = {
    ...req,
    id: Math.random().toString(36).substr(2, 9),
    status: 'open',
    createdAt: new Date().toISOString()
  };
  MOCK_MAINTENANCE_REQUESTS.unshift(newReq);
  return newReq;
}

export async function updateMaintenanceStatus(id: string, status: MaintenanceStatus): Promise<void> {
  const req = MOCK_MAINTENANCE_REQUESTS.find(r => r.id === id);
  if (req) {
    req.status = status;
  }
}

// Stats helper
export async function getSystemStats() {
    return {
        totalListings: MOCK_LISTINGS.length,
        totalUsers: MOCK_USERS.length,
        activeMaintenance: MOCK_MAINTENANCE_REQUESTS.filter(r => r.status !== 'resolved').length
    };
}