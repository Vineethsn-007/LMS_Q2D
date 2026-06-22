import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import './ReviewCenter.css';

const ReviewCenter = ({ user }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectProposalId, setRejectProposalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewerFeedback, setReviewerFeedback] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const rejectionReasonsList = [
    "Duplicate Course",
    "Unclear Proposal",
    "Insufficient Details",
    "Irrelevant Topic",
    "Unsafe Content",
    "Out of Scope",
    "Other"
  ];

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sf_token');
      const url = `http://localhost:8000/api/reviewer/proposals${activeTab !== 'all' ? `?status_filter=${activeTab}` : ''}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch proposals');
      
      const data = await res.json();
      setProposals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [activeTab]);

  const handleStatusUpdate = async (id, newStatus, extraPayload = {}) => {
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`http://localhost:8000/api/reviewer/proposals/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, ...extraPayload })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      // Refresh the list
      fetchProposals();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const openRejectModal = (id) => {
    setRejectProposalId(id);
    setRejectionReason('');
    setReviewerFeedback('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason) return alert("Please select a rejection reason.");
    
    setRejecting(true);
    await handleStatusUpdate(rejectProposalId, 'rejected', {
      rejection_reason: rejectionReason,
      reviewer_feedback: reviewerFeedback
    });
    setRejecting(false);
    setRejectModalOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="review-center-container">
      <div className="review-header">
        <h2>Review Center</h2>
        
        <div className="review-tabs">
          <button 
            className={`review-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button 
            className={`review-tab ${activeTab === 'ai_flagged' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai_flagged')}
          >
            AI Flagged
          </button>
          <button 
            className={`review-tab ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved
          </button>
          <button 
            className={`review-tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
      
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <RefreshCw className="spin" size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
          Loading proposals...
        </div>
      ) : proposals.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px' }}>
          <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>All caught up!</h3>
          <p>There are no proposals in this category.</p>
        </div>
      ) : (
        <div className="proposals-grid">
          {proposals.map(p => (
            <div key={p.id} className="proposal-card">
              <div className="proposal-card-header">
                <div>
                  <h3 className="proposal-card-title">{p.course_name}</h3>
                  <div className="proposal-card-meta">
                    <img src={p.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.learner_name || 'Anonymous')}&background=random`} alt="Learner" />
                    <span>{p.learner_name || 'Anonymous'}</span>
                    <span>•</span>
                    <span>{p.skill_level}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {formatDate(p.created_at)}</span>
                  </div>
                </div>
                <span className={`status-badge ${p.status}`}>{p.status.replace('_', ' ')}</span>
              </div>

              <div className="ai-analysis-box">
                <div className="ai-analysis-header">
                  <Sparkles size={14} /> AI Analysis
                </div>
                <p className="ai-summary">{p.ai_summary || 'No AI summary generated for this proposal.'}</p>
                
                <div className="ai-metrics">
                  <div className="ai-metric">
                    <span className="ai-metric-label">Category</span>
                    <span className="ai-metric-value">{p.ai_category || 'N/A'}</span>
                  </div>
                  <div className="ai-metric">
                    <span className="ai-metric-label">Risk Level</span>
                    <span className="ai-metric-value" style={{ color: p.risk_level === 'High' ? '#ef4444' : p.risk_level === 'Medium' ? '#f59e0b' : '#10b981' }}>
                      {p.risk_level || 'N/A'}
                    </span>
                  </div>
                  <div className="ai-metric">
                    <span className="ai-metric-label">Demand Score</span>
                    <span className="ai-metric-value">{p.demand_score ? `${p.demand_score}/100` : 'N/A'}</span>
                  </div>
                  <div className="ai-metric">
                    <span className="ai-metric-label">Duplicate</span>
                    <span className="ai-metric-value" style={{ color: p.duplicate_status ? '#ef4444' : '#10b981' }}>
                      {p.duplicate_status ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                
                {(p.status === 'ai_flagged' || p.duplicate_status) && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', color: '#fca5a5', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Warning:</strong> {p.ai_flagged_reason || (p.duplicate_status ? 'High similarity to existing courses.' : 'Flagged by AI.')}
                    </div>
                  </div>
                )}
              </div>

              {/* Show actions only for pending or flagged items */}
              {['pending', 'ai_flagged'].includes(p.status) && (
                <div className="proposal-actions">
                  <button className="action-btn-small btn-approve" onClick={() => handleStatusUpdate(p.id, 'approved')}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button className="action-btn-small btn-changes" onClick={() => handleStatusUpdate(p.id, 'changes_requested')}>
                    <AlertCircle size={16} /> Request Changes
                  </button>
                  <button className="action-btn-small btn-reject" onClick={() => openRejectModal(p.id)}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="rc-modal-overlay">
          <div className="rc-modal">
            <div className="rc-modal-header">
              <h3>Reject Proposal</h3>
              <button className="rc-close-btn" onClick={() => setRejectModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="rc-form-group">
              <label>Reason for Rejection</label>
              <select 
                className="rc-select" 
                value={rejectionReason} 
                onChange={e => setRejectionReason(e.target.value)}
              >
                <option value="">-- Select a reason --</option>
                {rejectionReasonsList.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            
            <div className="rc-form-group">
              <label>Reviewer Feedback (Optional)</label>
              <textarea 
                className="rc-textarea" 
                placeholder="Provide detailed feedback to help the learner improve their proposal..."
                value={reviewerFeedback}
                onChange={e => setReviewerFeedback(e.target.value)}
              />
            </div>
            
            <div className="rc-modal-actions">
              <button className="rc-btn-cancel" onClick={() => setRejectModalOpen(false)}>Cancel</button>
              <button 
                className="rc-btn-submit" 
                onClick={handleRejectSubmit}
                disabled={rejecting || !rejectionReason}
              >
                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCenter;
