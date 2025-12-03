import React from 'react';
import { Listing } from '../types';

interface ListingDetailsProps {
  listing: Listing;
  onClose: () => void;
}

const ListingDetails: React.FC<ListingDetailsProps> = ({ listing, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-500 sm:animate-none sm:fade-in">
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Share
             </button>
             <button className="flex items-center gap-1 hover:bg-slate-100 px-3 py-2 rounded-lg text-sm font-medium underline">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                 </svg>
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

        {/* Hero Image - Airbnb Single/Grid */}
        <div className="w-full aspect-video md:aspect-[2/1] bg-slate-200 rounded-xl overflow-hidden mb-8 relative">
           <img 
              src={listing.imageUrls[0]} 
              alt={listing.name} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
           />
           <button className="absolute bottom-4 right-4 bg-white border border-slate-900 px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm hover:scale-105 transition-transform">
               Show all photos
           </button>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
            
            {/* Left Column: Details */}
            <div className="flex-1">
                <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900 mb-1">{listing.type} hosted by Eburon</h2>
                    <p className="text-slate-600 text-base">{listing.bedrooms} bedrooms · 1 bath · {listing.size} m²</p>
                </div>

                <div className="border-b border-gray-200 pb-6 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                        <svg className="w-6 h-6 text-slate-700 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M16.338 13.04l1.455-1.455a6.75 6.75 0 01-9-9l1.455 1.455a6.75 6.75 0 01-9 9l-1.455 1.455m3.375-3.375l-4.5 4.5c-.621.621-.621 1.626 0 2.25.621.621 1.626.621 2.25 0l4.5-4.5m3.375-3.375l4.5-4.5c.621-.621.621-1.626 0-2.25-.621-.621-1.626-.621-2.25 0l-4.5 4.5m-3.375 3.375l-2.25 2.25" /></svg>
                        <div>
                            <h3 className="font-semibold text-slate-900">Dedicated workspace</h3>
                            <p className="text-slate-500 text-sm">A room with wifi that’s well-suited for working.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 mb-4">
                        <svg className="w-6 h-6 text-slate-700 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        <div>
                            <h3 className="font-semibold text-slate-900">Self check-in</h3>
                            <p className="text-slate-500 text-sm">Check yourself in with the lockbox.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <svg className="w-6 h-6 text-slate-700 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div>
                            <h3 className="font-semibold text-slate-900">Energy Efficient (EPC {listing.energyClass})</h3>
                            <p className="text-slate-500 text-sm">This home is verified for energy efficiency.</p>
                        </div>
                    </div>
                </div>

                <div className="mb-8 border-b border-gray-200 pb-8">
                     <p className="text-slate-700 leading-relaxed">
                        {listing.description}
                        <br/><br/>
                        Enjoy a stylish experience at this centrally-located place. Modern amenities, close to historical sites, and perfect for long stays.
                     </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-6">What this place offers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-slate-600">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" /></svg>
                            <span>Fast Wifi</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.67.38m-4.5-8.006c-1.558.058-3.149.088-4.773.088-1.623 0-3.215-.03-4.773-.088m9.546.088c-.68.05-1.37.08-2.069.08-1.041 0-2.053-.045-3.033-.11m3.84 8.03c.581.084 1.162.15 1.745.195m0 0a2.18 2.18 0 0 0 1.66-2.18v-4.25m-1.66 2.18a2.18 2.18 0 0 1-1.745-.196m0 0c-.58.128-1.187.23-1.802.3m3.547-2.476v4.652m-13.63 0c-.25-.085-.476-.215-.67-.38m0 0V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m-4.5 8.006c.581.084 1.162.15 1.745.195m0 0a2.18 2.18 0 0 1 1.66-2.18v-4.25m-1.66 2.18a2.18 2.18 0 0 0-1.745-.196m0 0c.58.128 1.187.23 1.802.3" /></svg>
                            <span>Washer</span>
                        </div>
                        {listing.petsAllowed && (
                            <div className="flex items-center gap-3 text-slate-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>
                                <span>Pets allowed</span>
                            </div>
                        )}
                         <div className="flex items-center gap-3 text-slate-600">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                            <span>Kitchen</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Floating Reservation Card */}
            <div className="w-full md:w-1/3 relative hidden md:block">
                 <div className="sticky top-28 border border-gray-200 shadow-xl rounded-xl p-6 bg-white">
                      <div className="flex justify-between items-baseline mb-4">
                          <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-slate-900">€{listing.price}</span>
                              <span className="text-slate-500 font-light"> month</span>
                          </div>
                          <div className="text-sm text-slate-700 underline font-medium">12 reviews</div>
                      </div>

                      <div className="border border-gray-400 rounded-lg mb-4 overflow-hidden">
                           <div className="flex border-b border-gray-400">
                               <div className="flex-1 p-2 border-r border-gray-400">
                                   <label className="block text-[10px] font-bold uppercase text-slate-800">Check-in</label>
                                   <div className="text-sm text-slate-600">Add date</div>
                               </div>
                               <div className="flex-1 p-2">
                                   <label className="block text-[10px] font-bold uppercase text-slate-800">Check-out</label>
                                   <div className="text-sm text-slate-600">Add date</div>
                               </div>
                           </div>
                           <div className="p-2">
                               <label className="block text-[10px] font-bold uppercase text-slate-800">Guests</label>
                               <div className="text-sm text-slate-600">1 guest</div>
                           </div>
                      </div>

                      <button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg transition-colors mb-4">
                          Reserve
                      </button>

                      <p className="text-center text-xs text-slate-500 mb-4">You won't be charged yet</p>

                      <div className="flex justify-between text-slate-600 text-base mb-2">
                          <span className="underline">€{listing.price} x 12 months</span>
                          <span>€{listing.price * 12}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-base mb-4 pb-4 border-b border-gray-200">
                          <span className="underline">Service fee</span>
                          <span>€0</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold text-lg">
                          <span>Total</span>
                          <span>€{listing.price * 12}</span>
                      </div>
                 </div>
            </div>
        </div>
      </div>
      
      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 px-6 flex justify-between items-center z-40 md:hidden safe-bottom pb-8">
         <div>
            <p className="font-bold text-slate-900">€{listing.price}<span className="text-slate-500 font-normal"> /mo</span></p>
            <p className="text-xs text-slate-500 underline">Available now</p>
         </div>
         <button className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg">
             Reserve
         </button>
      </div>
    </div>
  );
};

export default ListingDetails;