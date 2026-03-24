/**
 * Quick Action Buttons for Chat
 * Provides interactive buttons for common actions
 */

export default function ChatQuickActions({ onActionClick, isDisabled }) {
  const quickActions = [
    { label: "📊 My Goals", prompt: "Show me my health goals and completion stats" },
    { label: "💓 Heart Rate", prompt: "What was my average heart rate this week?" },
    { label: "💡 Recommendations", prompt: "Show me my active health recommendations" },
    { label: "⚠️ Alerts", prompt: "Do I have any unacknowledged health alerts?" },
    { label: "📈 Today's Summary", prompt: "Show me today's health summary" },
    { label: "📝 Provider Notes", prompt: "Show me recent notes from my healthcare provider" },
  ];

  return (
    <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs text-gray-600 mb-2 font-medium">Quick Actions:</p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => onActionClick(action.prompt)}
              disabled={isDisabled}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
