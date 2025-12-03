import React, { useState, useEffect } from 'react';
import { User, MaintenanceRequest, UserRole } from '../types';
import { getMaintenanceRequests, updateMaintenanceStatus, getSystemStats, createUser, createListing, getUsers } from '../services/mockDb';

interface ManagementPortalProps {
  user: User;
  onLogout: () => void;
}

const ManagementPortal: React.FC<ManagementPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'listings'>('dashboard');
  const [tickets, setTickets] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState({ totalListings: 0, totalUsers: 0, activeMaintenance: 0 });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'contractor' as UserRole });
  const [newListing, setNewListing] = useState({ address: '', price: '', type: 'apartment' });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    // Load dashboard data based on role
    const loadData = async () => {
      const t = await getMaintenanceRequests(user.role, user.id);
      setTickets(t);
      if (user.role === 'admin') {
        const s = await getSystemStats();
        setStats(s);
      }
    };
    loadData();
  }, [user, refresh]);

  const handleStatusChange = async (id: string, newStatus: MaintenanceRequest['status']) => {
    await updateMaintenanceStatus(id, newStatus);
    setRefresh(prev => prev + 1);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role !== 'admin') return;
    await createUser({ name: newUser.name, email: newUser.email, role: newUser.role });
    setNewUser({ name: '', email: '', role: 'contractor' });
    alert(`User ${newUser.name} created! Invite sent.`);
    setRefresh(prev => prev + 1);
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    await createListing({
        name: `${newListing.type} at ${newListing.address}`,
        address: newListing.address,
        price: Number(newListing.price),
        type: newListing.type as any,
        imageUrls: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'],
        energyClass: 'A',
        size: 80,
        description: 'New listing',
        bedrooms: 2,
        petsAllowed: true,
        ownerId: user.id
    });
    setNewListing({ address: '', price: '', type: 'apartment' });
    alert('Listing created and published to HomieSearch!');
    setRefresh(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M16.338 13.04l1.455-1.455a6.75 6.75 0 01-9-9l1.455 1.455a6.75 6.75 0 01-9 9l-1.455 1.455m3.375-3.375l-4.5 4.5c-.621.621-.621 1.626 0 2.25.621.621 1.626.621 2.25 0l4.5-4.5m3.375-3.375l4.5-4.5c.621-.621.621-1.626 0-2.25-.621-.621-1.626-.621-2.25 0l-4.5 4.5m-3.375 3.375l-2.25 2.25" />
             </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin<span className="text-slate-400">Home</span></h1>
          <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300 uppercase tracking-wider">{user.role}</span>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">Welcome, {user.name}</span>
            <button onClick={onLogout} className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors">Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-2 hidden md:block">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                Dashboard & Maintenance
            </button>
            {user.role === 'admin' && (
                <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    User Management
                </button>
            )}
            {(user.role === 'admin' || user.role === 'owner') && (
                <button onClick={() => setActiveTab('listings')} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'listings' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Create Listing
                </button>
            )}
        </aside>

        {/* Workspace */}
        <main className="flex-1 overflow-y-auto p-8">
            
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
                        <span className="text-sm text-slate-500">Updated just now</span>
                    </div>

                    {/* Stats Cards (Admin Only) */}
                    {user.role === 'admin' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-slate-500 text-sm">Total Listings</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.totalListings}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-slate-500 text-sm">Active Maintenance</p>
                                <p className="text-3xl font-bold text-orange-600">{stats.activeMaintenance}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-slate-500 text-sm">Total Users</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
                            </div>
                        </div>
                    )}

                    {/* Maintenance Tickets */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Maintenance Requests</h3>
                        {tickets.length === 0 ? (
                            <p className="text-slate-500 italic">No active requests.</p>
                        ) : (
                            <div className="grid gap-4">
                                {tickets.map(ticket => (
                                    <div key={ticket.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-slate-800">{ticket.title}</h4>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide 
                                                    ${ticket.status === 'open' ? 'bg-red-100 text-red-700' : 
                                                      ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                    {ticket.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600">{ticket.description}</p>
                                            <p className="text-xs text-slate-400 mt-2">Listing ID: {ticket.listingId} • Reported: {new Date(ticket.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        
                                        {(user.role === 'contractor' || user.role === 'admin') && (
                                            <div className="flex gap-2">
                                                {ticket.status !== 'resolved' && (
                                                    <>
                                                        {ticket.status === 'open' && (
                                                            <button 
                                                                onClick={() => handleStatusChange(ticket.id, 'pending')}
                                                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                                            >
                                                                Start Work
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleStatusChange(ticket.id, 'resolved')}
                                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                        >
                                                            Mark Resolved
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'users' && user.role === 'admin' && (
                <div className="max-w-xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                    <h2 className="text-xl font-bold mb-4">Onboard New User</h2>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Full Name</label>
                            <input required type="text" className="w-full border rounded p-2" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input required type="email" className="w-full border rounded p-2" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Role</label>
                            <select className="w-full border rounded p-2" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                                <option value="contractor">Contractor</option>
                                <option value="owner">Owner</option>
                                <option value="broker">Broker</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded font-medium hover:bg-slate-800">Send Invite</button>
                    </form>
                </div>
            )}

            {activeTab === 'listings' && (
                <div className="max-w-xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                    <h2 className="text-xl font-bold mb-4">Create New Listing</h2>
                    <form onSubmit={handleCreateListing} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Address</label>
                            <input required type="text" className="w-full border rounded p-2" value={newListing.address} onChange={e => setNewListing({...newListing, address: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Monthly Price (€)</label>
                            <input required type="number" className="w-full border rounded p-2" value={newListing.price} onChange={e => setNewListing({...newListing, price: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select className="w-full border rounded p-2" value={newListing.type} onChange={e => setNewListing({...newListing, type: e.target.value})}>
                                <option value="apartment">Apartment</option>
                                <option value="house">House</option>
                                <option value="studio">Studio</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded font-medium hover:bg-slate-800">Publish Listing</button>
                    </form>
                </div>
            )}

        </main>
      </div>
    </div>
  );
};

export default ManagementPortal;
