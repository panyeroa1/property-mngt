import { ApartmentSearchFilters, Listing, User, MaintenanceRequest, MaintenanceStatus, UserRole } from '../types';

// Updated listings with realistic Belgian data, new categories, and multiple images
let MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    name: 'Industrial Loft near Korenmarkt',
    address: 'Korenmarkt 12, 9000 Ghent',
    price: 950,
    imageUrls: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502005229766-31bf0bab5245?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=800&q=80'
    ],
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
    imageUrls: [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=800&q=80'
    ],
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
    imageUrls: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'A',
    type: 'house', 
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
    imageUrls: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522771753035-4a5042305a63?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'C',
    type: 'apartment',
    size: 110,
    description: 'High-end finish, parquet floors, and view of the conservatory in chic Sablon.',
    bedrooms: 2,
    petsAllowed: false
  },
  {
    id: '5',
    name: 'Cozy Studio near Station',
    address: 'Stationsstraat 8, 8900 Ieper',
    price: 550,
    imageUrls: [
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1533633917736-54ac886235b8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'C',
    type: 'studio',
    size: 40,
    description: 'Perfect for students or singles. Close to public transport and Menin Gate.',
    bedrooms: 0,
    petsAllowed: false
  },
  {
    id: '6',
    name: 'Exclusive Villa Knokke-Heist',
    address: 'Zoutelaan 120, 8300 Knokke-Heist',
    price: 3500,
    imageUrls: [
        'https://images.unsplash.com/photo-1600596542815-60c37c663d12?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'A+',
    type: 'villa',
    size: 350,
    description: 'Luxurious villa steps away from the beach. Heated pool and smart home system.',
    bedrooms: 5,
    petsAllowed: true
  },
  {
    id: '7',
    name: 'Student Kot Leuven Center',
    address: 'Naamsestraat 45, 3000 Leuven',
    price: 450,
    imageUrls: [
        'https://images.unsplash.com/photo-1555854743-e3c2f6a58d63?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'B',
    type: 'kot',
    size: 18,
    description: 'Modern student room with private sink. Shared kitchen and bathroom. High-speed internet.',
    bedrooms: 1,
    petsAllowed: false
  },
  {
    id: '8',
    name: 'Premium Student Kot Oude Markt',
    address: 'Oude Markt 12, 3000 Leuven',
    price: 520,
    imageUrls: [
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'A',
    type: 'kot',
    size: 22,
    description: 'Luxury student room with private shower. Located directly on the Oude Markt.',
    bedrooms: 1,
    petsAllowed: false
  },
  {
    id: '9',
    name: 'Skyline Penthouse Antwerp',
    address: 'Frankrijklei 88, 2000 Antwerp',
    price: 2800,
    imageUrls: [
        'https://images.unsplash.com/photo-1512918760532-3edbed1351c3?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1481437642641-2f0ae875f836?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'A',
    type: 'penthouse',
    size: 180,
    description: 'Top floor penthouse with 360 views of Antwerp. Large terrace and private elevator access.',
    bedrooms: 3,
    petsAllowed: true
  },
  {
    id: '10',
    name: 'EU District Penthouse',
    address: 'Rue de la Loi 200, 1000 Brussels',
    price: 3200,
    imageUrls: [
        'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'B',
    type: 'penthouse',
    size: 200,
    description: 'Spacious penthouse walking distance from European Commission. Concierge service included.',
    bedrooms: 4,
    petsAllowed: true
  },
  {
    id: '11',
    name: 'Modern Duplex Ixelles',
    address: 'Chaussée d\'Ixelles 150, 1050 Brussels',
    price: 1600,
    imageUrls: [
        'https://images.unsplash.com/photo-1502005229766-31bf0bab5245?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522771753035-4a5042305a63?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'B',
    type: 'duplex',
    size: 130,
    description: 'Stylish duplex apartment with high ceilings near Place Flagey.',
    bedrooms: 2,
    petsAllowed: true
  },
  {
    id: '12',
    name: 'Riverside Duplex Liège',
    address: 'Quai de la Boverie 10, 4020 Liège',
    price: 1200,
    imageUrls: [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'C',
    type: 'duplex',
    size: 115,
    description: 'Charming duplex overlooking the Meuse river. Newly renovated kitchen.',
    bedrooms: 2,
    petsAllowed: false
  },
  {
    id: '13',
    name: 'Historic Cottage Bruges',
    address: 'Begijnhof 12, 8000 Brugge',
    price: 1550,
    imageUrls: [
        'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'D',
    type: 'house',
    size: 100,
    description: 'Live in a fairytale cottage in the heart of Bruges. Quiet and picturesque.',
    bedrooms: 2,
    petsAllowed: false
  },
  {
    id: '14',
    name: 'Sunny Apartment Namur',
    address: 'Rue de Fer 45, 5000 Namur',
    price: 900,
    imageUrls: [
        'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=800&q=80'
    ],
    energyClass: 'B',
    type: 'apartment',
    size: 90,
    description: 'Bright apartment in the center of Namur. Close to the Citadel.',
    bedrooms: 2,
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