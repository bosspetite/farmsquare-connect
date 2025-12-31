import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Star } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { getAppState, formatNaira } from '@/lib/store';
import { GradeType } from '@/types';

const commodityFilters = ['All', 'Maize', 'Cassava', 'Rice', 'Yam', 'Sorghum'];
const gradeFilters: (GradeType | 'All')[] = ['All', 'A', 'B', 'C'];

const BuyerMarketplace = () => {
  const navigate = useNavigate();
  const state = getAppState();
  const [search, setSearch] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState<GradeType | 'All'>('All');

  const listings = state.listings.filter(l => {
    if (l.status !== 'Active') return false;
    if (search && !l.commodity.toLowerCase().includes(search.toLowerCase())) return false;
    if (commodityFilter !== 'All' && l.commodity !== commodityFilter) return false;
    if (gradeFilter !== 'All' && l.grade !== gradeFilter) return false;
    return true;
  });

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">Marketplace</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search produce..."
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {commodityFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setCommodityFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  commodityFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {gradeFilters.map((grade) => (
              <button
                key={grade}
                onClick={() => setGradeFilter(grade)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  gradeFilter === grade ? 'bg-farm-brown text-foreground' : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {grade === 'All' ? 'All Grades' : `Grade ${grade}`}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <p className="text-sm text-muted-foreground">{listings.length} listings found</p>

        {/* Listings Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => navigate(`/buyer/listings/${listing.id}`)}
              className="farm-card-interactive cursor-pointer"
            >
              <div className="w-full h-32 rounded-xl bg-muted mb-4 flex items-center justify-center overflow-hidden">
                {listing.photos[0] ? (
                  <img src={listing.photos[0]} alt={listing.commodity} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🌽</span>
                )}
              </div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{listing.commodity}</h3>
                  <p className="text-sm text-muted-foreground">{listing.quantityKg}kg available</p>
                </div>
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                  Grade {listing.grade}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <MapPin className="w-4 h-4" />
                <span>{listing.region}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <p className="text-lg font-bold text-primary">{formatNaira(listing.pricePerKg)}/kg</p>
                <p className="text-sm text-muted-foreground">{listing.farmerName}</p>
              </div>
            </div>
          ))}
        </div>

        {listings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings match your filters</p>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerMarketplace;
