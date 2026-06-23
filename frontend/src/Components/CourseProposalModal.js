import React, { useState } from 'react';
import { X, Lightbulb, Send } from 'lucide-react';

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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <Lightbulb size={24} color="#0ea5e9" />
            <h2 style={styles.title}>Suggest a Course</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div style={styles.successMessage}>
            <div style={styles.successIconWrapper}>
              <Send size={32} color="#10b981" />
            </div>
            <h3 style={styles.successTitle}>Thank You!</h3>
            <p style={styles.successText}>We've received your suggestion and our AI will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <p style={styles.subtitle}>
              What skill or technology do you want to learn next? Our AI will generate a tailored curriculum.
            </p>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Course Name <span style={{color: '#ef4444'}}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Advanced Rust for Systems Programming"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                required
                style={styles.input}
                className="form-input"
              />
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Reason to Learn <span style={{color: '#ef4444'}}>*</span></label>
                <select 
                  value={reasonToLearn} 
                  onChange={(e) => setReasonToLearn(e.target.value)}
                  style={styles.input}
                  className="form-input"
                >
                  {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Skill Level <span style={{color: '#ef4444'}}>*</span></label>
                <select 
                  value={skillLevel} 
                  onChange={(e) => setSkillLevel(e.target.value)}
                  style={styles.input}
                  className="form-input"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Preferred Learning Style <span style={{color: '#ef4444'}}>*</span></label>
              <div style={styles.checkboxGrid}>
                {learningStyles.map(style => (
                  <label key={style} style={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={preferredStyle.includes(style)}
                      onChange={() => handleStyleChange(style)}
                      style={styles.checkbox}
                    />
                    {style}
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Expected Outcome <span style={{color: '#ef4444'}}>*</span></label>
              <textarea
                placeholder="What do you want to achieve by the end of this course?"
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                required
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                className="form-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Additional Notes (Optional)</label>
              <textarea
                placeholder="Any specific topics, libraries, or tools you'd like included?"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
                className="form-input"
              />
            </div>

            <div style={styles.toggleGroup}>
              <label style={styles.toggleLabel}>
                <input 
                  type="checkbox" 
                  checked={publicVoting}
                  onChange={(e) => setPublicVoting(e.target.checked)}
                  style={styles.checkbox}
                />
                Allow public voting on this proposal
              </label>
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn} className="btn-primary">
              <Send size={18} />
              {loading ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 10, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1.5rem',
  },
  modal: {
    width: '100%',
    maxWidth: '600px',
    maxHeight: '85vh',
    overflowY: 'auto',
    borderRadius: '1rem',
    padding: '2rem',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#475569',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    marginBottom: '1.25rem',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#475569',
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    outline: 'none',
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#334155',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#0ea5e9',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  toggleGroup: {
    marginTop: '0.5rem',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#334155',
    cursor: 'pointer',
  },
  submitBtn: {
    marginTop: '1rem',
    padding: '0.85rem',
    fontSize: '1rem',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  successMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 0',
    textAlign: 'center',
  },
  successIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '0.5rem',
  },
  successText: {
    color: '#475569',
    fontSize: '1rem',
  }
};
