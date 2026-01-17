import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { getAppState, formatDate } from '@/lib/store';
import { Input } from '@/components/ui/input';

const AgentFarmers = () => {
  const navigate = useNavigate();
  const state = getAppState();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const farmers = state.farmers.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.phone.includes(searchQuery)
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
            <p className="text-2xl font-semibold text-farm-success">{farmers.filter(f => f.kycStatus === 'APPROVED').length}</p>
            <p className="text-sm text-muted-foreground">Verified</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-info">{farmers.filter(f => f.kycStatus === 'IN_REVIEW').length}</p>
            <p className="text-sm text-muted-foreground">In Review</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-muted-foreground">{farmers.filter(f => f.kycStatus === 'NOT_STARTED').length}</p>
            <p className="text-sm text-muted-foreground">Not Started</p>
          </div>
        </div>

        {/* Farmers List */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">All Farmers</h3>
            <p className="text-sm text-muted-foreground">{farmers.length} farmer{farmers.length !== 1 ? 's' : ''}</p>
          </div>
          {farmers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No farmers found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {farmers.map((farmer) => (
                <div
                  key={farmer.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20">
                      <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{farmer.name}</p>
                      <p className="text-sm text-muted-foreground">{farmer.phone}</p>
                      <p className="text-xs text-muted-foreground mt-1">{farmer.region} • Joined {formatDate(farmer.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(farmer.kycStatus)}
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        farmer.kycStatus === 'APPROVED' 
                          ? 'bg-farm-success/10 text-farm-success'
                          : farmer.kycStatus === 'IN_REVIEW'
                          ? 'bg-farm-info/10 text-farm-info'
                          : 'bg-muted text-muted-foreground'
                      }`}>
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
