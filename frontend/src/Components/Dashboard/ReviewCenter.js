import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, BarChart2, ArrowUp, ArrowDown, MessageSquare, Award, Edit2, Save } from 'lucide-react';
import './ReviewCenter.css';

const ReviewCenter = ({ user }) => {
  const [viewType, setViewType] = useState('proposals'); // 'proposals' or 'certificates'
  const [proposals, setProposals] = useState([]);
  const [certificateIssues, setCertificateIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectProposalId, setRejectProposalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewerFeedback, setReviewerFeedback] = useState('');
  const [rejecting, setRejecting] = useState(false);
  
  // States for inline editing certificate issues
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [editForm, setEditForm] = useState({ learner_name: '', learner_email: '', course_name: '' });

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
    if (viewType === 'certificates') {
      // Fetch from local storage for certificate issues
      setLoading(true);
      setTimeout(() => {
        const issues = JSON.parse(localStorage.getItem('sf_certificate_issues') || '[]');
        // Filter out resolved if we want, or just show all. We'll show all for now.
        setCertificateIssues(issues);
        setLoading(false);
      }, 300); // Simulate network
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('sf_token');
      const url = `${process.env.REACT_APP_API_URL }/api/reviewer/proposals${activeTab !== 'all' ? `?status_filter=${activeTab}` : ''}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('sf_token');
          localStorage.removeItem('sf_user');
          window.location.reload();
          return;
        }
        throw new Error('Failed to fetch proposals');
      }
      
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
  }, [activeTab, viewType]);

  const handleStatusUpdate = async (id, newStatus, extraPayload = {}) => {
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL }/api/reviewer/proposals/${id}/status`, {
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

  const handleEditIssue = (issue) => {
    setEditingIssueId(issue.id);
    setEditForm({
      learner_name: issue.learner_name,
      learner_email: issue.learner_email,
      course_name: issue.course_name
    });
  };

  const handleSaveIssue = (id) => {
    const issues = JSON.parse(localStorage.getItem('sf_certificate_issues') || '[]');
    const updatedIssues = issues.map(issue => {
      if (issue.id === id) {
        return {
          ...issue,
          learner_name: editForm.learner_name,
          learner_email: editForm.learner_email,
          course_name: editForm.course_name,
          status: 'resolved',
          notified: false
        };
      }
      return issue;
    });
    localStorage.setItem('sf_certificate_issues', JSON.stringify(updatedIssues));
    setCertificateIssues(updatedIssues);
    setEditingIssueId(null);
  };

  return (
    <div className="review-center-container">
      <div className="review-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <h2>Review Center</h2>
          <div className="view-type-toggle">
            <button 
              className={`view-toggle-btn ${viewType === 'proposals' ? 'active' : ''}`}
              onClick={() => setViewType('proposals')}
            >
              Course Proposals
            </button>
            <button 
              className={`view-toggle-btn ${viewType === 'certificates' ? 'active' : ''}`}
              onClick={() => setViewType('certificates')}
            >
              Certificate Issues
            </button>
          </div>
        </div>
        
        {viewType === 'proposals' && (
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
        )}
      </div>

      {error && <div style={{ color: '#ef4444', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
      
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <RefreshCw className="spin" size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
          Loading...
        </div>
      ) : viewType === 'certificates' ? (
        certificateIssues.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px' }}>
            <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3>No Certificate Issues!</h3>
            <p>There are no reported issues with certificates.</p>
          </div>
        ) : (
          <div className="proposals-grid">
            {certificateIssues.map(issue => (
              <div key={issue.id} className="proposal-card">
                <div className="proposal-card-header">
                  <div>
                    <h3 className="proposal-card-title">Certificate Details Issue</h3>
                    <div className="proposal-card-meta">
                      <Award size={14} />
                      <span>{issue.course_name}</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {formatDate(issue.created_at)}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${issue.status}`}>{issue.status}</span>
                </div>
                
                <div style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: '6px' }}>
                    <strong>Learner Note:</strong><br/>
                    {issue.issue_description}
                  </p>
                  
                  {editingIssueId === issue.id ? (
                    <div className="edit-issue-form">
                      <div className="rc-form-group">
                        <label>Learner Name</label>
                        <input 
                          type="text" 
                          className="rc-input" 
                          value={editForm.learner_name}
                          onChange={(e) => setEditForm({...editForm, learner_name: e.target.value})}
                        />
                      </div>
                      <div className="rc-form-group">
                        <label>Learner Email</label>
                        <input 
                          type="email" 
                          className="rc-input" 
                          value={editForm.learner_email}
                          onChange={(e) => setEditForm({...editForm, learner_email: e.target.value})}
                        />
                      </div>
                      <div className="rc-form-group">
                        <label>Course Name</label>
                        <input 
                          type="text" 
                          className="rc-input" 
                          value={editForm.course_name}
                          onChange={(e) => setEditForm({...editForm, course_name: e.target.value})}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="action-btn-small btn-approve" onClick={() => handleSaveIssue(issue.id)} style={{ flex: 1, justifyContent: 'center' }}>
                          <Save size={16} /> Save & Resolve
                        </button>
                        <button className="action-btn-small btn-reject" onClick={() => setEditingIssueId(null)} style={{ flex: 1, justifyContent: 'center' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        <span style={{ color: '#94a3b8' }}>Learner:</span>
                        <span>{issue.learner_name}</span>
                        <span style={{ color: '#94a3b8' }}>Email:</span>
                        <span>{issue.learner_email}</span>
                        <span style={{ color: '#94a3b8' }}>Course:</span>
                        <span>{issue.course_name}</span>
                      </div>
                      
                      {issue.status !== 'resolved' && (
                        <div className="proposal-actions">
                          <button className="action-btn-small btn-changes" onClick={() => handleEditIssue(issue)} style={{ width: '100%', justifyContent: 'center' }}>
                            <Edit2 size={16} /> Edit Details
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
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

              {(p.public_voting || p.upvotes > 0 || p.downvotes > 0 || p.comment_count > 0) && (
                <div className="community-response-box">
                  <div className="community-response-header">
                    <BarChart2 size={14} /> Community Feedback
                  </div>
                  <div className="community-metrics">
                    <div className="community-metric">
                      <ArrowUp size={14} className="upvote-icon" />
                      <span>{p.upvotes} Upvotes</span>
                    </div>
                    <div className="community-metric">
                      <ArrowDown size={14} className="downvote-icon" />
                      <span>{p.downvotes} Downvotes</span>
                    </div>
                    <div className="community-metric">
                      <MessageSquare size={14} className="comments-icon" />
                      <span>{p.comment_count} Comments</span>
                    </div>
                  </div>
                </div>
              )}

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
