import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Video, FileText, Image, File, Upload, 
  ExternalLink, Sparkles, RefreshCw, CheckCircle, AlertCircle
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

  // Form states
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  const token = localStorage.getItem('sf_token');
  const headers = {
    'Authorization': `Bearer ${token}`
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
            <h3>Accepted Course Catalog</h3>
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

              <div className="materials-sections-grid">
                {/* Upload Form */}
                <div className="material-upload-card glass">
                  <h3>Upload Course Resource</h3>
                  <form onSubmit={handleUploadSubmit}>
                    <div className="form-group">
                      <label>Resource Title</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Week 1 Lecture Handout"
                        value={materialTitle}
                        onChange={e => setMaterialTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Resource Type</label>
                      <select 
                        value={materialType} 
                        onChange={e => {
                          setMaterialType(e.target.value);
                          setUploadFile(null);
                        }}
                      >
                        <option value="text">📄 Text Document / Outline</option>
                        <option value="pdf">🗂️ PDF File</option>
                        <option value="image">🖼️ Diagram / Image Reference</option>
                        <option value="video">🎥 Lecture Video (MP4)</option>
                      </select>
                    </div>

                    {materialType === 'text' ? (
                      <div className="form-group">
                        <label>Outline / Content Body</label>
                        <textarea 
                          required
                          placeholder="Write curriculum notes, reference URLs or outline notes here..."
                          value={textContent}
                          onChange={e => setTextContent(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="form-group file-drop-zone">
                        <label className="file-zone-label">
                          <Upload size={24} />
                          <span>Select a {materialType.toUpperCase()} file</span>
                          <input 
                            id="material-file-input"
                            type="file" 
                            required
                            accept={
                              materialType === 'pdf' ? '.pdf' :
                              materialType === 'image' ? 'image/*' :
                              materialType === 'video' ? 'video/*' : '*'
                            }
                            onChange={handleFileChange}
                          />
                        </label>
                        {uploadFile && (
                          <div className="selected-file-pill">
                            <File size={14} />
                            <span>{uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button type="submit" className="expert-submit-btn" disabled={uploading}>
                      {uploading ? (
                        <>
                          <RefreshCw className="spin" size={14} /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Upload Material
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Materials list */}
                <div className="material-list-card glass">
                  <h3>Uploaded Course Materials</h3>
                  
                  {loadingMaterials ? (
                    <div className="materials-loader">
                      <RefreshCw className="spin" size={24} />
                      <p>Loading catalog resources...</p>
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="empty-materials">
                      <FileText size={32} />
                      <p>No resources uploaded for this course yet.</p>
                      <small>Upload text syllabus, images, PDFs, or lecture videos using the panel on the left.</small>
                    </div>
                  ) : (
                    <div className="materials-scroller">
                      {materials.map(mat => (
                        <div key={mat.id} className="material-item glass">
                          <div className="material-item-header">
                            <div className="mat-type-icon">
                              {mat.type === 'text' && <FileText size={16} />}
                              {mat.type === 'pdf' && <File size={16} />}
                              {mat.type === 'image' && <Image size={16} />}
                              {mat.type === 'video' && <Video size={16} />}
                            </div>
                            <div className="mat-details">
                              <h4>{mat.title}</h4>
                              <span className="mat-date">{new Date(mat.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="material-item-content">
                            {mat.type === 'text' && (
                              <p className="mat-text-body">{mat.text_content}</p>
                            )}

                            {mat.type === 'image' && mat.content_url && (
                              <div className="mat-image-wrapper">
                                <img 
                                  src={`${process.env.REACT_APP_API_URL}${mat.content_url}`} 
                                  alt={mat.title} 
                                />
                                <a 
                                  href={`${process.env.REACT_APP_API_URL}${mat.content_url}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="mat-view-btn"
                                >
                                  <ExternalLink size={12} /> Open Full Image
                                </a>
                              </div>
                            )}

                            {mat.type === 'pdf' && mat.content_url && (
                              <div className="mat-file-wrapper">
                                <File size={28} color="#ef4444" />
                                <div>
                                  <span className="file-desc">Adobe Acrobat Document (PDF)</span>
                                  <a 
                                    href={`${process.env.REACT_APP_API_URL}${mat.content_url}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="mat-download-link"
                                  >
                                    <ExternalLink size={12} /> View / Download PDF
                                  </a>
                                </div>
                              </div>
                            )}

                            {mat.type === 'video' && mat.content_url && (
                              <div className="mat-video-wrapper">
                                <video controls>
                                  <source src={`${process.env.REACT_APP_API_URL}${mat.content_url}`} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </video>
                                <span className="video-desc">Curriculum Lecture video MP4</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-course-placeholder glass">
              <BookOpen size={48} />
              <h3>No Course Selected</h3>
              <p>Choose an accepted catalog course from the left menu to manage syllabus resources.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
