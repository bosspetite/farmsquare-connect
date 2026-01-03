import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Star, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { getAppState, formatNaira } from '@/lib/store';
import { GradeType, Listing } from '@/types';

const commodityFilters = ['All', 'Maize', 'Cassava', 'Rice', 'Yam', 'Sorghum'];
const gradeFilters: (GradeType | 'All')[] = ['All', 'A', 'B', 'C'];
const regions = ['All', 'Kaduna', 'Lagos', 'Kano', 'Abuja', 'Rivers', 'Ogun'];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'quantity', label: 'Quantity Available' },
];

type SortOption = 'newest' | 'price-low' | 'price-high' | 'quantity';

const BuyerMarketplace = () => {
  const navigate = useNavigate();
  const state = getAppState();
  const [search, setSearch] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState<GradeType | 'All'>('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Filter listings with enhanced search
  const filteredListings = useMemo(() => {
    let results = state.listings.filter(l => {
      // Only active listings
      if (l.status !== 'Active') return false;
      
      // Enhanced search filter (commodity, farmer name, region, location, grade, price, quantity)
      if (search) {
        const searchLower = search.toLowerCase().trim();
        const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0); // Split into words, remove empty
        
        if (searchTerms.length === 0) return true;
        
        // Check if ALL search terms match somewhere (AND logic across terms)
        const matchesAll = searchTerms.every(term => {
          const matchesCommodity = l.commodity.toLowerCase().includes(term);
          const matchesFarmer = l.farmerName.toLowerCase().includes(term);
          const matchesRegion = l.region.toLowerCase().includes(term);
          const matchesLocation = l.locationLabel.toLowerCase().includes(term);
          const matchesGrade = `grade ${l.grade}`.toLowerCase().includes(term);
          const matchesPrice = formatNaira(l.pricePerKg).toLowerCase().includes(term);
          const matchesQuantity = l.quantityKg.toString().includes(term);
          
          return matchesCommodity || matchesFarmer || matchesRegion || matchesLocation || matchesGrade || matchesPrice || matchesQuantity;
        });
        
        if (!matchesAll) return false;
      }
      
      // Commodity filter
      if (commodityFilter !== 'All' && l.commodity !== commodityFilter) return false;
      
      // Grade filter
      if (gradeFilter !== 'All' && l.grade !== gradeFilter) return false;
      
      // Region filter
      if (regionFilter !== 'All' && l.region !== regionFilter) return false;
      
      // Price range filter
      if (priceMin && l.pricePerKg < parseInt(priceMin)) return false;
      if (priceMax && l.pricePerKg > parseInt(priceMax)) return false;
      
      return true;
    });
    
    // Sort listings
    results.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.pricePerKg - b.pricePerKg;
        case 'price-high':
          return b.pricePerKg - a.pricePerKg;
        case 'quantity':
          return b.quantityKg - a.quantityKg;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    return results;
  }, [state.listings, search, commodityFilter, gradeFilter, regionFilter, priceMin, priceMax, sortBy]);

  const hasActiveFilters = commodityFilter !== 'All' || gradeFilter !== 'All' || regionFilter !== 'All' || priceMin || priceMax || search;

  const clearFilters = () => {
    setSearch('');
    setCommodityFilter('All');
    setGradeFilter('All');
    setRegionFilter('All');
    setPriceMin('');
    setPriceMax('');
  };

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-foreground">Marketplace</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-primary-foreground rounded-full" />}
          </button>
        </div>

        {/* Enhanced Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search produce, farmer, region, location, or grade (e.g., 'Maize Kaduna Grade A')..."
            className="w-full pl-12 pr-12 py-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Search Results Count */}
        {search && (
          <div className="text-sm text-muted-foreground">
            Found <span className="font-semibold text-foreground">{filteredListings.length}</span> listing{filteredListings.length !== 1 ? 's' : ''} matching "{search}"
          </div>
        )}

        {/* Quick Filters */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {commodityFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setCommodityFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  commodityFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {gradeFilters.map((grade) => (
              <button
                key={grade}
                onClick={() => setGradeFilter(grade)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  gradeFilter === grade ? 'bg-farm-brown text-foreground' : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {grade === 'All' ? 'All Grades' : `Grade ${grade}`}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="farm-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Advanced Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Region</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setRegionFilter(region)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      regionFilter === region ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Min Price (₦/kg)</label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-xl text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Max Price (₦/kg)</label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-xl text-foreground"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sort & Results Count */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground text-lg">{filteredListings.length}</span> listing{filteredListings.length !== 1 ? 's' : ''} found
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline mt-1"
              >
                Clear all filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => navigate(`/buyer/listings/${listing.id}`)}
              className="farm-card-interactive cursor-pointer"
            >
              <div className="relative group">
                {/* Image with overlay on hover */}
                <div className="w-full h-48 rounded-xl bg-muted mb-4 flex items-center justify-center overflow-hidden relative">
                  {listing.photos && listing.photos.length > 0 && listing.photos[0] ? (
                    <>
                      <img 
                        src={listing.photos[0]} 
                        alt={listing.commodity} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-emoji')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-emoji w-full h-full flex items-center justify-center bg-muted';
                            const emoji = listing.commodity === 'Maize' ? '🌽' : listing.commodity === 'Rice' ? '🌾' : listing.commodity === 'Cassava' ? '🥔' : listing.commodity === 'Yam' ? '🍠' : '🌾';
                            fallback.innerHTML = `<span class="text-5xl">${emoji}</span>`;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                      {/* Image count badge */}
                      {listing.photos.length > 1 && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-lg text-xs font-medium text-foreground">
                          +{listing.photos.length - 1}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <span className="text-5xl">
                        {listing.commodity === 'Maize' ? '🌽' : listing.commodity === 'Rice' ? '🌾' : listing.commodity === 'Cassava' ? '🥔' : listing.commodity === 'Yam' ? '🍠' : '🌾'}
                      </span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-sm font-medium text-primary-foreground bg-primary px-4 py-2 rounded-xl">
                      View Details
                    </span>
                  </div>
                </div>
                
                {/* Grade Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    listing.grade === 'A' ? 'bg-farm-success/90 text-white' :
                    listing.grade === 'B' ? 'bg-farm-warning/90 text-white' :
                    'bg-farm-brown/90 text-white'
                  }`}>
                    Grade {listing.grade}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg text-foreground mb-1 truncate">{listing.commodity}</h3>
                    <p className="text-sm text-muted-foreground">{listing.quantityKg.toLocaleString()}kg available</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{listing.region}</span>
                  {listing.locationLabel && listing.locationLabel !== `${listing.region} Farm` && (
                    <span className="text-xs">• {listing.locationLabel}</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold text-primary">{formatNaira(listing.pricePerKg)}/kg</p>
                    <p className="text-xs text-muted-foreground">Total: {formatNaira(listing.quantityKg * listing.pricePerKg)}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Farmer</p>
                    <p className="text-sm font-medium text-foreground truncate max-w-[100px]">{listing.farmerName}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No listings found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms'
                : 'No active listings available at the moment'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerMarketplace;
