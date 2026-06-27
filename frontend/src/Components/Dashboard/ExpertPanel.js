import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Video, FileText, Image, File, Upload, 
  ExternalLink, Sparkles, RefreshCw, CheckCircle, AlertCircle, Plus, X, Trash2, Edit, Star
} from 'lucide-react';
import './ExpertPanel.css';

export default function ExpertPanel({ user }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  
  // Loading & states
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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

  // Form states
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  const token = localStorage.getItem('sf_token');
  const headers = {
    'Authorization': `Bearer ${token}`
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

  const fetchCourses = async () => {
    setLoadingCourses(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/expert/courses`, { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('sf_token');
          localStorage.removeItem('sf_user');
          window.location.reload();
          return;
        }
        throw new Error('Failed to fetch courses');
      }
      const data = await res.json();
      setCourses(data);
      if (data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchMaterials = async (courseId) => {
    setLoadingMaterials(true);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/expert/courses/${courseId}/materials`, { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('sf_token');
          localStorage.removeItem('sf_user');
          window.location.reload();
          return;
        }
        throw new Error('Failed to fetch course materials');
      }
      const data = await res.json();
      setMaterials(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials(selectedCourse.id);
      // Reset upload form
      setMaterialTitle('');
      setMaterialType('text');
      setTextContent('');
      setUploadFile(null);
    }
  }, [selectedCourse]);

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!materialTitle.trim()) {
      alert("Please enter a title for the material.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('title', materialTitle);
    formData.append('type', materialType);

    if (materialType === 'text') {
      formData.append('text_content', textContent);
    } else {
      if (!uploadFile) {
        alert("Please select a file to upload.");
        setUploading(false);
        return;
      }
      formData.append('file', uploadFile);
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/expert/courses/${selectedCourse.id}/materials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Failed to upload material');

      setSuccessMsg("Material added successfully!");
      setMaterialTitle('');
      setTextContent('');
      setUploadFile(null);
      
      // Reset file input element
      const fileInput = document.getElementById('material-file-input');
      if (fileInput) fileInput.value = '';

      fetchMaterials(selectedCourse.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Course Management
  const fetchCourseMaterialsAdmin = async (courseId) => {
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
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(coreData)
      });

      if (!res.ok) throw new Error('Failed to save course');
      
      setIsCourseModalOpen(false);
      fetchCourses();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="expert-panel-container">
      <div className="expert-header">
        <div className="expert-title-row">
          <Sparkles className="expert-icon-main" size={28} />
          <div>
            <h1 className="expert-title">Expert Validation Hub</h1>
            <p className="expert-subtitle">Provide rich educational media, notes, and references for accepted curriculum courses</p>
          </div>
        </div>
      </div>

      {error && <div className="expert-error-alert"><AlertCircle size={16} /> {error}</div>}
      {successMsg && <div className="expert-success-alert"><CheckCircle size={16} /> {successMsg}</div>}

      <div className="expert-workspace-grid">
        {/* Left column: Courses list */}
        <div className="expert-courses-sidebar glass">
          <div className="workspace-card-header">
            <div style={{display:"flex", justifyContent:"space-between", width:"100%", alignItems:"center"}}>
              <h3>Course Catalog</h3>
              <button className="expert-reload-btn" style={{backgroundColor:"#0ea5e9", color:"white", padding:"0.4rem 0.8rem", borderRadius:"6px", border:"none", display:"flex", gap:"0.3rem", cursor:"pointer"}} onClick={() => handleOpenCourseModal(null)}>
                <Plus size={14} /> Add Course
              </button>
            </div>
            <button className="expert-reload-btn" onClick={fetchCourses} disabled={loadingCourses}>
              <RefreshCw size={14} className={loadingCourses ? "spin" : ""} />
            </button>
          </div>

          {loadingCourses ? (
            <div className="expert-sidebar-loader">
              <RefreshCw className="spin" size={24} />
              <p>Fetching courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <p className="no-data-msg">No live/accepted courses found.</p>
          ) : (
            <div className="expert-course-list">
              {courses.map(course => (
                <div 
                  key={course.id}
                  className={`expert-course-item ${selectedCourse?.id === course.id ? 'active' : ''}`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="course-item-icon">
                    <BookOpen size={16} />
                  </div>
                  <div className="course-item-details">
                    <span className="course-item-title">{course.title}</span>
                    <span className="course-item-cat">{course.category} · {course.hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Materials details and uploads */}
        <div className="expert-details-pane">
          {selectedCourse ? (
            <div className="selected-course-workspace">
              <div className="course-pane-header glass">
                <span className="course-pane-category">{selectedCourse.category}</span>
                <h2>{selectedCourse.title}</h2>
                <p>{selectedCourse.description}</p>
              </div>

              <div className="course-modules-viewer">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Course Curriculum</h3>
                  <button 
                    className="admin-btn-action primary" 
                    onClick={() => handleOpenCourseModal(selectedCourse)}
                    style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    <Edit size={16} /> Edit Course
                  </button>
                </div>
                
                {selectedCourse.modules_data && selectedCourse.modules_data.length > 0 ? (
                  <div className="modules-list">
                    {selectedCourse.modules_data.map((mod, mIdx) => (
                      <div key={mod.id || mIdx} className="module-viewer-card glass" style={{ marginBottom: '1rem', padding: '1.5rem', borderRadius: '8px' }}>
                        <h4 style={{ color: '#1e293b', marginBottom: '1rem', fontSize: '1.1rem' }}>
                          Module {mIdx + 1}: {mod.title}
                        </h4>
                        <div className="lessons-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          {mod.lessons && mod.lessons.map((less, lIdx) => (
                            <div key={less.id || lIdx} className="lesson-viewer-card" style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.5)', borderLeft: '4px solid #0ea5e9', borderRadius: '4px' }}>
                              <h5 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>Lesson {lIdx + 1}: {less.title}</h5>
                              <div className="contents-list" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {less.contents && less.contents.map((content, cIdx) => (
                                  <span key={content.id || cIdx} className="content-badge" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', backgroundColor: '#e2e8f0', borderRadius: '12px', color: '#475569' }}>
                                    {content.type.toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-materials glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '8px' }}>
                    <BookOpen size={32} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#64748b' }}>No curriculum built for this course yet.</p>
                    <button 
                      onClick={() => handleOpenCourseModal(selectedCourse)}
                      style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: 'transparent', border: '1px solid #0ea5e9', color: '#0ea5e9', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Build Curriculum
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="expert-catalog-wrapper glass" style={{padding: '2rem'}}>
              <h2 style={{marginBottom: '1rem'}}>Live Course Catalog</h2>
            
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
                  {courses.map(c => (
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

                          <button className="admin-row-btn delete" onClick={() => handleDeleteCourse(c.id)}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            
            </div>
          )}
        </div>
      </div>
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
