import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, FileEdit, Trash2, Edit, Plus, Star, Clock, 
  Shield, RefreshCw, X, Check, AlertTriangle, ShieldAlert
} from 'lucide-react';
import './AdminPanel.css';

export default function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data lists
  const [usersList, setUsersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [proposalsList, setProposalsList] = useState([]);

  // Modals & form state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    category: 'Software Engineering',
    rating: 4.5,
    students_count: 1000,
    hours: 20,
    is_ai_generated: true,
    is_expert_validated: false,
    image_url: ''
  });

  const [isUserRoleModalOpen, setIsUserRoleModalOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
  const [userRoleData, setUserRoleData] = useState('learner');

  const token = localStorage.getItem('sf_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users`, { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('sf_token');
          localStorage.removeItem('sf_user');
          window.location.reload();
          return;
        }
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/courses`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data = await res.json();
      setCoursesList(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProposals = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reviewer/proposals`, { headers });
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
      setProposalsList(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    if (activeTab === 'users') await fetchUsers();
    else if (activeTab === 'courses') await fetchCourses();
    else if (activeTab === 'proposals') await fetchProposals();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Role Management
  const handleOpenRoleModal = (usr) => {
    setCurrentUserToEdit(usr);
    setUserRoleData(usr.role);
    setIsUserRoleModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!currentUserToEdit) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users/${currentUserToEdit.id}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: userRoleData })
      });
      if (!res.ok) throw new Error('Failed to update role');
      setIsUserRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Course Management
  const handleOpenCourseModal = (course = null) => {
    if (course) {
      setCurrentCourse(course);
      setCourseFormData({
        title: course.title,
        description: course.description,
        category: course.category,
        rating: course.rating,
        students_count: course.students_count,
        hours: course.hours,
        is_ai_generated: course.is_ai_generated,
        is_expert_validated: course.is_expert_validated,
        image_url: course.image_url || ''
      });
    } else {
      setCurrentCourse(null);
      setCourseFormData({
        title: '',
        description: '',
        category: 'Software Engineering',
        rating: 4.5,
        students_count: 100,
        hours: 10,
        is_ai_generated: true,
        is_expert_validated: false,
        image_url: ''
      });
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      const url = currentCourse 
        ? `${process.env.REACT_APP_API_URL}/api/admin/courses/${currentCourse.id}`
        : `${process.env.REACT_APP_API_URL}/api/admin/courses`;
      const method = currentCourse ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(courseFormData)
      });

      if (!res.ok) throw new Error('Failed to save course');
      setIsCourseModalOpen(false);
      fetchCourses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course from the catalog?")) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/courses/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete course');
      fetchCourses();
    } catch (err) {
      alert(err.message);
    }
  };

  // Proposal Management
  const handleDeleteProposal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course proposal?")) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/proposals/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete proposal');
      fetchProposals();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateProposalStatus = async (id, status) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reviewer/proposals/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update proposal status');
      fetchProposals();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <div className="admin-title-row">
          <ShieldAlert className="admin-icon-main" size={28} />
          <div>
            <h1 className="admin-title">Super Admin Control Panel</h1>
            <p className="admin-subtitle">Override system database entries and alter system-wide configurations</p>
          </div>
        </div>

        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> Users Management
          </button>
          <button 
            className={`admin-tab ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpen size={16} /> Course Catalog
          </button>
          <button 
            className={`admin-tab ${activeTab === 'proposals' ? 'active' : ''}`}
            onClick={() => setActiveTab('proposals')}
          >
            <FileEdit size={16} /> Proposals Archive
          </button>
        </div>
      </div>

      {error && <div className="admin-error-alert">{error}</div>}

      <div className="admin-content-card glass">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            {activeTab === 'users' && "Registered User Profiles"}
            {activeTab === 'courses' && "Live Course Catalog"}
            {activeTab === 'proposals' && "All Proposals Logs"}
          </h2>
          
          <div className="admin-card-actions">
            <button className="admin-btn-action secondary" onClick={loadData}>
              <RefreshCw size={14} className={loading ? "spin" : ""} /> Reload
            </button>
            {activeTab === 'courses' && (
              <button className="admin-btn-action primary" onClick={() => handleOpenCourseModal(null)}>
                <Plus size={14} /> Add Course
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">
            <RefreshCw className="spin" size={36} />
            <p>Loading database entries...</p>
          </div>
        ) : (
          <div className="admin-table-container">
            {activeTab === 'users' && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(usr => (
                    <tr key={usr.id}>
                      <td>#{usr.id}</td>
                      <td><strong>{usr.name}</strong></td>
                      <td>{usr.email}</td>
                      <td>
                        <span className={`role-badge ${usr.role}`}>
                          {usr.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-dot ${usr.is_active ? 'active' : 'inactive'}`}></span>
                        {usr.is_active ? 'Active' : 'Suspended'}
                      </td>
                      <td>
                        <button className="admin-row-btn edit" onClick={() => handleOpenRoleModal(usr)}>
                          <Shield size={12} /> Edit Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'courses' && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Course Title</th>
                    <th>Category</th>
                    <th>Hours</th>
                    <th>Rating</th>
                    <th>Students</th>
                    <th>Type</th>
                    <th>Validation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesList.map(c => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td><strong>{c.title}</strong></td>
                      <td>{c.category}</td>
                      <td>{c.hours}h</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={12} fill="#fbbf24" color="#fbbf24" /> {c.rating}
                        </div>
                      </td>
                      <td>{c.students_count}</td>
                      <td>{c.is_ai_generated ? "🤖 AI" : "🧑‍💻 Manual"}</td>
                      <td>
                        <span className={`validation-badge ${c.is_expert_validated ? 'validated' : 'pending'}`}>
                          {c.is_expert_validated ? 'Expert Approved' : 'Needs Review'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="admin-row-btn edit" onClick={() => handleOpenCourseModal(c)}>
                            <Edit size={12} /> Edit
                          </button>
                          <button className="admin-row-btn delete" onClick={() => handleDeleteCourse(c.id)}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'proposals' && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Course Name</th>
                    <th>Proposer</th>
                    <th>AI Category</th>
                    <th>Risk</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proposalsList.map(p => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td><strong>{p.course_name}</strong></td>
                      <td>{p.learner_name || 'Anonymous'}</td>
                      <td>{p.ai_category || 'Pending'}</td>
                      <td>
                        <span className={`risk-badge ${p.risk_level || 'unknown'}`}>
                          {p.risk_level || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${p.status}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {p.status !== 'approved' && (
                            <button className="admin-row-btn approve" onClick={() => handleUpdateProposalStatus(p.id, 'approved')}>
                              <Check size={12} /> Approve
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button className="admin-row-btn reject" onClick={() => handleUpdateProposalStatus(p.id, 'rejected')}>
                              <X size={12} /> Reject
                            </button>
                          )}
                          <button className="admin-row-btn delete" onClick={() => handleDeleteProposal(p.id)}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* User Role Modal */}
      {isUserRoleModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass">
            <div className="admin-modal-header">
              <h3>Change User Role</h3>
              <button className="admin-modal-close" onClick={() => setIsUserRoleModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Update system access permissions for <strong>{currentUserToEdit?.name}</strong> ({currentUserToEdit?.email}).</p>
              <div className="form-group">
                <label>System Role</label>
                <select 
                  className="admin-select"
                  value={userRoleData}
                  onChange={e => setUserRoleData(e.target.value)}
                >
                  <option value="learner">Learner</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn secondary" onClick={() => setIsUserRoleModalOpen(false)}>Cancel</button>
              <button className="admin-btn primary" onClick={handleUpdateRole}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {isCourseModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal course-modal glass">
            <div className="admin-modal-header">
              <h3>{currentCourse ? "Edit Course Catalog Entry" : "Create New Course"}</h3>
              <button className="admin-modal-close" onClick={() => setIsCourseModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCourse}>
              <div className="admin-modal-body grid">
                <div className="form-group span-2">
                  <label>Course Title</label>
                  <input 
                    type="text" 
                    required
                    value={courseFormData.title}
                    onChange={e => setCourseFormData({...courseFormData, title: e.target.value})}
                    placeholder="e.g. Advanced System Architecture"
                  />
                </div>
                
                <div className="form-group span-2">
                  <label>Description</label>
                  <textarea 
                    required
                    value={courseFormData.description}
                    onChange={e => setCourseFormData({...courseFormData, description: e.target.value})}
                    placeholder="Provide a comprehensive summary..."
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={courseFormData.category}
                    onChange={e => setCourseFormData({...courseFormData, category: e.target.value})}
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="Data Science & Databases">Data Science & Databases</option>
                    <option value="Product & DevOps">Product & DevOps</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Hours Duration</label>
                  <input 
                    type="number" 
                    required
                    value={courseFormData.hours}
                    onChange={e => setCourseFormData({...courseFormData, hours: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="form-group">
                  <label>Rating</label>
                  <input 
                    type="number" 
                    step="0.05"
                    min="0"
                    max="5"
                    required
                    value={courseFormData.rating}
                    onChange={e => setCourseFormData({...courseFormData, rating: parseFloat(e.target.value) || 0.0})}
                  />
                </div>

                <div className="form-group">
                  <label>Students Enrolled</label>
                  <input 
                    type="number" 
                    required
                    value={courseFormData.students_count}
                    onChange={e => setCourseFormData({...courseFormData, students_count: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="form-group span-2">
                  <label>Image URL</label>
                  <input 
                    type="text" 
                    value={courseFormData.image_url}
                    onChange={e => setCourseFormData({...courseFormData, image_url: e.target.value})}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>

                <div className="form-group checkbox-row">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={courseFormData.is_ai_generated}
                      onChange={e => setCourseFormData({...courseFormData, is_ai_generated: e.target.checked})}
                    />
                    AI Generated
                  </label>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={courseFormData.is_expert_validated}
                      onChange={e => setCourseFormData({...courseFormData, is_expert_validated: e.target.checked})}
                    />
                    Expert Approved
                  </label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn secondary" onClick={() => setIsCourseModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn primary">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
