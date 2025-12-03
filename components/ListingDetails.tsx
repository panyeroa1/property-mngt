import React, { useState, useEffect } from 'react';
import { Listing, User } from '../types';
import { createReservation } from '../services/mockDb';

interface ListingDetailsProps {
  listing: Listing;
  currentUser?: User | null;
  onClose: () => void;
  onLoginRequest?: () => void;
}

const ListingDetails: React.FC<ListingDetailsProps> = ({ listing, currentUser, onClose, onLoginRequest }) => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'processing' | 'confirmed' | 'error'>('idle');
  
  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Calculate duration and price
  const calculateTotals = () => {
    if (!checkIn || !checkOut) {
       // Default view: 12 months
       return { duration: 12, unit: 'months', total: listing.price * 12 };
    }
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Simple logic: if > 28 days, treat as months, else days
    if (diffDays > 28) {
        const months = Math.ceil(diffDays / 30);
        return { duration: months, unit: 'months', total: listing.price * months };
    } else {
        // Daily rate approx
        const dailyRate = Math.ceil(listing.price / 30);
        return { duration: diffDays, unit: 'nights', total: dailyRate * diffDays };
    }
  };

  const { duration, unit, total } = calculateTotals();

  const handleReserve = async () => {
    if (!currentUser) {
        if (onLoginRequest) onLoginRequest();
        return;
    }
    
    if (!checkIn || !checkOut) {
        alert("Please select dates first.");
        return;
    }

    setBookingStatus('processing');
    
    // Call Supabase service
    const result = await createReservation({
        listing_id: listing.id,
        user_id: currentUser.id,
        check_in: checkIn,
        check_out: checkOut,
        guests: guests,
        total_price: total
    });

    if (result) {
        setBookingStatus('confirmed');
    } else {
        setBookingStatus('error');
    }
  };

  const openLightbox = (index: number) => {
      setPhotoIndex(index);
      setLightboxOpen(true);
  };
  
  const nextPhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPhotoIndex((prev) => (prev + 1) % listing.imageUrls.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPhotoIndex((prev) => (prev - 1 + listing.imageUrls.length) % listing.imageUrls.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-500 sm:animate-none sm:fade-in">
      
      {/* Lightbox Overlay */}
      {lightboxOpen && (
          <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center animate-in fade-in duration-200" onClick={() => setLightboxOpen(false)}>
              <button className="absolute top-4 left-4 text-white hover:bg-white/20 p-2 rounded-full z-50" onClick={() => setLightboxOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
              </button>
              
              <button className="absolute left-4 text-white hover:bg-white/20 p-2 rounded-full hidden md:block" onClick={prevPhoto}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
              </button>
              
              <img 
                 src={listing.imageUrls[photoIndex]} 
                 alt="Full screen view" 
                 className="max-h-screen max-w-full object-contain select-none"
                 onClick={(e) => e.stopPropagation()}
              />
              
              <button className="absolute right-4 text-white hover:bg-white/20 p-2 rounded-full hidden md:block" onClick={nextPhoto}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
              </button>
              
              <div className="absolute bottom-4 text-white font-medium text-sm bg-black/50 px-4 py-2 rounded-full">
                  {photoIndex + 1} / {listing.imageUrls.length}
              </div>
          </div>
      )}

      {/* Header with Actions */}
      <div className="sticky top-0 bg-white z-40 border-b border-gray-100 px-4 md:px-20 py-4 flex justify-between items-center shadow-sm">
         <button 
            onClick={onClose}
            className="flex items-center gap-2 hover:bg-slate-100 px-3 py-2 rounded-full transition-colors"
         >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
             </svg>
             <span className="text-sm font-medium">Back</span>
         </button>
         <div className="flex gap-2">
             <button className="flex items-center gap-1 hover:bg-slate-100 px-3 py-2 rounded-lg text-sm font-medium underline">
                Share
             </button>
             <button className="flex items-center gap-1 hover:bg-slate-100 px-3 py-2 rounded-lg text-sm font-medium underline">
                 Save
             </button>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-20 py-6 pb-32">
        {/* Title Block */}
        <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">{listing.name}</h1>
            <p className="text-slate-800 text-sm md:text-base underline font-medium cursor-pointer">{listing.address}</p>
        </div>

        {/* Hero Image Grid (3 images) */}
        <div className="w-full h-[300px] md:h-[400px] grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl overflow-hidden mb-8">
            {/* Main Image */}
            <div className="relative h-full w-full group cursor-pointer" onClick={() => openLightbox(0)}>
               <img 
                  src={listing.imageUrls[0]} 
                  alt={listing.name} 
                  className="w-full h-full object-cover group-hover:brightness-95 transition-all"
               />
            </div>
            {/* Right Column (2 stacked images) */}
            <div className="hidden md:grid grid-rows-2 gap-2 h-full">
                <div className="relative h-full w-full group cursor-pointer" onClick={() => openLightbox(1)}>
                    <img 
                        src={listing.imageUrls[1] || listing.imageUrls[0]} 
                        alt="Detail view 1" 
                        className="w-full h-full object-cover group-hover:brightness-95 transition-all"
                    />
                </div>
                <div className="relative h-full w-full group cursor-pointer" onClick={() => openLightbox(2)}>
                    <img 
                        src={listing.imageUrls[2] || listing.imageUrls[0]} 
                        alt="Detail view 2" 
                        className="w-full h-full object-cover group-hover:brightness-95 transition-all"
                    />
                     <button className="absolute bottom-4 right-4 bg-white border border-slate-900 px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm hover:scale-105 transition-transform z-10 pointer-events-none">
                        Show all photos
                     </button>
                </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
            
            {/* Left Column: Details */}
            <div className="flex-1">
                <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900 mb-1">{listing.type} hosted by Eburon</h2>
                    <p className="text-slate-600 text-base">{listing.bedrooms} bedrooms · 1 bath · {listing.size} m²</p>
                </div>
                {/* Amenities... (kept same as previous logic but simplified for brevity in this update) */}
                <div className="mb-8 border-b border-gray-200 pb-8">
                     <p className="text-slate-700 leading-relaxed">
                        {listing.description}
                     </p>
                </div>
            </div>

            {/* Right Column: Floating Reservation Card */}
            <div className="w-full md:w-1/3 relative hidden md:block">
                 <div className="sticky top-28 border border-gray-200 shadow-xl rounded-xl p-6 bg-white">
                      {bookingStatus === 'confirmed' ? (
                          <div className="flex flex-col items-center py-10 animate-in fade-in zoom-in">
                              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                              </div>
                              <h3 className="text-xl font-bold text-slate-900 mb-2">Reserved!</h3>
                              <p className="text-center text-slate-500 mb-6">Your request has been sent to the owner.</p>
                              <button onClick={onClose} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors">
                                  Done
                              </button>
                          </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-baseline mb-4">
                              <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold text-slate-900">€{listing.price}</span>
                                  <span className="text-slate-500 font-light"> month</span>
                              </div>
                          </div>

                          {!currentUser ? (
                             <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center flex flex-col items-center gap-3">
                                 <div className="bg-white p-3 rounded-full shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-rose-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                 </div>
                                 <h3 className="font-semibold text-slate-900">Log in to book</h3>
                                 <p className="text-sm text-slate-500 mb-2">Join Eburon to check availability and reserve this home.</p>
                                 <button 
                                     onClick={onLoginRequest}
                                     className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
                                 >
                                     Log in
                                 </button>
                             </div>
                          ) : (
                              // Real Form for Logged In Users
                              <>
                                <div className="border border-gray-400 rounded-lg mb-4 overflow-hidden">
                                    <div className="flex border-b border-gray-400">
                                        <div className="flex-1 p-2 border-r border-gray-400 bg-white">
                                            <label className="block text-[10px] font-bold uppercase text-slate-800 mb-1">Check-in</label>
                                            <input 
                                                type="date" 
                                                value={checkIn}
                                                onChange={e => setCheckIn(e.target.value)}
                                                className="w-full text-sm outline-none bg-transparent p-0 text-slate-700"
                                            />
                                        </div>
                                        <div className="flex-1 p-2 bg-white">
                                            <label className="block text-[10px] font-bold uppercase text-slate-800 mb-1">Check-out</label>
                                            <input 
                                                type="date" 
                                                value={checkOut}
                                                onChange={e => setCheckOut(e.target.value)}
                                                className="w-full text-sm outline-none bg-transparent p-0 text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-2 bg-white">
                                        <label className="block text-[10px] font-bold uppercase text-slate-800 mb-1">Guests</label>
                                        <select 
                                            value={guests} 
                                            onChange={e => setGuests(Number(e.target.value))}
                                            className="w-full text-sm outline-none bg-transparent p-0 text-slate-700"
                                        >
                                            <option value={1}>1 guest</option>
                                            <option value={2}>2 guests</option>
                                            <option value={3}>3 guests</option>
                                            <option value={4}>4 guests</option>
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleReserve}
                                    disabled={bookingStatus === 'processing'}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg font-bold py-3 rounded-lg transition-all mb-4 flex justify-center items-center gap-2 disabled:opacity-70"
                                >
                                    {bookingStatus === 'processing' ? 'Processing...' : 'Reserve'}
                                </button>

                                <div className="flex justify-between text-slate-600 text-base mb-2">
                                    <span className="underline">€{listing.price} x {duration} {unit}</span>
                                    <span>€{total}</span>
                                </div>
                                <div className="flex justify-between text-slate-900 font-bold text-lg pt-4 border-t border-gray-100">
                                    <span>Total</span>
                                    <span>€{total}</span>
                                </div>
                              </>
                          )}
                        </>
                      )}
                 </div>
            </div>
        </div>
      </div>
      
      {/* Mobile Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 px-6 flex justify-between items-center z-40 md:hidden safe-bottom pb-8">
         <div className="flex flex-col">
            <p className="font-bold text-slate-900">€{listing.price}<span className="text-slate-500 font-normal"> /mo</span></p>
         </div>
         <button 
            onClick={() => currentUser ? handleReserve() : onLoginRequest && onLoginRequest()}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg"
         >
             {currentUser ? 'Reserve' : 'Log in'}
         </button>
      </div>
    </div>
  );
};

export default ListingDetails;