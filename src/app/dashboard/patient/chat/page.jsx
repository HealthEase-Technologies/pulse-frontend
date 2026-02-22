"use client";

import { useState, useEffect, useRef } from "react";
import { sendChatMessage, getChatHistory, clearChatHistory, getCurrentUser } from "@/services/api_calls";
import MessageMarkdown from "@/components/MessageMarkdown";
import ChatQuickActions from "@/components/ChatQuickActions";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [userName, setUserName] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history and user info on mount
  useEffect(() => {
    loadChatHistory();
    loadUserName();
  }, []);

  const loadUserName = async () => {
    try {
      const user = await getCurrentUser();
      if (user?.full_name) {
        // Get first name only
        setUserName(user.full_name.split(" ")[0]);
      }
    } catch (error) {
      console.error("Failed to load user name:", error);
      setUserName("there");
    }
  };

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const history = await getChatHistory();
      setMessages(history.messages || []);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear all chat history?")) {
      return;
    }

    try {
      await clearChatHistory();
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear chat history:", error);
      alert("Failed to clear chat history");
    }
  };

  const handleQuickAction = (prompt) => {
    if (isStreaming) return;
    setInputMessage(prompt);
    // Auto-submit the quick action
    handleSendMessage(null, prompt);
  };

  const handleSendMessage = async (e, quickPrompt = null) => {
    if (e) e.preventDefault();

    const userMessage = quickPrompt || inputMessage.trim();
    if (!userMessage || isStreaming) return;

    setInputMessage("");

    // Add user message to UI immediately
    const newUserMessage = {
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsStreaming(true);

    // Add placeholder for assistant message
    const assistantMessageId = Date.now();
    const assistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Call API and get response
      const response = await sendChatMessage(userMessage);

      // Simulate typing effect
      let currentIndex = 0;
      const typingSpeed = 10; // milliseconds per character

      const typeCharacter = () => {
        if (currentIndex <= response.length) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: response.substring(0, currentIndex),
                    isStreaming: currentIndex < response.length
                  }
                : msg
            )
          );
          currentIndex++;

          if (currentIndex <= response.length) {
            setTimeout(typeCharacter, typingSpeed);
          } else {
            setIsStreaming(false);
          }
        }
      };

      typeCharacter();
    } catch (error) {
      console.error("Failed to send message:", error);

      // Show error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "Sorry, I encountered an error. Please try again.",
                isStreaming: false,
                isError: true,
              }
            : msg
        )
      );
    } finally {
      // Don't set isStreaming to false here - the typing effect handles it
      inputRef.current?.focus();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pulse AI Chat</h1>
            <p className="text-sm text-gray-600 mt-1">
              Your personal health assistant
            </p>
          </div>
          <button
            onClick={handleClearHistory}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            disabled={messages.length === 0}
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Message */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
                <svg
                  className="w-12 h-12 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Hi {userName || "there"}! 👋
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                I'm Pulse AI, your personal health assistant. I can help you
                track your health data, understand your progress, and achieve
                your health goals!
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    📊 Ask about your data
                  </h3>
                  <p className="text-sm text-gray-600">
                    "What was my average heart rate last week?"
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    🎯 Track your goals
                  </h3>
                  <p className="text-sm text-gray-600">
                    "Show me my goal completion rate this month"
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    💡 Get recommendations
                  </h3>
                  <p className="text-sm text-gray-600">
                    "What are my active health recommendations?"
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    📈 View trends
                  </h3>
                  <p className="text-sm text-gray-600">
                    "How has my glucose changed this month?"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-gray-600 mt-4">Loading chat history...</p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
                    : message.isError
                    ? "bg-red-50 text-red-900 border border-red-200 rounded-2xl rounded-tl-sm"
                    : "bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-tl-sm"
                } px-4 py-3 shadow-sm`}
              >
                <div className="break-words">
                  {message.role === "user" ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <MessageMarkdown content={message.content} />
                  )}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse"></span>
                  )}
                </div>
                {message.created_at && (
                  <div
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-indigo-200"
                        : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      <ChatQuickActions
        onActionClick={handleQuickAction}
        isDisabled={isStreaming}
      />

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              isStreaming
                ? "Pulse AI is thinking..."
                : "Ask me anything about your health..."
            }
            disabled={isStreaming}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isStreaming}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
