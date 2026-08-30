import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useSocket } from "../context/SocketContext";
import Seo from "../components/Seo";

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const fetchConversations = () => {
    API.get("/conversations")
      .then((res) => setConversations(res.data.conversations))
      .catch((err) => {
        console.error("Failed to fetch conversations:", err);
        setError("Couldn't load your messages. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;
    // A new message can change conversation ordering (most-recently-active
    // first) or create a conversation not yet in the list - simplest
    // correct response is to re-fetch rather than try to patch the list.
    const handleNewMessage = () => fetchConversations();
    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [socket]);

  return (
    <div className="page-container max-w-2xl">
      <Seo title="Messages" description="Your direct message conversations on RecipeHub." noindex />
      <h1 className="text-2xl font-bold text-green-700 mb-6">Messages</h1>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : conversations.length === 0 ? (
        <p className="text-gray-600">No conversations yet.</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c._id}>
              <Link to={`/messages/${c._id}`} className="card-sm card-hover flex items-center gap-3">
                {c.otherUser?.avatarUrl ? (
                  <img src={c.otherUser.avatarUrl} alt={c.otherUser.username} className="avatar avatar-sm" />
                ) : (
                  <span className="avatar avatar-sm">{c.otherUser?.username?.[0]?.toUpperCase()}</span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold">{c.otherUser?.username}</p>
                  <p className="text-sm text-gray-600 truncate">{c.lastMessageText}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Messages;
