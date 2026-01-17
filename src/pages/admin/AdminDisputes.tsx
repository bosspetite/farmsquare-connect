import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Search, Eye, CheckCircle, XCircle, Clock, Filter, User, Package, FileText } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllDisputes, getAppState, updateDisputeStatus, formatDate, formatTimeAgo, formatNaira } from '@/lib/store';
import { Dispute, DisputeStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AdminDisputes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = getAppState();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<DisputeStatus | 'all'>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [outcome, setOutcome] = useState<'buyer_favor' | 'farmer_favor' | 'partial' | 'dismissed'>('dismissed');

  const allDisputes = getAllDisputes();
  
  const filteredDisputes = allDisputes.filter(dispute => {
    const matchesSearch = 
      dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.raisedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || dispute.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: allDisputes.length,
    Open: allDisputes.filter(d => d.status === 'Open').length,
    UnderReview: allDisputes.filter(d => d.status === 'UnderReview').length,
    Resolved: allDisputes.filter(d => d.status === 'Resolved').length,
    Closed: allDisputes.filter(d => d.status === 'Closed').length,
  };

  const getDisputeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quality: 'Quality Issue',
      quantity: 'Quantity Mismatch',
      delivery: 'Delivery Problem',
      payment: 'Payment Issue',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const handleResolve = () => {
    if (!selectedDispute || !resolution.trim()) {
      toast({
        title: 'Resolution required',
        description: 'Please provide a resolution for this dispute',
        variant: 'destructive'
      });
      return;
    }

    if (!user) return;

    updateDisputeStatus(selectedDispute.id, 'Resolved', {
      resolvedBy: user.id,
      resolution: resolution,
      outcome: outcome,
    });

    toast({
      title: 'Dispute resolved',
      description: 'The dispute has been marked as resolved.'
    });

    setShowResolutionModal(false);
    setSelectedDispute(null);
    setResolution('');
    setOutcome('dismissed');
    setTimeout(() => window.location.reload(), 500);
  };

  const handleClose = (dispute: Dispute) => {
    if (window.confirm('Are you sure you want to close this dispute?')) {
      updateDisputeStatus(dispute.id, 'Closed');
      toast({ title: 'Dispute closed' });
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const getOrderInfo = (orderId: string) => {
    const order = state.orders.find(o => o.id === orderId);
    return order;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Dispute Management</h1>
          <p className="text-muted-foreground">Review and resolve order disputes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-foreground">{statusCounts.all}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-warning">{statusCounts.Open}</p>
            <p className="text-sm text-muted-foreground">Open</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-info">{statusCounts.UnderReview}</p>
            <p className="text-sm text-muted-foreground">Under Review</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-success">{statusCounts.Resolved}</p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-muted-foreground">{statusCounts.Closed}</p>
            <p className="text-sm text-muted-foreground">Closed</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search disputes by title, description, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as DisputeStatus | 'all')}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="UnderReview">Under Review</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
          <div className="farm-card text-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No disputes found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => {
              const order = getOrderInfo(dispute.orderId);
              return (
                <div
                  key={dispute.id}
                  className="farm-card hover:border-primary/20 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedDispute(dispute);
                    if (dispute.status === 'Open' || dispute.status === 'UnderReview') {
                      setShowResolutionModal(true);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{dispute.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {dispute.raisedByName} ({dispute.raisedByRole}) • {getDisputeTypeLabel(dispute.type)}
                          </p>
                        </div>
                        <StatusPill 
                          status={dispute.status === 'Open' ? 'Pending' : 
                                  dispute.status === 'UnderReview' ? 'Processing' :
                                  dispute.status === 'Resolved' ? 'Delivered' : 'Cancelled'} 
                        />
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{dispute.description}</p>

                      {order && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            <span>{order.commodity} • {order.quantityKg}kg</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{formatNaira(order.amount)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Order: {order.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      )}

                      {dispute.evidence && dispute.evidence.photos && dispute.evidence.photos.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {dispute.evidence.photos.slice(0, 3).map((photo, i) => (
                            <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                              <img src={photo} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {dispute.evidence.photos.length > 3 && (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border">
                              <span className="text-xs text-muted-foreground">+{dispute.evidence.photos.length - 3}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {dispute.resolution && (
                        <div className="p-3 bg-farm-success/10 border border-farm-success/20 rounded-lg mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-farm-success" />
                            <span className="text-sm font-medium text-foreground">Resolved</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">Outcome: {dispute.resolution.outcome.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{dispute.resolution.resolution}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Resolved {formatTimeAgo(dispute.resolution.resolvedAt)}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Raised {formatTimeAgo(dispute.createdAt)}</span>
                        {dispute.status === 'Open' || dispute.status === 'UnderReview' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDispute(dispute);
                                setShowResolutionModal(true);
                              }}
                              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClose(dispute);
                              }}
                              className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80"
                            >
                              Close
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/orders`);
                            }}
                            className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolution Modal */}
        <Modal
          isOpen={showResolutionModal}
          onClose={() => {
            setShowResolutionModal(false);
            setSelectedDispute(null);
            setResolution('');
            setOutcome('dismissed');
          }}
          title="Resolve Dispute"
        >
          {selectedDispute && (
            <div className="space-y-4">
              <div>
                <Label>Dispute Details</Label>
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium text-foreground mb-1">{selectedDispute.title}</p>
                  <p className="text-muted-foreground text-xs">{selectedDispute.description}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="outcome">Resolution Outcome *</Label>
                <Select value={outcome} onValueChange={(value) => setOutcome(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer_favor">In Buyer's Favor</SelectItem>
                    <SelectItem value="farmer_favor">In Farmer's Favor</SelectItem>
                    <SelectItem value="partial">Partial Resolution</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="resolution">Resolution Details *</Label>
                <textarea
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Provide detailed resolution and any actions taken..."
                  className="w-full min-h-[120px] px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowResolutionModal(false);
                    setSelectedDispute(null);
                    setResolution('');
                    setOutcome('dismissed');
                  }}
                  className="flex-1 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Resolve Dispute
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminDisputes;
