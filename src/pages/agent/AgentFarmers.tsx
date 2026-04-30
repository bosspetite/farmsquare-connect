import React, { useEffect, useMemo, useState } from 'react';
import { Users, Search, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { formatDate } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { AgentFarmerSummary, getFarmersForAgent } from '@/services/agentService';
import { useAuth } from '@/hooks/useAuth';

const AgentFarmers = () => {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<AgentFarmerSummary[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFarmers = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getFarmersForAgent(user?.id);
      console.log('[AgentFarmers] Loaded farmers', { count: data.length });
      setFarmers(data);
    } catch (error) {
      console.error('[AgentFarmers] Failed to load farmers', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load farmers from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFarmers();
  }, [user]);

  const filteredFarmers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return farmers;
    }

    return farmers.filter(
      (farmer) =>
        farmer.name.toLowerCase().includes(query) ||
        farmer.region.toLowerCase().includes(query) ||
        farmer.phone.toLowerCase().includes(query) ||
        (farmer.email || '').toLowerCase().includes(query)
    );
  }, [farmers, searchQuery]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-farm-success" />;
      case 'IN_REVIEW':
        return <Clock className="w-4 h-4 text-farm-info" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Farmers</h1>
            <p className="text-muted-foreground">View real farmers and their live KYC status from Supabase</p>
          </div>
          <button
            onClick={() => void loadFarmers()}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, region, phone, or email..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-foreground">{filteredFarmers.length}</p>
            <p className="text-sm text-muted-foreground">Total Farmers</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-success">{filteredFarmers.filter((farmer) => farmer.kycStatus === 'APPROVED').length}</p>
            <p className="text-sm text-muted-foreground">Verified</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-info">{filteredFarmers.filter((farmer) => farmer.kycStatus === 'IN_REVIEW').length}</p>
            <p className="text-sm text-muted-foreground">In Review</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-muted-foreground">{filteredFarmers.filter((farmer) => farmer.kycStatus === 'NOT_STARTED').length}</p>
            <p className="text-sm text-muted-foreground">Not Started</p>
          </div>
        </div>

        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">All Farmers</h3>
            <p className="text-sm text-muted-foreground">{filteredFarmers.length} farmer{filteredFarmers.length !== 1 ? 's' : ''}</p>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading farmers from Supabase...</p>
            </div>
          ) : errorMessage ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">Could not load farmers</p>
              <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
              <button onClick={() => void loadFarmers()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                Try Again
              </button>
            </div>
          ) : filteredFarmers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No farmers found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFarmers.map((farmer) => (
                <div key={farmer.id} className="flex items-center justify-between p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20">
                      <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{farmer.name}</p>
                      <p className="text-sm text-muted-foreground">{farmer.phone}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {farmer.region} • Joined {formatDate(farmer.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(farmer.kycStatus)}
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          farmer.kycStatus === 'APPROVED'
                            ? 'bg-farm-success/10 text-farm-success'
                            : farmer.kycStatus === 'IN_REVIEW'
                            ? 'bg-farm-info/10 text-farm-info'
                            : farmer.kycStatus === 'REJECTED'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {farmer.kycStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentFarmers;
