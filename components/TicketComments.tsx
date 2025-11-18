"use client";

import { useState, useEffect, useRef } from "react";

interface Comment {
  id: string;
  comment_text: string;
  date: number;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    color?: string;
    profilePicture?: string;
  };
}

interface TicketCommentsProps {
  ticketId: string;
  userEmail: string;
}

export function TicketComments({ ticketId, userEmail }: TicketCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments
  const fetchComments = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/tickets/${ticketId}/comments`);
      
      if (!response.ok) {
        throw new Error("Failed to load comments");
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit new comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: newComment }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      const data = await response.json();
      setComments([...comments, data.comment]);
      setNewComment("");
      
      // Scroll to bottom
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Error posting comment:", err);
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(parseInt(timestamp.toString()));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Zojuist";
    if (diffMins < 60) return `${diffMins} minuten geleden`;
    if (diffHours < 24) return `${diffHours} uur geleden`;
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get initials from username
  const getInitials = (username: string): string => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Load comments on mount
  useEffect(() => {
    fetchComments();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchComments, 30000);
    return () => clearInterval(interval);
  }, [ticketId]);

  // Scroll to bottom when comments change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            💬 Berichten
            {comments.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({comments.length})
              </span>
            )}
          </h2>
          <button
            onClick={fetchComments}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            title="Ververs berichten"
          >
            🔄 Ververs
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {isLoading && comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-pulse">Berichten laden...</div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">💬</p>
            <p>Nog geen berichten.</p>
            <p className="text-sm">Stel een vraag of laat een bericht achter!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isCurrentUser = comment.user?.email?.toLowerCase() === userEmail.toLowerCase();
            
            return (
              <div
                key={comment.id}
                className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                  style={{ backgroundColor: comment.user?.color || "#3b82f6" }}
                >
                  {comment.user?.profilePicture ? (
                    <img
                      src={comment.user.profilePicture}
                      alt={comment.user?.username || "User"}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    getInitials(comment.user?.username || "User")
                  )}
                </div>

                {/* Message */}
                <div className={`flex-1 ${isCurrentUser ? "text-right" : ""}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`font-medium text-sm text-gray-900 ${isCurrentUser ? "order-2" : ""}`}>
                      {isCurrentUser ? "Jij" : (comment.user?.username || "Gebruiker")}
                    </span>
                    <span className={`text-xs text-gray-500 ${isCurrentUser ? "order-1" : ""}`}>
                      {formatDate(comment.date)}
                    </span>
                  </div>
                  <div
                    className={`inline-block px-4 py-2 rounded-lg ${
                      isCurrentUser
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {comment.comment_text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Typ een bericht..."
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? "..." : "Verzenden"}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          💡 Je bericht wordt verzonden naar alle betrokkenen bij dit ticket
        </p>
      </div>
    </div>
  );
}

