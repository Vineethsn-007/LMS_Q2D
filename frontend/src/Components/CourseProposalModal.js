import React, { useState } from 'react';
import { X, Lightbulb, Send, ChevronDown } from 'lucide-react';

export default function CourseProposalModal({ isOpen, onClose, user }) {
  const [courseName, setCourseName] = useState('');
  const [reasonToLearn, setReasonToLearn] = useState('Career Growth');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [preferredStyle, setPreferredStyle] = useState([]);
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [publicVoting, setPublicVoting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStyleChange = (style) => {
    if (preferredStyle.includes(style)) {
      setPreferredStyle(preferredStyle.filter(s => s !== style));
    } else {
      setPreferredStyle([...preferredStyle, style]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (preferredStyle.length === 0) {
      setError('Please select at least one learning style.');
      return;
    }

    setLoading(true);

    const payload = {
      course_name: courseName,
      reason_to_learn: reasonToLearn,
      skill_level: skillLevel,
      preferred_learning_style: JSON.stringify(preferredStyle),
      expected_outcome: expectedOutcome,
      additional_notes: additionalNotes || null,
      public_voting: publicVoting,
      learner_id: user ? user.id : null,
      learner_name: user ? user.name : null,
      profile_image: user && user.profile_image ? user.profile_image : null
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL }/api/proposals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to submit proposal.');
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        // Reset form
        setCourseName('');
        setReasonToLearn('Career Growth');
        setSkillLevel('Beginner');
        setPreferredStyle([]);
        setExpectedOutcome('');
        setAdditionalNotes('');
        setPublicVoting(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const learningStyles = [
    'Video Lessons',
    'Hands-on Projects',
    'Live Mentoring',
    'Reading Materials',
    'Community Discussions'
  ];

  const reasons = [
    'Career Growth',
    'Build a Project',
    'Research',
    'Startup Idea',
    'College Work',
    'Personal Interest'
  ];

  return (
    <div 
      className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-start mb-8 gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb size={24} className="text-blue-500" />
              <h2 className="text-2xl font-bold text-navy-900">Suggest a Course</h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              What skill or technology do you want to learn next? Our AI will generate a tailored curriculum.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-coral-50 border border-coral-200 text-coral-600 rounded-xl text-sm font-bold">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
              <Send size={36} className="ml-1" />
            </div>
            <h3 className="text-2xl font-bold text-navy-900 mb-2">Thank You!</h3>
            <p className="text-slate-500 font-medium">We've received your suggestion and our AI will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-navy-900">Course Name <span className="text-coral">*</span></label>
              <input
                type="text"
                placeholder="e.g. Advanced Rust for Systems Programming"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy shadow-inner transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-sm font-bold text-navy-900">Reason to Learn <span className="text-coral">*</span></label>
                <div className="relative">
                  <select 
                    value={reasonToLearn} 
                    onChange={(e) => setReasonToLearn(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy shadow-inner transition-all appearance-none cursor-pointer"
                  >
                    {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-sm font-bold text-navy-900">Skill Level <span className="text-coral">*</span></label>
                <div className="relative">
                  <select 
                    value={skillLevel} 
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy shadow-inner transition-all appearance-none cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-navy-900">Preferred Learning Style <span className="text-coral">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {learningStyles.map(style => (
                  <label key={style} className="flex items-center gap-3 text-sm font-semibold text-slate-600 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={preferredStyle.includes(style)}
                        onChange={() => handleStyleChange(style)}
                        className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded hover:border-navy checked:bg-navy checked:border-navy transition-colors cursor-pointer"
                      />
                      <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="group-hover:text-navy-900 transition-colors">{style}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-navy-900">Expected Outcome <span className="text-coral">*</span></label>
              <textarea
                placeholder="What do you want to achieve by the end of this course?"
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                required
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy shadow-inner transition-all resize-y leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-navy-900">Additional Notes <span className="text-slate-400 font-medium text-xs">(optional)</span></label>
              <textarea
                placeholder="Any specific topics, libraries, or tools you'd like included?"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy shadow-inner transition-all resize-y leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-600 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={publicVoting}
                    onChange={(e) => setPublicVoting(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded hover:border-navy checked:bg-navy checked:border-navy transition-colors cursor-pointer"
                  />
                  <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="group-hover:text-navy-900 transition-colors">Allow public voting on this proposal</span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-2">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full px-8 py-3.5 bg-navy hover:bg-navy-800 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {loading ? 'Submitting...' : 'Submit Suggestion'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
