import { useState, useEffect } from 'react';
import './AiSpace.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FiClipboard } from 'react-icons/fi';

export const AiSpace = () => {
  const [userInput, setUserInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<{ text: string, type: 'incoming' | 'outgoing', isCode?: boolean }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    window.electron.initializeAI();
    
  }, []);

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    setChatHistory(prev => [...prev, { text: userInput, type: 'outgoing' }]);
    setLoading(true);

    // Add a placeholder with an identifier for typing indicator
    setChatHistory(prev => [...prev, { text: "", type: 'incoming', isLoading: true }]);

    try {
      const aiResponse = await (window as any).electron.chatWithAI(userInput);

      // Match code blocks using regex
      const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
      let match;
      let parts: { text: string; isCode?: boolean; language?: string }[] = [];
      let lastIndex = 0;

      while ((match = codeBlockRegex.exec(aiResponse)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ text: aiResponse.slice(lastIndex, match.index).trim() });
        }

        parts.push({
          text: match[2].trim(),
          isCode: true,
          language: match[1] || "plaintext",
        });

        lastIndex = codeBlockRegex.lastIndex;
      }

      if (lastIndex < aiResponse.length) {
        parts.push({ text: aiResponse.slice(lastIndex).trim() });
      }

      // Replace the last loading message with actual response
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: "incoming", parts };
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
            {msg.isLoading ? (
              <div className="loader-container">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            ) : msg.parts ? (
              msg.parts.map((part, i) =>
                part.isCode ? (
                  <div key={i} className="code-block">
                    <CopyToClipboard text={part.text}>
                      <button className="copy-button"><FiClipboard /></button>
                    </CopyToClipboard>
                    <pre><code className={`language-${part.language || "plaintext"}`}>{part.text}</code></pre>
                  </div>
                ) : (
                  <p key={i}>{part.text}</p>
                )
              )
            ) : (
              <p>{msg.text}</p>
            )}
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
        <button onClick={handleSubmit} disabled={loading || !userInput.trim()}>Send</button>
      </footer>
    </div>
  );
};