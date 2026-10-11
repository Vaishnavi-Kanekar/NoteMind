export default function MessageBubble({ message }) {
  const { sender, text, timestamp } = message;
  const isUser = sender === "user";

  return (
    <div className={`message-row ${isUser ? "user-message" : "ai-message"}`}>
      <span className="message-avatar">
        {isUser ? "👤 You" : "🤖 Assistant"}
      </span>
      <p className="message-text-bubble">{text}</p>
      {timestamp && (
        <span style={{ 
          fontSize: "0.7rem", 
          opacity: 0.6, 
          marginTop: "0.4rem", 
          alignSelf: isUser ? "flex-end" : "flex-start" 
        }}>
          {timestamp}
        </span>
      )}
    </div>
  );
}