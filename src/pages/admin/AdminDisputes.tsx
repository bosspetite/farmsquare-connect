import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Eye, Loader2, CheckCircle } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getAllDisputes, resolveDispute, getProfile } from '@/services/databaseService';
import { formatDate, formatTimeAgo } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AdminDisputes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [outcome, setOutcome] = useState<'buyer_favor' | 'farmer_favor' | 'partial' | 'dismissed'>('dismissed');
  const [processing, setProcessing] = useState(false);
  const [raisedByNames, setRaisedByNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDisputes = async () => {
      setLoading(true);
      try {
        const allDisputes = await getAllDisputes();
        setDisputes(allDisputes);

        // Load raised by names
        const userIds = [...new Set(allDisputes.map(d => d.raised_by))];
        const nameMap: Record<string, string> = {};
        for (const id of userIds) {
          const prof = await getProfile(id);
          if (prof) nameMap[id] = prof.full_name;
        }
        setRaisedByNames(nameMap);
      } catch (err: any) {
        console.error('Error loading disputes:', err);
        toast({ title: 'Failed to load disputes', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadDisputes();
  }, []);

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = 
      dispute.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      raisedByNames[dispute.raised_by]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.order_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || dispute.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleResolve = async () => {
    if (!selectedDispute || !user || !resolution.trim()) {
      toast({ title: 'Resolution text required', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    try {
      const success = await resolveDispute(selectedDispute.id, user.id, resolution, outcome);
      if (success) {
        toast({ title: 'Dispute resolved', description: 'The dispute has been resolved successfully.' });
        setShowResolutionModal(false);
        setResolution('');
        // Reload disputes
        const allDisputes = await getAllDisputes();
        setDisputes(allDisputes);
      } else {
        toast({ title: 'Failed to resolve dispute', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error resolving dispute', variant: 'destructive' });
    } finally {
      setProcessing(false);
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
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Dispute Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Review and resolve order disputes</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search disputes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="UnderReview">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Disputes List */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">All Disputes</h3>
            <p className="text-sm text-muted-foreground">{filteredDisputes.length} dispute{filteredDisputes.length !== 1 ? 's' : ''}</p>
          </div>
          {filteredDisputes.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No disputes found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDisputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <p className="font-semibold text-foreground text-sm sm:text-base">{dispute.title}</p>
                      <StatusPill status={dispute.status} />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 line-clamp-2">
                      {dispute.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Raised by {raisedByNames[dispute.raised_by] || 'Unknown'} • {formatTimeAgo(dispute.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDispute(dispute);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispute Details Modal */}
        {selectedDispute && (
          <Modal
            isOpen={!!selectedDispute}
            onClose={() => {
              setSelectedDispute(null);
              setShowResolutionModal(false);
            }}
            title={selectedDispute.title}
          >
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <StatusPill status={selectedDispute.status} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <p className="text-sm font-medium text-foreground capitalize">{selectedDispute.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Raised By</p>
                    <p className="text-sm font-medium text-foreground">{raisedByNames[selectedDispute.raised_by] || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                    <p className="text-sm font-medium text-foreground">{selectedDispute.order_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground">{selectedDispute.description}</p>
                  </div>
                  {selectedDispute.resolution && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Resolution</p>
                      <p className="text-sm text-foreground">{selectedDispute.resolution}</p>
                    </div>
                  )}
                </div>
              </div>
              {selectedDispute.status !== 'Resolved' && selectedDispute.status !== 'Closed' && (
                <button
                  onClick={() => setShowResolutionModal(true)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve Dispute
                </button>
              )}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setSelectedDispute(null);
                    setShowResolutionModal(false);
                  }}
                  className="w-full py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Resolution Modal */}
        {showResolutionModal && selectedDispute && (
          <Modal
            isOpen={showResolutionModal}
            onClose={() => {
              setShowResolutionModal(false);
              setResolution('');
            }}
            title="Resolve Dispute"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Resolution</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Enter resolution details..."
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground min-h-[100px] resize-none"
                  disabled={processing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as any)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground"
                  disabled={processing}
                >
                  <option value="dismissed">Dismissed</option>
                  <option value="buyer_favor">Buyer's Favor</option>
                  <option value="farmer_favor">Farmer's Favor</option>
                  <option value="partial">Partial Resolution</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResolutionModal(false);
                    setResolution('');
                  }}
                  disabled={processing}
                  className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={!resolution.trim() || processing}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Resolve
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDisputes;
