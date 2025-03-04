import React, { useState, useEffect } from 'react';
import './AiSpace.css';

export const AiSpace = () => {
  const [userInput, setUserInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<{ text: string, type: 'incoming' | 'outgoing' }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize AI when the component mounts
  useEffect(() => {
    window.electron.initializeAI();
  }, []);

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    // Append user's message
    setChatHistory(prev => [...prev, { text: userInput, type: 'outgoing' }]);
    setLoading(true);

    // Add a placeholder for the AI's response (loading indicator)
    setChatHistory(prev => [...prev, { text: "", type: 'incoming' }]);

    try {
      // Call the backend AI chat function
      const aiResponse = await (window as any).electron.chatWithAI(userInput);

      // Update chat history with AI response
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { text: aiResponse, type: 'incoming' };
        return updated;
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      setChatHistory(prev => [...prev, { text: "Error getting response.", type: 'incoming' }]);
    } finally {
      setLoading(false);
      setUserInput("");
    }
  };

  // Auto-scroll chat area to the bottom when new messages are added
  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="ai-space">
      <header className="ai-space-header">
        <h2>Omini Chat</h2>
      </header>
      <main className="ai-space-main" id="chat-container">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.type}`}>
            {msg.text || (loading && index === chatHistory.length - 1 ? (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : null)}
          </div>
        ))}
      </main>
      <footer className="ai-space-footer">
        <input
          type="text"
          placeholder="Your chat here..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button onClick={handleSubmit} disabled={loading || !userInput.trim()}>
          Send
        </button>
      </footer>
    </div>
  );
};
