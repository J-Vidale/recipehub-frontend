import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const CommentAvatar = ({ user }) =>
  user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.username} className="avatar avatar-xs" />
  ) : (
    <span className="avatar avatar-xs">{user.username?.[0]?.toUpperCase()}</span>
  );

const CommentLikeButton = ({ commentId, initialLikeCount, initialLikedByMe }) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likedByMe, setLikedByMe] = useState(initialLikedByMe);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return <span className="text-xs text-gray-500">{likeCount} {likeCount === 1 ? "like" : "likes"}</span>;
  }

  const handleToggle = async () => {
    const previouslyLiked = likedByMe;
    const previousCount = likeCount;
    setLikedByMe(!previouslyLiked);
    setLikeCount(previousCount + (previouslyLiked ? -1 : 1));
    setBusy(true);
    try {
      const res = previouslyLiked
        ? await API.delete(`/comments/${commentId}/like`)
        : await API.post(`/comments/${commentId}/like`, {});
      setLikedByMe(res.data.likedByMe);
      setLikeCount(res.data.likeCount);
    } catch {
      setLikedByMe(previouslyLiked);
      setLikeCount(previousCount);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`text-xs disabled:opacity-60 ${likedByMe ? "text-pink-700 font-medium" : "text-gray-500 hover:text-gray-700"}`}
    >
      {likedByMe ? "♥" : "♡"} {likeCount} {likeCount === 1 ? "like" : "likes"}
    </button>
  );
};

const CommentSection = ({ recipeId, recipeOwnerId, pinnedCommentId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pinnedId, setPinnedId] = useState(pinnedCommentId || null);
  const [newText, setNewText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    setPinnedId(pinnedCommentId || null);
  }, [pinnedCommentId]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await API.get(`/recipes/${recipeId}/comments`);
        setComments(res.data);
      } catch (err) {
        console.error("Failed to fetch comments:", err);
        setError("Couldn't load comments.");
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [recipeId]);

  const topLevel = comments.filter((c) => !c.parentComment);
  const repliesFor = (commentId) => comments.filter((c) => c.parentComment === commentId);

  const isRecipeOwner = user && recipeOwnerId && user._id === recipeOwnerId;

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setPosting(true);
    try {
      const res = await API.post(`/recipes/${recipeId}/comments`, { text: newText.trim() });
      setComments((prev) => [...prev, res.data]);
      setNewText("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await API.post(`/recipes/${recipeId}/comments`, {
        text: replyText.trim(),
        parentComment: parentId,
      });
      setComments((prev) => [...prev, res.data]);
      setReplyText("");
      setReplyingTo(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post reply.");
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await API.delete(`/recipes/${recipeId}/comments/${commentId}`);
      setComments((prev) =>
        prev.filter((c) => c._id !== commentId && c.parentComment !== commentId)
      );
      if (pinnedId === commentId) setPinnedId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete comment.");
    }
  };

  const handlePinToggle = async (commentId) => {
    try {
      if (pinnedId === commentId) {
        await API.delete(`/recipes/${recipeId}/pin`);
        setPinnedId(null);
      } else {
        await API.post(`/recipes/${recipeId}/comments/${commentId}/pin`, {});
        setPinnedId(commentId);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update pin.");
    }
  };

  const orderedTopLevel = [...topLevel].sort((a, b) => {
    if (a._id === pinnedId) return -1;
    if (b._id === pinnedId) return 1;
    return 0;
  });

  const renderCommentActions = (comment) => {
    const canDelete = user && (user._id === comment.user._id || isRecipeOwner);
    return (
      <div className="flex items-center gap-3 mt-1">
        <CommentLikeButton
          commentId={comment._id}
          initialLikeCount={comment.likeCount || 0}
          initialLikedByMe={false}
        />
        {!comment.parentComment && user && (
          <button
            onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Reply
          </button>
        )}
        {!comment.parentComment && isRecipeOwner && (
          <button
            onClick={() => handlePinToggle(comment._id)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {pinnedId === comment._id ? "Unpin" : "Pin"}
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => handleDelete(comment._id)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h2 className="font-semibold text-lg mb-3">Comments</h2>

      {user ? (
        <form onSubmit={handlePost} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={1000}
            className="input flex-1"
          />
          <button type="submit" disabled={posting || !newText.trim()} className="btn-primary">
            {posting ? "Posting..." : "Post"}
          </button>
        </form>
      ) : (
        <p className="mb-4 text-sm text-gray-600">
          <Link to="/login" className="text-green-700 underline">Log in</Link> to comment.
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading comments...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : orderedTopLevel.length === 0 ? (
        <p className="text-gray-500">No comments yet. Be the first!</p>
      ) : (
        <ul className="space-y-4">
          {orderedTopLevel.map((comment) => (
            <li key={comment._id} className={pinnedId === comment._id ? "card-sm bg-yellow-50" : ""}>
              {pinnedId === comment._id && (
                <p className="text-xs font-medium text-yellow-700 mb-1">📌 Pinned</p>
              )}
              <div className="flex items-start gap-2">
                <CommentAvatar user={comment.user} />
                <div className="flex-1">
                  <p>
                    <Link to={`/users/${comment.user._id}`} className="font-semibold text-green-700">
                      {comment.user.username}
                    </Link>{" "}
                    {comment.text}
                  </p>
                  {renderCommentActions(comment)}

                  {replyingTo === comment._id && (
                    <form onSubmit={(e) => handleReply(e, comment._id)} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        maxLength={1000}
                        className="input flex-1 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={replying || !replyText.trim()}
                        className="btn-primary"
                      >
                        {replying ? "Posting..." : "Reply"}
                      </button>
                    </form>
                  )}

                  {repliesFor(comment._id).length > 0 && (
                    <ul className="ml-2 mt-3 space-y-3 border-l-2 border-gray-200 pl-3">
                      {repliesFor(comment._id).map((reply) => (
                        <li key={reply._id} className="flex items-start gap-2">
                          <CommentAvatar user={reply.user} />
                          <div>
                            <p>
                              <Link to={`/users/${reply.user._id}`} className="font-semibold text-green-700">
                                {reply.user.username}
                              </Link>{" "}
                              {reply.text}
                            </p>
                            {renderCommentActions(reply)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommentSection;
