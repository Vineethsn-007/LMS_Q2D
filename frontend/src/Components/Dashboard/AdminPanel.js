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

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [modulesData, setModulesData] = useState([]);

  const [isUserRoleModalOpen, setIsUserRoleModalOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
  const [userRoleData, setUserRoleData] = useState('learner');

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addUserFormData, setAddUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'learner'
  });

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

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(addUserFormData)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to add user');
      }
      setIsAddUserModalOpen(false);
      setAddUserFormData({ name: '', email: '', password: '', role: 'learner' });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete user');
      }
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Course Management
  const fetchCourseMaterials = async (courseId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/expert/courses/${courseId}/materials`, { headers });
      if (res.ok) {
        const data = await res.json();
        const video = data.find(m => m.type === 'video');
        const pdf = data.find(m => m.type === 'pdf');
        const image = data.find(m => m.type === 'image');
        const text = data.find(m => m.type === 'text');
        setCourseFormData(prev => ({
          ...prev,
          video_url: video ? (video.content_url || '') : '',
          pdf_url: pdf ? (pdf.content_url || '') : '',
          material_image_url: image ? (image.content_url || '') : '',
          material_text: text ? (text.text_content || '') : '',
        }));
      }
    } catch (err) {
      console.error("Error fetching course materials:", err);
    }
  };

  const uploadFileToServer = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    if (!res.ok) throw new Error(`Failed to upload file ${file.name}`);
    const data = await res.json();
    return data.url;
  };

  const handleAddModule = () => {
    setModulesData([...modulesData, {
      id: Date.now().toString(),
      title: '',
      lessons: []
    }]);
  };

  const handleRemoveModule = (mIndex) => {
    const newData = [...modulesData];
    newData.splice(mIndex, 1);
    setModulesData(newData);
  };

  const handleAddLesson = (mIndex) => {
    const newData = [...modulesData];
    newData[mIndex].lessons.push({ 
      id: Date.now().toString(), 
      title: '', 
      contents: [{ id: Date.now().toString() + 'c', type: 'video', content_url: null, text_content: '', file: null }] 
    });
    setModulesData(newData);
  };

  const handleRemoveLesson = (mIndex, lIndex) => {
    const newData = [...modulesData];
    newData[mIndex].lessons.splice(lIndex, 1);
    setModulesData(newData);
  };

  const handleAddContent = (mIndex, lIndex) => {
    const newData = [...modulesData];
    newData[mIndex].lessons[lIndex].contents.push({
      id: Date.now().toString(),
      type: 'video',
      content_url: '',
      file: null
    });
    setModulesData(newData);
  };

  const handleRemoveContent = (mIndex, lIndex, cIndex) => {
    const newData = [...modulesData];
    newData[mIndex].lessons[lIndex].contents.splice(cIndex, 1);
    setModulesData(newData);
  };

  const handleOpenCourseModal = (course = null) => {
    setThumbnailFile(null);
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
      setModulesData(course.modules_data || []);
      // fetchCourseMaterials(course.id); // Disabled since we use modulesData
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
      setModulesData([]);
    }
    setIsCourseModalOpen(true);
  };


  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      // 1. Upload thumbnail
      let updatedImageUrl = courseFormData.image_url;
      if (thumbnailFile) {
        updatedImageUrl = await uploadFileToServer(thumbnailFile);
      }

      // 1.5 Upload module content files
      const newModulesData = [];
      for (const mod of modulesData) {
        const newLessons = [];
        for (const less of mod.lessons) {
          const newContents = [];
          for (const content of less.contents) {
            if (content.file) {
              const url = await uploadFileToServer(content.file);
              newContents.push({ ...content, content_url: url, file: undefined });
            } else {
              newContents.push(content);
            }
          }
          newLessons.push({ ...less, contents: newContents });
        }
        newModulesData.push({ ...mod, lessons: newLessons });
      }

      // 2. Save course
      const url = currentCourse
        ? `${process.env.REACT_APP_API_URL}/api/admin/courses/${currentCourse.id}`
        : `${process.env.REACT_APP_API_URL}/api/admin/courses`;
      const method = currentCourse ? 'PUT' : 'POST';

      const coreData = {
        title: courseFormData.title,
        description: courseFormData.description,
        category: courseFormData.category,
        rating: courseFormData.rating,
        students_count: courseFormData.students_count,
        hours: courseFormData.hours,
        is_ai_generated: courseFormData.is_ai_generated,
        is_expert_validated: courseFormData.is_expert_validated,
        image_url: updatedImageUrl,
        modules_data: newModulesData
      };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(coreData)
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
            {activeTab === 'users' && (
              <button className="admin-btn-action primary" onClick={() => setIsAddUserModalOpen(true)}>
                <Plus size={14} /> Add User
              </button>
            )}
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
              <>
                <h3 className="admin-section-title" style={{ marginTop: '0', marginBottom: '1rem', color: '#1e293b' }}>System Staff</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.filter(u => ['admin', 'reviewer', 'expert'].includes(u.role)).map(usr => (
                      <tr key={usr.id}>
                        <td><strong>{usr.name}</strong></td>
                        <td>{usr.email}</td>
                        <td>
                          <span className={`role-badge ${usr.role}`}>
                            {usr.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {usr.role !== 'admin' && (
                              <>
                                <button className="admin-row-btn edit" onClick={() => handleOpenRoleModal(usr)}>
                                  <Shield size={12} /> Edit Role
                                </button>
                                <button className="admin-row-btn delete" onClick={() => handleDeleteUser(usr.id)}>
                                  <Trash2 size={12} /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="admin-section-title" style={{ marginTop: '2.5rem', marginBottom: '1rem', color: '#1e293b' }}>Learners</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.filter(u => u.role === 'learner').map(usr => (
                      <tr key={usr.id}>
                        <td><strong>{usr.name}</strong></td>
                        <td>{usr.email}</td>
                        <td>
                          <span className={`role-badge ${usr.role}`}>
                            {usr.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {usr.role !== 'admin' && (
                              <>
                                <button className="admin-row-btn edit" onClick={() => handleOpenRoleModal(usr)}>
                                  <Shield size={12} /> Edit Role
                                </button>
                                <button className="admin-row-btn delete" onClick={() => handleDeleteUser(usr.id)}>
                                  <Trash2 size={12} /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {activeTab === 'courses' && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Course Title</th>
                    <th>Category</th>
                    <th>Hours</th>
                    <th>Rating</th>
                    <th>Validation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesList.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.title}</strong></td>
                      <td>{c.category}</td>
                      <td>{c.hours}h</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={12} fill="#fbbf24" color="#fbbf24" /> {c.rating}
                        </div>
                      </td>
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

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass">
            <div className="admin-modal-header">
              <h3>Add New User</h3>
              <button className="admin-modal-close" onClick={() => setIsAddUserModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="admin-modal-body grid">
                <div className="form-group span-2">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={addUserFormData.name}
                    onChange={e => setAddUserFormData({ ...addUserFormData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="form-group span-2">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={addUserFormData.email}
                    onChange={e => setAddUserFormData({ ...addUserFormData, email: e.target.value })}
                    placeholder="e.g. john@example.com"
                  />
                </div>
                <div className="form-group span-2">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    value={addUserFormData.password}
                    onChange={e => setAddUserFormData({ ...addUserFormData, password: e.target.value })}
                    placeholder="Temporary password"
                  />
                </div>
                <div className="form-group span-2">
                  <label>System Role</label>
                  <select
                    className="admin-select"
                    value={addUserFormData.role}
                    onChange={e => setAddUserFormData({ ...addUserFormData, role: e.target.value })}
                  >
                    <option value="learner">Learner</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="expert">Expert</option>
                    <option value="admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn secondary" onClick={() => setIsAddUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    onChange={e => setCourseFormData({ ...courseFormData, title: e.target.value })}
                    placeholder="e.g. Advanced System Architecture"
                  />
                </div>

                <div className="form-group span-2">
                  <label>Description</label>
                  <textarea
                    required
                    value={courseFormData.description}
                    onChange={e => setCourseFormData({ ...courseFormData, description: e.target.value })}
                    placeholder="Provide a comprehensive summary..."
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    required
                    value={courseFormData.category}
                    onChange={e => setCourseFormData({ ...courseFormData, category: e.target.value })}
                    placeholder="e.g. Software Engineering"
                  />
                </div>

                <div className="form-group">
                  <label>Hours Duration</label>
                  <input
                    type="number"
                    required
                    value={courseFormData.hours}
                    onChange={e => setCourseFormData({ ...courseFormData, hours: parseInt(e.target.value) || 0 })}
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
                    onChange={e => setCourseFormData({ ...courseFormData, rating: parseFloat(e.target.value) || 0.0 })}
                  />
                </div>



                <div className="form-group span-2">
                  <label>Thumbnail Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setThumbnailFile(e.target.files[0])}
                  />
                  {courseFormData.image_url && !thumbnailFile && (
                    <div className="current-file-info">
                      Current: <a href={`${process.env.REACT_APP_API_URL}${courseFormData.image_url}`} target="_blank" rel="noreferrer">View Image</a>
                    </div>
                  )}
                </div>

                <div className="form-group span-2" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>Course Modules</span>
                    <button type="button" className="admin-btn secondary" onClick={handleAddModule}>+ Add Module</button>
                  </div>
                  
                  <div className="modules-container">
                    {modulesData.map((module, mIndex) => (
                      <div key={module.id} className="admin-module-card">
                        <div className="module-header" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder={`Module ${mIndex + 1} Title`}
                            value={module.title}
                            onChange={(e) => {
                              const newData = [...modulesData];
                              newData[mIndex].title = e.target.value;
                              setModulesData(newData);
                            }}
                            className="module-title-input form-group input"
                            style={{ flex: 1, padding: '0.65rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            required
                          />
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button type="button" className="admin-btn primary" onClick={() => handleAddLesson(mIndex)}>+ Add Lesson</button>
                            <button type="button" className="admin-modal-close" onClick={() => handleRemoveModule(mIndex)}><X size={18} color="#ef4444" /></button>
                          </div>
                        </div>

                        <div className="lessons-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {module.lessons.map((lesson, lIndex) => (
                            <div key={lesson.id} className="admin-lesson-card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', backgroundColor: '#ffffff' }}>
                              <div className="lesson-header" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  placeholder="Lesson Title"
                                  value={lesson.title}
                                  onChange={(e) => {
                                    const newData = [...modulesData];
                                    newData[mIndex].lessons[lIndex].title = e.target.value;
                                    setModulesData(newData);
                                  }}
                                  className="lesson-title-input"
                                  style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                  required
                                />
                                <button type="button" className="admin-modal-close" onClick={() => handleRemoveLesson(mIndex, lIndex)}><X size={16} color="#ef4444" /></button>
                              </div>

                              <div className="contents-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '2px solid #f1f5f9' }}>
                                {lesson.contents.map((content, cIndex) => (
                                  <div key={content.id} className="admin-content-card-inner" style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                      <select
                                        value={content.type}
                                        onChange={(e) => {
                                          const newData = [...modulesData];
                                          newData[mIndex].lessons[lIndex].contents[cIndex].type = e.target.value;
                                          setModulesData(newData);
                                        }}
                                        className="content-type-select admin-select"
                                        style={{ width: 'auto', padding: '0.35rem 2rem 0.35rem 0.75rem' }}
                                      >
                                        <option value="video">Video</option>
                                        <option value="pdf">PDF</option>
                                        <option value="image">Image</option>
                                        <option value="text">Text</option>
                                      </select>
                                    </div>
                                    
                                    {content.type === 'text' ? (
                                      <textarea
                                        placeholder="Write text content or enter URL..."
                                        value={content.text_content || ''}
                                        onChange={(e) => {
                                          const newData = [...modulesData];
                                          newData[mIndex].lessons[lIndex].contents[cIndex].text_content = e.target.value;
                                          setModulesData(newData);
                                        }}
                                        className="content-textarea"
                                        style={{ width: '100%', minHeight: '60px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        required
                                      />
                                    ) : (
                                      <div className="content-file-upload">
                                        <input
                                          type="file"
                                          accept={content.type === 'video' ? 'video/*' : content.type === 'pdf' ? '.pdf' : 'image/*'}
                                          onChange={(e) => {
                                            const newData = [...modulesData];
                                            newData[mIndex].lessons[lIndex].contents[cIndex].file = e.target.files[0];
                                            setModulesData(newData);
                                          }}
                                          style={{ width: '100%', padding: '0.5rem', border: '1px dashed #cbd5e1', borderRadius: '6px', background: 'white' }}
                                        />
                                        {content.content_url && !content.file && (
                                          <div className="current-file-info" style={{ marginTop: '0.5rem' }}>
                                            Current: <a href={`${process.env.REACT_APP_API_URL}${content.content_url}`} target="_blank" rel="noreferrer">View File</a>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group checkbox-row">

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={courseFormData.is_expert_validated}
                      onChange={e => setCourseFormData({ ...courseFormData, is_expert_validated: e.target.checked })}
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
