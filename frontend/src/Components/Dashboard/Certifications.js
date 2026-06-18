import React from 'react';
import { Award, Target, TrendingUp, Trophy, Globe, CheckCircle2, Share2, Download, ShieldCheck, Lock } from 'lucide-react';
import './Certifications.css';

const MOCK_CERTIFICATES = [
  {
    id: "SF-REACT-44821",
    title: "React & Modern Frontend Architecture",
    org: "SkillForge + Meta",
    issueDate: "Jan 15, 2025",
    tags: ["React", "TypeScript"],
    level: "Advanced",
    levelClass: "level-tag"
  },
  {
    id: "SF-JSADS-31928",
    title: "JavaScript Algorithms & Data Structures",
    org: "SkillForge + Google",
    issueDate: "Nov 28, 2024",
    tags: ["JavaScript", "Algorithms"],
    level: "Intermediate",
    levelClass: ""
  },
  {
    id: "SF-NODE-28437",
    title: "Node.js & API Design Fundamentals",
    org: "SkillForge + AWS",
    issueDate: "Sep 10, 2024",
    tags: ["Node.js", "REST"],
    level: "Intermediate",
    levelClass: ""
  },
  {
    id: "SF-GIT-19284",
    title: "Git & Development Workflows",
    org: "SkillForge + GitHub",
    issueDate: "Jul 3, 2024",
    tags: ["Git", "CI/CD"],
    level: "Beginner",
    levelClass: "beginner-tag"
  }
];

const Certifications = () => {
  return (
    <div className="certifications-container">
      
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Certification Center</h1>
          <p className="cert-subtitle">Your verified credentials and progress toward new certificates</p>
        </div>
        <button className="public-profile-btn">
          <Globe size={16} /> Public profile
        </button>
      </div>

      {/* Top Stats */}
      <div className="cert-stats-grid">
        <div className="cert-stat-card">
          <div className="cert-stat-info">
            <span className="cert-stat-title">Earned Certs</span>
            <span className="cert-stat-value">4</span>
            {/* Empty space to align height if no subtext */}
          </div>
          <div className="cert-stat-icon orange"><Award size={20} /></div>
        </div>

        <div className="cert-stat-card">
          <div className="cert-stat-info">
            <span className="cert-stat-title">In Progress</span>
            <span className="cert-stat-value">2</span>
            <span className="cert-stat-subtext" style={{ color: '#0ea5e9' }}>2 more eligible</span>
          </div>
          <div className="cert-stat-icon blue"><Target size={20} /></div>
        </div>

        <div className="cert-stat-card">
          <div className="cert-stat-info">
            <span className="cert-stat-title">Skill Points</span>
            <span className="cert-stat-value">2,840</span>
            <span className="cert-stat-subtext">+45 this week</span>
          </div>
          <div className="cert-stat-icon green"><TrendingUp size={20} /></div>
        </div>

        <div className="cert-stat-card">
          <div className="cert-stat-info">
            <span className="cert-stat-title">Industry Rank</span>
            <span className="cert-stat-value">Top 8%</span>
            <span className="cert-stat-subtext">vs all learners</span>
          </div>
          <div className="cert-stat-icon purple"><Trophy size={20} /></div>
        </div>
      </div>

      {/* Earned Certificates */}
      <h2 className="section-heading">Earned Certificates</h2>
      <div className="earned-certs-grid">
        {MOCK_CERTIFICATES.map(cert => (
          <div key={cert.id} className="certificate-card">
            <div className="cert-card-top">
              <div className="verified-badge">
                <CheckCircle2 size={12} strokeWidth={3} /> Verified
              </div>
              <h3 className="cert-card-title">{cert.title}</h3>
              <div className="cert-card-org">{cert.org}</div>
            </div>
            
            <div className="cert-card-bottom">
              <div className="cert-meta-row">
                <span className="cert-issue-date">Issued {cert.issueDate}</span>
                <span className="cert-id">{cert.id}</span>
              </div>
              
              <div className="cert-tags">
                {cert.tags.map(tag => (
                  <span key={tag} className="cert-tag">{tag}</span>
                ))}
                <span className={`cert-tag ${cert.levelClass}`}>{cert.level}</span>
              </div>
              
              <div className="cert-actions">
                <button className="cert-btn"><Share2 size={14} /> Share</button>
                <button className="cert-btn"><Download size={14} /> Download</button>
                <button className="cert-btn"><ShieldCheck size={14} /> Verify</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Certificates in Progress */}
      <h2 className="section-heading">Certificates in Progress</h2>
      <div className="in-progress-card">
        <div className="in-progress-icon">
          <Lock size={24} />
        </div>
        <div className="in-progress-info">
          <h3 className="in-progress-title">System Design for Senior Engineers</h3>
          <div className="in-progress-meta">14/22 lessons · ~3 weeks to complete</div>
          <div className="in-progress-bar-container">
            <div className="in-progress-bg">
              <div className="in-progress-fill" style={{ width: '68%' }}></div>
            </div>
          </div>
        </div>
        <div className="in-progress-percentage">
          68% <span>complete</span>
        </div>
      </div>

    </div>
  );
};

export default Certifications;
