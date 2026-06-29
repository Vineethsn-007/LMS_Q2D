import React, { useState, useEffect } from 'react';
import { Award, X, MessageSquareWarning, Send, ArrowLeft } from 'lucide-react';
import { getCertificateHTML } from './certificateTemplate';
import './CertificateModal.css';

const CertificateModal = ({ user, course, onClose, onShowToast }) => {
  const [isContacting, setIsContacting] = useState(false);
  const [issueMessage, setIssueMessage] = useState('');
  
  const [displayDetails, setDisplayDetails] = useState({
    name: user?.name || user?.username || 'Learner Name',
    email: user?.email || 'learner@example.com',
    courseName: course?.title || 'Course Title'
  });

  useEffect(() => {
    const issues = JSON.parse(localStorage.getItem('sf_certificate_issues') || '[]');
    const userEmail = user?.email || 'learner@example.com';
    const resolvedIssue = issues.find(i => i.original_email === userEmail && i.course_id === course?.id && i.status === 'resolved');
    
    if (resolvedIssue) {
      setDisplayDetails({
        name: resolvedIssue.learner_name,
        email: resolvedIssue.learner_email,
        courseName: resolvedIssue.course_name
      });
    }
  }, [user, course]);

  const handleSubmitIssue = (e) => {
    e.preventDefault();
    if (!issueMessage.trim()) return;
    
    const existingIssues = JSON.parse(localStorage.getItem('sf_certificate_issues') || '[]');
    const newIssue = {
      id: Date.now(),
      type: 'certificate_issue',
      original_email: user?.email || 'learner@example.com',
      course_id: course?.id,
      learner_name: user?.name || user?.username || 'Learner Name',
      learner_email: user?.email || 'learner@example.com',
      course_name: course?.title || 'Course Title',
      issue_description: issueMessage,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    localStorage.setItem('sf_certificate_issues', JSON.stringify([...existingIssues, newIssue]));

    if (onShowToast) {
      onShowToast('Your message is delivered to our team we will get back within 24hrs');
    }
    onClose();
  };

  const handleDownload = async () => {
    const today = new Date();
    const dateString = `${String(today.getDate()).padStart(2, '0')} / ${String(today.getMonth() + 1).padStart(2, '0')} / ${today.getFullYear()}`;
    const htmlContent = getCertificateHTML(displayDetails.name, displayDetails.courseName, dateString);
    
    // Save certificate to backend
    if (user && course) {
      try {
        const certId = `SF-${course.id}-${Math.floor(Math.random() * 100000)}`;
        await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/certificates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            course_id: course.id,
            course_name: course.title,
            cert_id: certId,
            issue_date: dateString
          })
        });
      } catch (err) {
        console.error('Failed to save certificate', err);
      }
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      if (onShowToast) onShowToast('Please allow popups to download the certificate.');
    }
    
    if (onShowToast) {
      onShowToast('Certificate generated successfully!');
    }
    onClose();
  };

  return (
    <div className="certificate-modal-overlay">
      <div className="certificate-modal-content">
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {!isContacting ? (
          <>
            <div className="certificate-header">
              <Award size={48} color="#2563eb" className="certificate-icon" />
              <h2>Get Certificate</h2>
              <p>Verify your details to issue your course completion certificate.</p>
            </div>

            <form className="certificate-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={displayDetails.name} 
                  readOnly 
                  className="non-editable-input" 
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={displayDetails.email} 
                  readOnly 
                  className="non-editable-input" 
                />
              </div>
              <div className="form-group">
                <label>Course Completed</label>
                <input 
                  type="text" 
                  value={displayDetails.courseName} 
                  readOnly 
                  className="non-editable-input" 
                />
              </div>
              <div className="certificate-actions">
                <button 
                  type="button" 
                  className="download-btn" 
                  onClick={handleDownload}
                >
                  Issue & Download Certificate
                </button>
                <button 
                  type="button" 
                  className="contact-team-btn" 
                  onClick={() => setIsContacting(true)}
                >
                  Contact team (Details Incorrect?)
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="certificate-header">
              <button 
                type="button"
                className="back-btn" 
                onClick={() => setIsContacting(false)}
                title="Go back"
              >
                <ArrowLeft size={20} />
              </button>
              <MessageSquareWarning size={48} color="#fb923c" className="certificate-icon" />
              <h2>Report an Issue</h2>
              <p>Let us know what details are incorrect, and our team will fix it for you.</p>
            </div>

            <form className="certificate-form" onSubmit={handleSubmitIssue}>
              <div className="form-group">
                <label>Issue Description</label>
                <textarea 
                  value={issueMessage}
                  onChange={(e) => setIssueMessage(e.target.value)}
                  placeholder="E.g., My name is misspelled, it should be..."
                  className="issue-textarea"
                  rows={4}
                  required
                />
              </div>
              <div className="certificate-actions">
                <button 
                  type="submit" 
                  className="download-btn" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#fb923c' }}
                >
                  <Send size={18} /> Submit Issue
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CertificateModal;
