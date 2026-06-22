import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import './CourseSuggestionOrb.css';
import CourseProposalModal from './CourseProposalModal';

export default function CourseSuggestionOrb({ user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (user?.role === 'reviewer' || user?.role === 'admin') {
    return null;
  }

  return (
    <>
      <div className="suggestion-orb-container">
        <div className="suggestion-tooltip">Suggest a Course</div>
        <button 
          className="suggestion-orb" 
          onClick={() => setIsModalOpen(true)}
          aria-label="Suggest a Course"
        >
          <Sparkles size={28} />
        </button>
      </div>

      <CourseProposalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user}
      />
    </>
  );
}
