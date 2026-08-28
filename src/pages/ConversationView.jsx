import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const ConversationView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    API.get(`/conversations/${id}/messages`)
      .then((res) => {
        // Backend returns newest-first (cursor-pagination order); a chat
        // thread reads oldest-to-newest top-to-bottom.
        setMessages([...res.data.messages].reverse());
      })
      .catch((err) => {
        console.error("Failed to fetch messages:", err);
        setError("Couldn't load this conversation.");
      })
      .finally(() => setLoading(false));

    API.post(`/conversations/${id}/read`).catch((err) => {
      console.error("Failed to mark conversation as read:", err);
    });
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (payload) => {
      if (payload.conversationId !== id) return;
      setMessages((prev) => [...prev, payload.message]);
      API.post(`/conversations/${id}/read`).catch(() => {});
    };
    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [socket, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await API.post(`/conversations/${id}/messages`, { text: text.trim() });
      setMessages((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-2xl w-full mx-auto flex flex-col flex-1 py-6 px-4">
        <Link to="/messages" className="text-sm text-green-700 hover:underline mb-4">
          ← Back to messages
        </Link>
        <div className="flex-1 bg-white rounded-xl shadow p-4 mb-4 overflow-y-auto max-h-[60vh] space-y-2">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">No messages yet. Say hello!</p>
          ) : (
            messages.map((m) => {
              const isMine = m.sender === user._id || m.sender?._id === user._id;
              return (
                <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                      isMine ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="border p-2 rounded flex-1"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConversationView;
