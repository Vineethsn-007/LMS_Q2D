import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, MessageSquare, Clock, BarChart2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import CommentsSection from './CommentsSection';
import './CommunityVoting.css';

const CommunityVoting = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('trending');
  const [category, setCategory] = useState('');
  const [activeCommentId, setActiveCommentId] = useState(null);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const url = new URL(`${process.env.REACT_APP_API_URL }/api/community/proposals`);
      url.searchParams.append('sort_by', sortBy);
      if (category) url.searchParams.append('category', category);
      
      const token = localStorage.getItem('sf_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url.toString(), { headers });
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [sortBy, category]);

  const handleVote = async (id, type) => {
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL }/api/community/proposals/${id}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote_type: type })
      });
      
      if (res.ok) {
        const updated = await res.json();
        setProposals(prev => prev.map(p => p.id === id ? updated : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.round((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
  };

const CommunityPost = ({ p, handleVote, activeCommentId, setActiveCommentId }) => {
  const [showAI, setShowAI] = useState(false);

  const jobRelevance = p.risk_level === 'Low' ? 'High' : p.risk_level === 'Medium' ? 'Moderate' : 'Low';
  const marketDemand = p.demand_score >= 80 ? 'Strong' : p.demand_score >= 50 ? 'Moderate' : 'Low';

  return (
    <React.Fragment>
      <div className="cv-post">
        <div className="cv-vote-gutter">
          <button 
            className={`cv-vote-btn upvote ${p.user_vote === 'upvote' ? 'active' : ''}`} 
            onClick={() => handleVote(p.id, 'upvote')}
          >
            <ArrowUp size={24} />
          </button>
          <span className={`cv-score ${p.user_vote === 'upvote' ? 'upvoted' : p.user_vote === 'downvote' ? 'downvoted' : ''}`}>
            {p.upvotes - p.downvotes}
          </span>
          <button 
            className={`cv-vote-btn downvote ${p.user_vote === 'downvote' ? 'active' : ''}`} 
            onClick={() => handleVote(p.id, 'downvote')}
          >
            <ArrowDown size={24} />
          </button>
        </div>
        
        <div className="cv-content">
          <div className="cv-meta-row">
            <div className="cv-author">
              <img src={p.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.learner_name || 'Anonymous')}&background=random`} alt="avatar" />
              <span className="cv-author-name">{p.learner_name || 'Anonymous Learner'}</span>
              <span className="cv-badge">{p.skill_level}</span>
            </div>
            <span className="cv-time"><Clock size={14} /> {formatDate(p.created_at)}</span>
          </div>
          
          <h3 className="cv-title">{p.course_name}</h3>
          
          <div className="cv-tags">
            {p.ai_category && <span className="cv-tag category">{p.ai_category}</span>}
            {p.demand_score !== null && <span className="cv-tag demand">Demand: {p.demand_score}/100</span>}
          </div>
          
          {p.ai_summary && (
            <p className="cv-summary">
              {p.ai_summary}
            </p>
          )}

          <div className="cv-ai-panel">
            <button className="cv-ai-toggle" onClick={() => setShowAI(!showAI)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} style={{ color: '#8b5cf6' }} /> AI Insight
              </span>
              {showAI ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {showAI && (
              <div className="cv-ai-details">
                <div className="cv-ai-row"><strong>Job relevance:</strong> <span>{jobRelevance}</span></div>
                <div className="cv-ai-row"><strong>Market demand:</strong> <span>{marketDemand} ({p.demand_score})</span></div>
                <div className="cv-ai-row"><strong>Related skills:</strong> <span>{p.ai_category}</span></div>
                <div className="cv-ai-row"><strong>Duplicate risk:</strong> <span style={{ color: p.duplicate_status ? '#ef4444' : '#10b981' }}>{p.duplicate_status ? 'High' : 'Low'}</span></div>
              </div>
            )}
          </div>
          
          <div className="cv-actions-row">
            <button className={`cv-action-btn ${activeCommentId === p.id ? 'active' : ''}`} onClick={() => setActiveCommentId(activeCommentId === p.id ? null : p.id)}>
              <MessageSquare size={18} /> {p.comment_count} Comments
            </button>
            <button className="cv-action-btn">
              <BarChart2 size={18} /> {p.upvotes} Upvotes · {p.downvotes} Downvotes
            </button>
          </div>
        </div>
      </div>
      {activeCommentId === p.id && <CommentsSection proposalId={p.id} />}
    </React.Fragment>
  );
};

  return (
    <div className="dashboard-content-scroll">
      <div className="cv-container">
        <div className="cv-header">
          <h2>Community Feed</h2>
          <div className="cv-controls">
            <div className="cv-sort-tabs">
              <button className={sortBy === 'trending' ? 'active' : ''} onClick={() => setSortBy('trending')}>Trending</button>
              <button className={sortBy === 'newest' ? 'active' : ''} onClick={() => setSortBy('newest')}>Newest</button>
              <button className={sortBy === 'most_voted' ? 'active' : ''} onClick={() => setSortBy('most_voted')}>Top Voted</button>
              <button className={sortBy === 'most_discussed' ? 'active' : ''} onClick={() => setSortBy('most_discussed')}>Discussed</button>
            </div>
            
            <select className="cv-filter" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="engineering">Engineering</option>
              <option value="data-science">Data Science</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>

        <div className="cv-feed">
          {loading ? (
            <div className="cv-loading"><div className="spin" /> Loading feed...</div>
          ) : proposals.length === 0 ? (
            <div className="cv-empty">No approved proposals found. Be the first to get a proposal approved!</div>
          ) : (
            proposals.map(p => (
              <CommunityPost 
                key={p.id} 
                p={p} 
                handleVote={handleVote} 
                activeCommentId={activeCommentId} 
                setActiveCommentId={setActiveCommentId} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityVoting;
