import { useState, useCallback } from 'react';
import { HiReply, HiTrash, HiThumbUp, HiChevronDown, HiChevronRight } from 'react-icons/hi';

// F1.4: Recursive comment component with deep nested state updates
let commentIdCounter = 100;

// Single recursive comment node
function CommentNode({ comment, onReply, onDelete, onLike, depth = 0 }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText('');
    setShowReply(false);
  };

  const maxDepth = 6;
  const indent = Math.min(depth, maxDepth);

  return (
    <div style={{ marginLeft: indent * 20 }} className="mt-3">
      <div className="glass-card p-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: `hsl(${(comment.author.charCodeAt(0) * 37) % 360}, 60%, 50%)`, color: '#fff' }}>
            {comment.author.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{comment.author}</span>
              <span className="text-xs text-[var(--text-secondary)]">{comment.time}</span>
            </div>
            <p className="text-sm mt-1 break-words">{comment.text}</p>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => onLike(comment.id)} className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors">
                <HiThumbUp /> {comment.likes || 0}
              </button>
              <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors">
                <HiReply /> Reply
              </button>
              <button onClick={() => onDelete(comment.id)} className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                <HiTrash />
              </button>
              {comment.replies?.length > 0 && (
                <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors">
                  {collapsed ? <HiChevronRight /> : <HiChevronDown />} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
            {/* Reply input */}
            {showReply && (
              <div className="flex gap-2 mt-2">
                <input className="form-control text-sm flex-1" placeholder="Write a reply..."
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReply()} />
                <button className="btn btn-primary btn-sm" onClick={handleReply}>Send</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* F1.4: Recursively render nested replies */}
      {!collapsed && comment.replies?.map(reply => (
        <CommentNode key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} onLike={onLike} depth={depth + 1} />
      ))}
    </div>
  );
}

// F1.4: Deep nested state update helpers
function addReplyDeep(comments, parentId, newReply) {
  return comments.map(c => {
    if (c.id === parentId) {
      return { ...c, replies: [...(c.replies || []), newReply] };
    }
    if (c.replies?.length) {
      return { ...c, replies: addReplyDeep(c.replies, parentId, newReply) };
    }
    return c;
  });
}

function deleteDeep(comments, targetId) {
  return comments
    .filter(c => c.id !== targetId)
    .map(c => c.replies?.length ? { ...c, replies: deleteDeep(c.replies, targetId) } : c);
}

function likeDeep(comments, targetId) {
  return comments.map(c => {
    if (c.id === targetId) return { ...c, likes: (c.likes || 0) + 1 };
    if (c.replies?.length) return { ...c, replies: likeDeep(c.replies, targetId) };
    return c;
  });
}

// Seed data
const SEED = [
  {
    id: 1, author: 'Dr. Smith', text: 'Great work on the Newton\'s Laws simulation! The force vectors were very clear.', time: '2 hours ago', likes: 5,
    replies: [
      {
        id: 2, author: 'Alex', text: 'Thank you! I spent a lot of time getting the arrow directions right.', time: '1 hour ago', likes: 2,
        replies: [
          { id: 3, author: 'Dr. Smith', text: 'It shows. Consider adding friction next.', time: '45 min ago', likes: 1, replies: [] },
        ],
      },
      { id: 4, author: 'Maya', text: 'Could you share the formula you used for the net force calculation?', time: '30 min ago', likes: 0, replies: [] },
    ],
  },
  {
    id: 5, author: 'Prof. Chen', text: 'Reminder: Wave optics assignment is due Friday. Show all diffraction calculations.', time: '3 hours ago', likes: 8,
    replies: [],
  },
];

export default function RecursiveComment() {
  const [comments, setComments] = useState(SEED);
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('Student');

  const handleAddRoot = () => {
    if (!newComment.trim()) return;
    const c = {
      id: ++commentIdCounter,
      author,
      text: newComment.trim(),
      time: 'Just now',
      likes: 0,
      replies: [],
    };
    setComments(prev => [c, ...prev]);
    setNewComment('');
  };

  const handleReply = useCallback((parentId, text) => {
    const reply = { id: ++commentIdCounter, author, text, time: 'Just now', likes: 0, replies: [] };
    setComments(prev => addReplyDeep(prev, parentId, reply));
  }, [author]);

  const handleDelete = useCallback((id) => {
    setComments(prev => deleteDeep(prev, id));
  }, []);

  const handleLike = useCallback((id) => {
    setComments(prev => likeDeep(prev, id));
  }, []);

  // Count total including nested
  const countAll = (arr) => arr.reduce((sum, c) => sum + 1 + countAll(c.replies || []), 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Discussion Board</h2>
          <p className="subtitle">F1.4 — Recursive comments with deep nested state updates ({countAll(comments)} comments)</p>
        </div>
      </div>

      {/* New comment */}
      <div className="glass-card p-4">
        <div className="flex gap-2 mb-3">
          <input className="form-control w-40" placeholder="Your name" value={author} onChange={e => setAuthor(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <input className="form-control flex-1" placeholder="Write a comment..." value={newComment}
            onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddRoot()} />
          <button className="btn btn-primary" onClick={handleAddRoot}>Post</button>
        </div>
      </div>

      {/* Comment tree */}
      <div>
        {comments.map(comment => (
          <CommentNode key={comment.id} comment={comment} onReply={handleReply} onDelete={handleDelete} onLike={handleLike} />
        ))}
      </div>
    </div>
  );
}
