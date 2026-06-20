import React, { useState } from 'react';
import { Lightbulb, ThumbsUp, Triangle } from 'lucide-react';
import './ProposalsVoting.css';

const MOCK_PROPOSALS = [
  {
    id: 1,
    title: 'Quantum Computing Fundamentals for Engineers',
    author: '@james_dev',
    daysAgo: 2,
    tags: [{ label: 'Hot', type: 'hot' }, { label: 'Quantum' }, { label: 'Physics' }],
    votes: '1.2k'
  },
  {
    id: 2,
    title: 'WebAssembly: The Future of Web Performance',
    author: '@sarah_c',
    daysAgo: 4,
    tags: [{ label: 'Trending', type: 'trending' }, { label: 'WASM' }, { label: 'Web' }],
    votes: 892
  },
  {
    id: 3,
    title: 'Zero-Knowledge Proofs in Modern Cryptography',
    author: '@crypto_pete',
    daysAgo: 7,
    tags: [{ label: 'Trending', type: 'trending' }, { label: 'ZK' }, { label: 'Security' }],
    votes: 743
  },
  {
    id: 4,
    title: 'Sustainable Software Engineering Practices',
    author: '@eco_dev',
    daysAgo: 14,
    tags: [{ label: 'Active', type: 'active' }, { label: 'Green Tech' }],
    votes: 521
  },
  {
    id: 5,
    title: 'AI Agents for Enterprise Automation',
    author: '@ai_guru',
    daysAgo: 30,
    tags: [{ label: 'Active', type: 'active' }, { label: 'AI' }, { label: 'Agents' }],
    votes: 407
  }
];

const ProposalsVoting = () => {
  const [view, setView] = useState('browse'); // 'browse' or 'propose'

  const handleVote = (id) => {
    // Vote logic would go here
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Proposal submitted successfully! It is now pending review.');
    setView('browse');
  };

  return (
    <div className="proposals-container">
      <div className="proposals-header">
        <div className="proposals-title-group">
          <h2>Community Proposals</h2>
          <p>Vote on what gets built next — top-voted proposals queue for AI generation</p>
        </div>
        
        <div className="proposals-toggle">
          <button 
            className={`toggle-btn ${view === 'browse' ? 'active' : ''}`}
            onClick={() => setView('browse')}
          >
            Browse
          </button>
          <button 
            className={`toggle-btn ${view === 'propose' ? 'active' : ''}`}
            onClick={() => setView('propose')}
          >
            + Propose a Course
          </button>
        </div>
      </div>

      {view === 'browse' ? (
        <>
          <div className="proposals-stats-row">
            <div className="stat-card">
              <div className="stat-value">847</div>
              <div className="stat-label">Active Proposals</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">23</div>
              <div className="stat-label">In AI Generation</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">142</div>
              <div className="stat-label">Courses Published</div>
            </div>
          </div>

          <div className="proposals-list">
            {MOCK_PROPOSALS.map((proposal) => (
              <div className="proposal-card" key={proposal.id}>
                <div className="vote-section">
                  <Triangle size={24} fill="currentColor" className="vote-icon" />
                  <span className="vote-count">{proposal.votes}</span>
                </div>
                
                <div className="proposal-content">
                  <div className="proposal-tags">
                    {proposal.tags.map((tag, i) => (
                      <span key={i} className={`tag ${tag.type || ''}`}>{tag.label}</span>
                    ))}
                  </div>
                  <h4 className="proposal-title">{proposal.title}</h4>
                  <div className="proposal-meta">
                    by {proposal.author} · {proposal.daysAgo} {proposal.daysAgo === 1 ? 'day' : 'days'} ago
                  </div>
                </div>

                <div className="proposal-actions">
                  <button className="vote-button" onClick={() => handleVote(proposal.id)}>
                    <ThumbsUp size={16} /> Vote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="propose-form-card">
          <div className="form-header">
            <div className="form-icon-wrapper">
              <Lightbulb size={20} />
            </div>
            <h3>Propose a New Course</h3>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Course Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Federated Learning for Privacy-Preserving ML" 
                required 
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select className="form-input" required defaultValue="">
                  <option value="" disabled>Select category...</option>
                  <option value="engineering">Engineering</option>
                  <option value="data-science">Data Science</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div className="form-group">
                <label>Level</label>
                <select className="form-input" required defaultValue="">
                  <option value="" disabled>Select level...</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Why is this needed?</label>
              <textarea 
                className="form-input form-textarea" 
                placeholder="Describe the problem this course solves and who would benefit..."
                required
              ></textarea>
            </div>
            
            <button type="submit" className="submit-btn">
              Submit Proposal
            </button>
            <div className="form-footer-note">
              Proposals with 500+ votes automatically queue for AI generation
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProposalsVoting;
