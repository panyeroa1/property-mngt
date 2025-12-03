import React, { useState, useEffect } from 'react';
import { User, MaintenanceRequest, Listing } from '../types';
import { getMaintenanceRequests, createMaintenanceRequest, getListingById } from '../services/mockDb';

interface TenantPortalProps {
  user: User;
  onLogout: () => void;
}

const TenantPortal: React.FC<TenantPortalProps> = ({ user, onLogout }) => {
  const [rentedListing, setRentedListing] = useState<Listing | null>(null);
  const [tickets, setTickets] = useState<MaintenanceRequest[]>([]);
  const [newTicket, setNewTicket] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
       if (user.rentedListingId) {
           const l = await getListingById(user.rentedListingId);
           setRentedListing(l || null);
       }
       const t = await getMaintenanceRequests('tenant', user.id);
       setTickets(t);
    };
    load();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentedListing) return;
    setIsSubmitting(true);
    await createMaintenanceRequest({
        title: newTicket.title,
        description: newTicket.description,
        tenantId: user.id,
        listingId: rentedListing.id,
        assignedTo: 'contractor1' // Auto-assign for MVP
    });
    setNewTicket({ title: '', description: '' });
    
    // Refresh
    const t = await getMaintenanceRequests('tenant', user.id);
    setTickets(t);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
         <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
            </div>
            <h1 className="font-bold text-xl text-slate-800">Homie<span className="text-indigo-600">Resident</span></h1>
         </div>
         <div className="flex items-center gap-4">
             <span className="text-sm text-slate-600 hidden sm:block">{user.name}</span>
             <button onClick={onLogout} className="text-sm text-slate-500 hover:text-indigo-600 font-medium">Log out</button>
         </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-8">
         
         {/* My Home Section */}
         <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                 <h2 className="absolute bottom-4 left-6 text-white text-2xl font-bold">My Home</h2>
             </div>
             <div className="p-6">
                 {rentedListing ? (
                     <div className="flex flex-col md:flex-row gap-6">
                         <img src={rentedListing.imageUrls[0]} alt="Home" className="w-full md:w-32 h-32 object-cover rounded-lg" />
                         <div>
                             <h3 className="text-xl font-bold text-slate-900">{rentedListing.name}</h3>
                             <p className="text-slate-500">{rentedListing.address}</p>
                             <div className="mt-4 flex gap-2">
                                 <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full">Active Lease</span>
                                 <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">€{rentedListing.price}/mo</span>
                             </div>
                         </div>
                     </div>
                 ) : (
                     <p className="text-slate-500">You do not have an active rental associated with this account.</p>
                 )}
             </div>
         </section>

         {/* Maintenance Request Form */}
         {rentedListing && (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Report an Issue
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="What's the issue? (e.g., Leaking Tap)" 
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newTicket.title}
                        onChange={e => setNewTicket({...newTicket, title: e.target.value})}
                        required
                    />
                    <textarea 
                        placeholder="Describe the problem in detail..." 
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newTicket.description}
                        onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                        required
                    />
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Sending...' : 'Submit Request'}
                    </button>
                </form>
            </section>
         )}

         {/* Maintenance History */}
         <section>
             <h3 className="text-lg font-bold text-slate-900 mb-4">Request History</h3>
             {tickets.length === 0 ? (
                 <p className="text-slate-400 text-sm">No requests found.</p>
             ) : (
                 <div className="space-y-3">
                     {tickets.map(t => (
                         <div key={t.id} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                             <div>
                                 <h4 className="font-semibold text-slate-800">{t.title}</h4>
                                 <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                 t.status === 'open' ? 'bg-slate-100 text-slate-600' :
                                 t.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                 'bg-green-100 text-green-700'
                             }`}>
                                 {t.status}
                             </span>
                         </div>
                     ))}
                 </div>
             )}
         </section>

      </main>
    </div>
  );
};

export default TenantPortal;
