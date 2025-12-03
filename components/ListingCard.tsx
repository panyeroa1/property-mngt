import React, { useState } from 'react';
import { Listing } from '../types';

interface ListingCardProps {
  listing: Listing;
  onClick?: (listing: Listing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Mock rating generation based on ID
  const rating = (4 + (parseInt(listing.id) % 10) / 10).toFixed(2);

  return (
    <div 
      onClick={() => onClick && onClick(listing)}
      className="group cursor-pointer flex flex-col gap-2 w-full"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-200">
         {/* Skeleton */}
        <div className={`absolute inset-0 bg-slate-200 animate-pulse z-0 ${isImageLoaded ? 'hidden' : 'block'}`} />
        
        <img 
          src={listing.imageUrls[0]} 
          alt={listing.name} 
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Heart Icon */}
        <button className="absolute top-3 right-3 z-10 text-white/70 hover:scale-110 transition-transform active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 stroke-white stroke-2 fill-black/50">
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
          </svg>
        </button>
        
        {/* Guest Favorite Badge Mock */}
        {listing.energyClass === 'A+' && (
             <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md text-[10px] md:text-xs font-bold text-slate-900 shadow-sm z-10">
                Guest favorite
             </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between items-start">
            <h3 className="font-semibold text-slate-900 truncate text-sm md:text-[15px]">{listing.address.split(',')[0]}</h3>
            <div className="flex items-center gap-1 text-xs md:text-sm font-light text-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-slate-900">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                {rating}
            </div>
        </div>
        
        <p className="text-sm md:text-[15px] text-slate-500 font-light truncate">Hosted by Eburon</p>
        <p className="text-sm md:text-[15px] text-slate-500 font-light truncate hidden sm:block">{listing.size} m² • {listing.bedrooms} beds</p>
        
        <div className="mt-1 flex items-baseline gap-1">
             <span className="font-semibold text-slate-900 text-sm md:text-[15px]">€{listing.price}</span>
             <span className="text-slate-500 font-light text-sm md:text-[15px]">month</span>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;