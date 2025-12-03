import { ApartmentSearchFilters, Listing, User, MaintenanceRequest, MaintenanceStatus, UserRole } from '../types';

// Updated listings to match the bug report screenshots for proper testing
let MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    name: 'Industrial Loft near Korenmarkt',
    address: 'Korenmarkt 12, 9000 Ghent',
    price: 950,
    imageUrls: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'A',
    type: 'loft',
    size: 85,
    description: 'Stunning open plan loft right in the historic center of Ghent.',
    bedrooms: 1,
    petsAllowed: false,
    ownerId: 'owner1'
  },
  {
    id: '2',
    name: 'Classic Townhouse Oudburg',
    address: 'Oudburg 24, 9000 Ghent',
    price: 1450,
    imageUrls: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'B',
    type: 'house',
    size: 160,
    description: 'Spacious family house in the culinary heart of Ghent with a courtyard.',
    bedrooms: 3,
    petsAllowed: true,
    ownerId: 'owner1'
  },
  {
    id: '3',
    name: 'Modern Villa with Garden',
    address: 'Veldstraat 45, 2060 Antwerp',
    price: 1350,
    imageUrls: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'A',
    type: 'house', // Displayed as House in screenshots, but looks like a villa
    size: 160,
    description: 'Modern detached home with large garden on the outskirts of Antwerp.',
    bedrooms: 3,
    petsAllowed: true
  },
  {
    id: '4',
    name: 'Luxury Apartment Sablon',
    address: 'Rue de la Regence 36, 1000 Brussels',
    price: 1800,
    imageUrls: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'C',
    type: 'apartment',
    size: 110,
    description: 'High-end finish, parquet floors, and view of the conservatory.',
    bedrooms: 2,
    petsAllowed: false
  },
  {
    id: '5',
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
    id: '6',
    name: 'Renovated Villa',
    address: 'Kasteeldreef 5, 8000 Brugge',
    price: 2100,
    imageUrls: ['https://images.unsplash.com/photo-1600596542815-60c37c663d12?auto=format&fit=crop&w=800&q=80'],
    energyClass: 'B',
    type: 'villa',
    size: 220,
    description: 'Exclusive living in a green environment.',
    bedrooms: 4,
    petsAllowed: true
  }
];

const MOCK_USERS: User[] = [
  { id: 'admin1', email: 'admin@eburon.ai', name: 'System Administrator', role: 'admin' },
  { id: 'contractor1', email: 'fixit@eburon.ai', name: 'Joe The Plumber', role: 'contractor' },
  { id: 'broker1', email: 'broker@gmail.com', name: 'Broker Bob', role: 'broker' },
  { id: 'owner1', email: 'owner@eburon.ai', name: 'Landlord Larry', role: 'owner' },
  { id: 'tenant1', email: 'tenant@gmail.com', name: 'Jane Doe', role: 'tenant', rentedListingId: '1' },
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
  
  // Brokers see all for now (simple logic)
  if (role === 'broker') {
      return [...MOCK_MAINTENANCE_REQUESTS];
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