import React, { useState, useEffect } from 'react';
import { Heart, Reply, Clock } from 'lucide-react';
import './CommentsSection.css';

const Comment = ({ comment, allComments, onReply, onLike }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const replies = allComments.filter(c => c.parent_comment_id === comment.id);

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(comment.id, replyText);
    setReplyText('');
    setShowReplyForm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.round((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
  };

  return (
    <div className="comment-thread">
      <div className="comment-node">
        <img 
          src={comment.user_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_name)}&background=random`} 
          alt="avatar" 
          className="comment-avatar"
        />
        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-author">{comment.user_name}</span>
            <span className="comment-time"><Clock size={12}/> {formatDate(comment.created_at)}</span>
          </div>
          <p className="comment-content">{comment.content}</p>
          <div className="comment-actions">
            <button className="c-btn" onClick={() => onLike(comment.id)}>
              <Heart size={14} /> {comment.likes}
            </button>
            <button className="c-btn" onClick={() => setShowReplyForm(!showReplyForm)}>
              <Reply size={14} /> Reply
            </button>
          </div>
          
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="reply-form">
              <input 
                type="text" 
                placeholder="Write a reply..." 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <button type="submit" disabled={!replyText.trim()}>Post</button>
            </form>
          )}
        </div>
      </div>
      
      {replies.length > 0 && (
        <div className="comment-children">
          {replies.map(r => (
            <Comment 
              key={r.id} 
              comment={r} 
              allComments={allComments} 
              onReply={onReply} 
              onLike={onLike} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentsSection = ({ proposalId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/community/proposals/${proposalId}/comments`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [proposalId]);

  const handlePost = async (parentId, content) => {
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL }/api/community/proposals/${proposalId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, parent_comment_id: parentId })
      });
      if (res.ok) {
        const added = await res.json();
        setComments([...comments, added]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (commentId) => {
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL }/api/community/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(comments.map(c => c.id === commentId ? { ...c, likes: data.likes } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rootComments = comments.filter(c => !c.parent_comment_id);

  return (
    <div className="comments-section">
      <form 
        className="main-comment-form" 
        onSubmit={(e) => { e.preventDefault(); if (newComment.trim()) { handlePost(null, newComment); setNewComment(''); } }}
      >
        <img 
          src={`https://ui-avatars.com/api/?name=Me&background=e2e8f0`} 
          alt="me" 
          className="comment-avatar"
        />
        <input 
          type="text" 
          placeholder="Add a public comment..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button type="submit" disabled={!newComment.trim()}>Post</button>
      </form>

      {loading ? (
        <div className="c-loading">Loading comments...</div>
      ) : (
        <div className="comments-list">
          {rootComments.map(c => (
            <Comment 
              key={c.id} 
              comment={c} 
              allComments={comments} 
              onReply={handlePost} 
              onLike={handleLike} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
