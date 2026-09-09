import React, { useState } from 'react';
import { Sparkles, Maximize2, X, ChevronLeft, ChevronRight, Image as ImageIcon, Star, MapPin } from 'lucide-react';

const galleryPhotos = [
  {
    id: 1,
    category: 'Resort & Pool',
    title: 'Infinity Oceanview Pool',
    subtitle: 'Main Resort Deck',
    image: '/images/resort_pool.png',
    tag: 'Popular'
  },
  {
    id: 2,
    category: 'Resort & Pool',
    title: 'Urban Tadka Exterior',
    subtitle: 'Tropical Gardens & Facade',
    image: '/images/resort_exterior.png',
    tag: '5 Star'
  },
  {
    id: 3,
    category: 'Resort & Pool',
    title: 'Grand Marble Lobby Lounge',
    subtitle: '24/7 Concierge Desk',
    image: '/images/resort_lobby.png',
    tag: 'Lobby'
  },
  {
    id: 4,
    category: 'Luxury Suites',
    title: 'Presidential Ocean Suite',
    subtitle: 'King Bed & Balcony View',
    image: '/images/room_suite.png',
    tag: 'VIP'
  },
  {
    id: 5,
    category: 'Dining & Lounge',
    title: 'Urban Tadka Fine Dining',
    subtitle: 'International Gourmet Buffet',
    image: '/images/resort_dining.png',
    tag: 'Dining'
  },
  {
    id: 6,
    category: 'Spa & Wellness',
    title: 'Hydrotherapy & Wellness Spa',
    subtitle: 'Aromatherapy & Massage',
    image: '/images/resort_spa.png',
    tag: 'Wellness'
  },
  {
    id: 7,
    category: 'Luxury Suites',
    title: 'Deluxe King Bedroom',
    subtitle: 'Ambient Lighting Suite',
    image: '/images/room_deluxe.png',
    tag: 'Deluxe'
  },
  {
    id: 8,
    category: 'Luxury Suites',
    title: 'Executive Single Sanctuary',
    subtitle: 'Cozy Modern Business Layout',
    image: '/images/room_single.png',
    tag: 'Comfort'
  },
  {
    id: 9,
    category: 'Dining & Lounge',
    title: 'Sunset Bar & Lounge',
    subtitle: 'Cocktails & Live Ambient Music',
    image: '/images/hotel_lobby_blur.png',
    tag: 'Nightlife'
  },
  {
    id: 10,
    category: 'Resort & Pool',
    title: 'Private Beach Cabana',
    subtitle: 'Oceanfront Sunset Sunbeds',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    tag: 'Beach'
  },
  {
    id: 11,
    category: 'Dining & Lounge',
    title: 'Rooftop Sky Dining Terrace',
    subtitle: '360 Panoramic View Restaurant',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    tag: 'Rooftop'
  },
  {
    id: 12,
    category: 'Luxury Suites',
    title: 'Royal Villa Private Lounge',
    subtitle: 'Duplex Penthouse Living Area',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    tag: 'Penthouse'
  }
];

const categories = ['All Photos', 'Resort & Pool', 'Luxury Suites', 'Dining & Lounge', 'Spa & Wellness'];

const HotelGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Photos');
  const [activePhotoModalIndex, setActivePhotoModalIndex] = useState(null);

  const filteredPhotos = selectedCategory === 'All Photos' 
    ? galleryPhotos 
    : galleryPhotos.filter(p => p.category === selectedCategory);

  const openLightbox = (index) => {
    setActivePhotoModalIndex(index);
  };

  const closeLightbox = () => {
    setActivePhotoModalIndex(null);
  };

  const handleNextPhoto = () => {
    if (activePhotoModalIndex === null) return;
    setActivePhotoModalIndex((prev) => (prev + 1) % filteredPhotos.length);
  };

  const handlePrevPhoto = () => {
    if (activePhotoModalIndex === null) return;
    setActivePhotoModalIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  const activePhoto = activePhotoModalIndex !== null && filteredPhotos[activePhotoModalIndex] 
    ? filteredPhotos[activePhotoModalIndex] 
    : null;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl shadow-sm">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-[#d4e4fa] tracking-tight font-serif">
              Hotel Photo Showcase
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
              7-Star Luxury Gallery
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore high-resolution glimpses of Urban Tadka, infinity oceanview pools, fine dining & presidential royal suites.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setActivePhotoModalIndex(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-slate-100 dark:bg-[#0b1526] text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/80 dark:border-slate-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Photos Masonry/Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo, idx) => (
          <div
            key={photo.id}
            onClick={() => openLightbox(idx)}
            className="group relative h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer border border-slate-200/50 dark:border-neutral-800/80 bg-slate-900"
          >
            {/* Image */}
            <img
              src={photo.image}
              alt={photo.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-95 group-hover:opacity-100"
              loading="lazy"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

            {/* Top Tag Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30 shadow-md">
                {photo.tag}
              </span>
            </div>

            {/* Expand Icon */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-amber-500">
              <Maximize2 className="w-4 h-4" />
            </div>

            {/* Bottom Details */}
            <div className="absolute bottom-3 left-3 right-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                {photo.category}
              </span>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-tight mt-0.5">
                {photo.title}
              </h3>
              <p className="text-[11px] text-slate-300 font-medium line-clamp-1 mt-0.5 opacity-90">
                {photo.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Fullscreen Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-300">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                {activePhoto.tag}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Photo {activePhotoModalIndex + 1} of {filteredPhotos.length}
              </span>
            </div>
            <button
              onClick={closeLightbox}
              className="p-2.5 bg-white/10 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Image Container */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            {/* Prev Button */}
            <button
              onClick={handlePrevPhoto}
              className="absolute left-2 sm:left-6 z-10 p-3 bg-white/10 hover:bg-amber-500 text-white rounded-full transition-all cursor-pointer backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={activePhoto.image}
              alt={activePhoto.title}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300"
            />

            {/* Next Button */}
            <button
              onClick={handleNextPhoto}
              className="absolute right-2 sm:right-6 z-10 p-3 bg-white/10 hover:bg-amber-500 text-white rounded-full transition-all cursor-pointer backdrop-blur-md"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Footer Caption */}
          <div className="text-center bg-white/5 backdrop-blur-md p-4 rounded-2xl max-w-xl mx-auto w-full border border-white/10">
            <h3 className="text-lg font-bold text-white font-serif">
              {activePhoto.title}
            </h3>
            <p className="text-xs text-amber-300 mt-0.5 font-medium">
              {activePhoto.subtitle} • Urban Tadka
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelGallery;
