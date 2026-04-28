"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdfRenderer } from "@/lib/adf-renderer";

interface JiraCommentData {
  id: string;
  body: Record<string, unknown>;
  created: string;
  updated: string;
  author: {
    accountId: string;
    emailAddress?: string;
    displayName: string;
    avatarUrls?: Record<string, string>;
  };
  isOwnComment?: boolean;
}

interface RetryItem {
  id: string;
  comment: string;
  file?: File;
  attempts: number;
  status: "sending" | "retrying" | "failed";
}

interface JiraTicketCommentsProps {
  ticketId: string;
  userEmail: string;
  userName: string;
  onUnreadCount?: (count: number) => void;
}

export function JiraTicketComments({ ticketId, userEmail, userName, onUnreadCount }: JiraTicketCommentsProps) {
  const { t } = useLanguage();
  const [comments, setComments] = useState<JiraCommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryQueue, setRetryQueue] = useState<RetryItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const prevCommentsCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastKnownCountRef = useRef<number>(0);

  const fetchComments = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/tickets/${ticketId}/jira-comments`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load comments");
      }

      const data = await response.json();
      const fetched: JiraCommentData[] = data.comments || [];
      setComments(fetched);

      const receivedCount = fetched.filter((c) => !c.isOwnComment).length;
      if (receivedCount > lastKnownCountRef.current && !isInitialLoadRef.current) {
        onUnreadCount?.(receivedCount - lastKnownCountRef.current);
      }
      lastKnownCountRef.current = receivedCount;
    } catch (err) {
      console.error("Error fetching Jira comments:", err);
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, onUnreadCount]);

  const sendComment = useCallback(async (text: string, file?: File, retryId?: string) => {
    const tempId = retryId || `temp-${Date.now()}`;

    if (!retryId) {
      setRetryQueue((prev) => [
        ...prev,
        { id: tempId, comment: text, file, attempts: 1, status: "sending" },
      ]);
    }

    try {
      let response: Response;

      if (file) {
        const formData = new FormData();
        formData.append("comment", text);
        formData.append("file", file);
        response = await fetch(`/api/tickets/${ticketId}/jira-comments`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`/api/tickets/${ticketId}/jira-comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: text }),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      setRetryQueue((prev) => prev.filter((item) => item.id !== tempId));
      await fetchComments();
    } catch {
      setRetryQueue((prev) =>
        prev.map((item) => {
          if (item.id !== tempId) return item;
          const newAttempts = item.attempts + (retryId ? 1 : 0);
          if (newAttempts >= 3) {
            return { ...item, attempts: newAttempts, status: "failed" as const };
          }
          setTimeout(() => sendComment(text, file, tempId), 2000 * newAttempts);
          return { ...item, attempts: newAttempts, status: "retrying" as const };
        })
      );
    }
  }, [ticketId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const text = newComment.trim();
    const file = selectedFile || undefined;
    setNewComment("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    await sendComment(text, file);
  };

  const handleRetry = (item: RetryItem) => {
    setRetryQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, attempts: 0, status: "sending" as const } : q))
    );
    sendComment(item.comment, item.file, item.id);
  };

  const dismissRetry = (id: string) => {
    setRetryQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return `${diffMins} ${t("minutesAgo")}`;
    if (diffHours < 24) return `${diffHours} ${t("hoursAgo")}`;
    if (diffDays < 7) return `${diffDays} ${t("daysAgo")}`;

    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 30000);
    return () => clearInterval(interval);
  }, [fetchComments]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      if (!isLoading) {
        isInitialLoadRef.current = false;
        prevCommentsCountRef.current = comments.length;
      }
      return;
    }
    if (comments.length > prevCommentsCountRef.current && prevCommentsCountRef.current > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCommentsCountRef.current = comments.length;
  }, [comments, isLoading]);

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            💬 {t("developerMessages") || t("messages")}
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
            title={t("refresh")}
          >
            🔄 {t("refresh")}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {isLoading && comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-pulse">{t("loadingMessages")}</div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">💬</p>
            <p>{t("noJiraComments") || t("noMessages")}</p>
            <p className="text-sm">{t("jiraMessagesHelp") || t("noMessagesHelp")}</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.isOwnComment;

            return (
              <div
                key={comment.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 bg-blue-500"
                >
                  {comment.author.avatarUrls?.["24x24"] ? (
                    <img
                      src={comment.author.avatarUrls["24x24"]}
                      alt={comment.author.displayName}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    getInitials(comment.author.displayName)
                  )}
                </div>

                <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`font-medium text-sm text-gray-900 ${isOwn ? "order-2" : ""}`}>
                      {isOwn ? t("you") : comment.author.displayName}
                    </span>
                    <span className={`text-xs text-gray-500 ${isOwn ? "order-1" : ""}`}>
                      {formatDate(comment.created)}
                    </span>
                  </div>
                  <div
                    className={`inline-block px-4 py-2 rounded-lg max-w-[85%] ${
                      isOwn
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {isOwn ? (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {extractOwnText(comment.body)}
                      </p>
                    ) : (
                      <AdfRenderer document={comment.body} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {retryQueue.map((item) => (
          <div key={item.id} className="flex gap-3 flex-row-reverse">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 bg-gray-400">
              {getInitials(userName || "U")}
            </div>
            <div className="flex-1 text-right">
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
                  item.status === "failed"
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-blue-300 text-white"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{item.comment}</p>
                {item.file && (
                  <p className="text-xs mt-1 opacity-75">📎 {item.file.name}</p>
                )}
                <div className="text-xs mt-1 flex items-center justify-end gap-2">
                  {item.status === "sending" && <span>{t("sendingFailed") ? "⏳" : "⏳"}</span>}
                  {item.status === "retrying" && (
                    <span>🔄 {t("retrying") || "Opnieuw proberen..."}</span>
                  )}
                  {item.status === "failed" && (
                    <>
                      <span>❌ {t("sendingFailed") || "Verzenden mislukt"}</span>
                      <button
                        onClick={() => handleRetry(item)}
                        className="underline font-medium"
                      >
                        {t("retry") || "Opnieuw"}
                      </button>
                      <button
                        onClick={() => dismissRetry(item.id)}
                        className="underline opacity-75"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div ref={commentsEndRef} />
      </div>

      {error && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("typeMessage")}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {t("send")}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              id={`jira-file-${ticketId}`}
            />
            <label
              htmlFor={`jira-file-${ticketId}`}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer flex items-center gap-1"
            >
              📎 {t("attachFile") || "Bijlage toevoegen"}
            </label>
            {selectedFile && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                {selectedFile.name}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          💡 {t("messageNotification")}
        </p>
      </div>
    </div>
  );
}

function extractOwnText(body: Record<string, unknown>): string {
  const doc = body as { content?: Array<{ content?: Array<{ text?: string }> }> };
  const firstText = doc?.content?.[0]?.content?.[0]?.text || "";
  const prefixMatch = firstText.match(/^\[.*?\]:\s*/);
  return prefixMatch ? firstText.slice(prefixMatch[0].length) : firstText;
}
