export default function ChatQuickActions({ onActionClick, isDisabled }) {
  const quickActions = [
    { label: "📊 My Goals",       prompt: "Show me my health goals and completion stats" },
    { label: "💓 Heart Rate",     prompt: "What was my average heart rate this week?" },
    { label: "💡 Recommendations",prompt: "Show me my active health recommendations" },
    { label: "⚠️ Alerts",         prompt: "Do I have any unacknowledged health alerts?" },
    { label: "📈 Today's Summary",prompt: "Show me today's health summary" },
    { label: "📝 Provider Notes", prompt: "Show me recent notes from my healthcare provider" },
  ];

  return (
    <div className="flex-shrink-0 px-4 py-2.5 border-t border-white/[0.05] bg-[#0a0f1e]/30">
      <div className="max-w-3xl mx-auto">
        <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-2">Quick Actions</p>
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => onActionClick(action.prompt)}
              disabled={isDisabled}
              className="px-3 py-1.5 text-xs font-medium bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/45 hover:text-white/70 hover:border-indigo-500/30 hover:bg-indigo-500/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
