import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, UserCheck, UserX, Clock, Eye, Package, ShoppingCart, Shield, CheckCircle, XCircle, AlertCircle, Phone, MapPin, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getAllProfiles, getListingsByFarmer, getOrdersByFarmer } from '@/services/databaseService';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/store';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'farmer' | 'buyer' | 'agent'>('all');
  const [filterKYC, setFilterKYC] = useState<'all' | 'NOT_STARTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<Record<string, { listings: number; orders: number }>>({});

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const profiles = await getAllProfiles();
        // Filter out admins from the list
        const nonAdminProfiles = profiles.filter(p => p.role !== 'admin');
        setAllUsers(nonAdminProfiles);

        // Load stats for farmers
        const stats: Record<string, { listings: number; orders: number }> = {};
        for (const user of nonAdminProfiles.filter(u => u.role === 'farmer')) {
          const [listings, orders] = await Promise.all([
            getListingsByFarmer(user.id),
            getOrdersByFarmer(user.id),
          ]);
          stats[user.id] = { listings: listings.length, orders: orders.length };
        }
        setUserStats(stats);
      } catch (err: any) {
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const kycStatus = user.role === 'buyer' ? (user.kyb_status || user.kyc_status) : user.kyc_status;
    const matchesKYC = filterKYC === 'all' || kycStatus === filterKYC;
    
    return matchesSearch && matchesRole && matchesKYC;
  });

  const farmers = allUsers.filter(u => u.role === 'farmer');
  const buyers = allUsers.filter(u => u.role === 'buyer');
  const agents = allUsers.filter(u => u.role === 'agent');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1.5 bg-farm-success/10 text-farm-success rounded-lg text-xs font-medium flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="px-3 py-1.5 bg-farm-info/10 text-farm-info rounded-lg text-xs font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Under Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs font-medium flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">User Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage all platform users</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, phone, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="all">All Roles</option>
            <option value="farmer">Farmers</option>
            <option value="buyer">Buyers</option>
            <option value="agent">Agents</option>
          </select>
          <select
            value={filterKYC}
            onChange={(e) => setFilterKYC(e.target.value as any)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="all">All KYC Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-foreground">{farmers.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Farmers</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-foreground">{buyers.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Buyers</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-foreground">{agents.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Agents</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-foreground">{allUsers.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
          </div>
        </div>

        {/* Users List */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">All Users</h3>
            <p className="text-sm text-muted-foreground">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</p>
          </div>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const kycStatus = user.role === 'buyer' ? (user.kyb_status || user.kyc_status) : user.kyc_status;
                const hasKYCData = kycStatus === 'IN_REVIEW' || kycStatus === 'APPROVED' || kycStatus === 'REJECTED';
                const stats = userStats[user.id] || { listings: 0, orders: 0 };
                
                return (
                  <div
                    key={user.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-card border border-border rounded-xl transition-all ${
                      hasKYCData && kycStatus === 'IN_REVIEW' 
                        ? 'hover:border-primary/20 hover:shadow-md cursor-pointer' 
                        : 'hover:border-border/50'
                    }`}
                    onClick={() => {
                      if (hasKYCData && kycStatus === 'IN_REVIEW') {
                        navigate(`/admin/users/${user.id}/kyc`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/20">
                        <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <p className="font-semibold text-foreground text-sm sm:text-base">{user.full_name}</p>
                          <span className="px-2 sm:px-2.5 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-semibold uppercase tracking-wide">
                            {user.role}
                          </span>
                          {kycStatus === 'IN_REVIEW' && (
                            <span className="px-2 py-0.5 bg-farm-warning/10 text-farm-warning rounded-md text-xs font-medium flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Review Required
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-1.5">
                          <span>{user.phone}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{user.state || user.address || 'N/A'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                          <span>Joined {formatDate(user.created_at)}</span>
                          {user.role === 'farmer' && (
                            <>
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {stats.listings} listing{stats.listings !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="w-3 h-3" />
                                {stats.orders} order{stats.orders !== 1 ? 's' : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex-shrink-0">{getStatusBadge(kycStatus || 'NOT_STARTED')}</div>
                      {hasKYCData && kycStatus === 'IN_REVIEW' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/users/${user.id}/kyc`);
                          }}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-farm-warning text-white rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
                        >
                          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Review KYC</span>
                          <span className="sm:hidden">Review</span>
                        </button>
                      )}
                      {hasKYCData && (kycStatus === 'APPROVED' || kycStatus === 'REJECTED') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/users/${user.id}/kyc`);
                          }}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-muted text-foreground rounded-lg text-xs sm:text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-1.5 sm:gap-2"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">View KYC</span>
                          <span className="sm:hidden">View</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                        className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <Modal
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            title={`${selectedUser.role === 'farmer' ? 'Farmer' : selectedUser.role === 'buyer' ? 'Buyer' : 'User'} Details`}
          >
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{selectedUser.full_name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{selectedUser.role}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{selectedUser.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{selectedUser.state || selectedUser.address || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground capitalize">
                      KYC Status: <span className={`font-medium ${
                        (selectedUser.role === 'buyer' ? (selectedUser.kyb_status || selectedUser.kyc_status) : selectedUser.kyc_status) === 'APPROVED' ? 'text-farm-success' :
                        (selectedUser.role === 'buyer' ? (selectedUser.kyb_status || selectedUser.kyc_status) : selectedUser.kyc_status) === 'REJECTED' ? 'text-destructive' :
                        (selectedUser.role === 'buyer' ? (selectedUser.kyb_status || selectedUser.kyc_status) : selectedUser.kyc_status) === 'IN_REVIEW' ? 'text-farm-info' :
                        'text-muted-foreground'
                      }`}>
                        {(selectedUser.role === 'buyer' ? (selectedUser.kyb_status || selectedUser.kyc_status) : selectedUser.kyc_status || 'NOT_STARTED').replace('_', ' ')}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {selectedUser.role === 'farmer' && (() => {
                const stats = userStats[selectedUser.id] || { listings: 0, orders: 0 };
                
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">Listings</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stats.listings}</p>
                    </div>
                    <div className="p-4 bg-farm-success/5 border border-farm-success/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="w-5 h-5 text-farm-success" />
                        <span className="text-sm font-medium text-foreground">Orders</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stats.orders}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
