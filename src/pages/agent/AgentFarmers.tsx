import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { getAllProfiles } from '@/services/databaseService';
import { formatDate } from '@/lib/store';
import { Input } from '@/components/ui/input';

const AgentFarmers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadFarmers = async () => {
      setLoading(true);
      try {
        const profiles = await getAllProfiles('farmer');
        setFarmers(profiles);
      } catch (err: any) {
        console.error('Error loading farmers:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFarmers();
  }, []);

  const filteredFarmers = farmers.filter(f => 
    f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.phone?.includes(searchQuery)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-farm-success" />;
      case 'IN_REVIEW':
        return <Clock className="w-4 h-4 text-farm-info" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Farmers</h1>
          <p className="text-muted-foreground">Manage and view all farmers in your region</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, region, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-foreground">{farmers.length}</p>
            <p className="text-sm text-muted-foreground">Total Farmers</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-foreground">{farmers.filter(f => f.kyc_status === 'APPROVED').length}</p>
            <p className="text-sm text-muted-foreground">Verified</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-foreground">{farmers.filter(f => f.kyc_status === 'IN_REVIEW').length}</p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-foreground">{farmers.filter(f => f.kyc_status === 'NOT_STARTED').length}</p>
            <p className="text-sm text-muted-foreground">Not Started</p>
          </div>
        </div>

        {/* Farmers List */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">All Farmers</h3>
            <p className="text-sm text-muted-foreground">{filteredFarmers.length} farmer{filteredFarmers.length !== 1 ? 's' : ''}</p>
          </div>
          {filteredFarmers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No farmers found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFarmers.map((farmer) => (
                <div
                  key={farmer.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{farmer.full_name}</p>
                        {getStatusIcon(farmer.kyc_status || 'NOT_STARTED')}
                      </div>
                      <p className="text-sm text-muted-foreground">{farmer.phone}</p>
                      <p className="text-xs text-muted-foreground">{farmer.state || farmer.address || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Joined {formatDate(farmer.created_at)}</p>
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

