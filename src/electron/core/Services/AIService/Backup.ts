import { useState, useEffect, KeyboardEvent } from 'react';
import './AiSpace.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FiClipboard, FiPauseCircle } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

interface ChatResponsePart {
  text: string;
  isCode?: boolean;
  language?: string;
}

interface ChatMessage {
  type: 'incoming' | 'outgoing';
  text?: string;
  parts?: ChatResponsePart[];
  isLoading?: boolean;
}

export const AiSpace = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [webSearchContext, setWebSearchContext] = useState("");

  useEffect(() => {
    window.electron.invokeCommand("ai:initialize");
  }, []);

  const parseAiResponse = (response: string): ChatResponsePart[] => {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts: ChatResponsePart[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      if (match.index > lastIndex) {
        const textSegment = response.slice(lastIndex, match.index).trim();
        if (textSegment) parts.push({ text: textSegment });
      }
      parts.push({
        text: match[2].trim(),
        isCode: true,
        language: match[1] || "plaintext",
      });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < response.length) {
      const remainingText = response.slice(lastIndex).trim();
      if (remainingText) parts.push({ text: remainingText });
    }
    return parts;
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    setChatHistory((prev) => [...prev, { text: userInput, type: 'outgoing' }]);
    setLoading(true);

    setChatHistory((prev) => [...prev, { type: 'incoming', isLoading: true }]);

    try {
      const prompt = webSearchContext
        ? `Relevant web context:\n${webSearchContext}\n\nUser query:\n${userInput}`
        : userInput;

      const aiResponse = await window.electron.invokeCommand("ai:chat", prompt);
      const parts = parseAiResponse(aiResponse);

      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: 'incoming', parts };
        return updated;
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      setChatHistory((prev) => [...prev, { text: "Error getting response.", type: 'incoming' }]);
    } finally {
      setLoading(false);
      setUserInput("");
      setWebSearchContext("");
    }
  };

  const handleCloseChatSession = async () => {
    try {
      await window.electron.invokeCommand("ai:close");
    } catch (error) {
      console.error("Error closing AI session:", error);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatHistory]);

  return (
    // <div className="ai-space">
    //   <header className="ai-space-header">
    //     <h2>Omini Chat</h2>
    //   </header>
    //   <main className="ai-space-main" id="chat-container">
    //     {chatHistory.map((msg, index) => (
    //       <div key={index} className={`chat-bubble ${msg.type}`}>
    //         {msg.isLoading ? (
    //           <div className="loader-container">
    //             <div className="typing-indicator">
    //               <span></span>
    //               <span></span>
    //               <span></span>
    //             </div>
    //           </div>
    //         ) : msg.parts ? (
    //           msg.parts.map((part, i) =>
    //             part.isCode ? (
    //               <div key={i} className="code-block">
    //                 <CopyToClipboard text={part.text}>
    //                   <button className="copy-button">
    //                     <FiClipboard />
    //                   </button>
    //                 </CopyToClipboard>
    //                 <pre>
    //                   <code className={`language-${part.language}`}>{part.text}</code>
    //                 </pre>
    //               </div>
    //             ) : (
    //               <div key={i} className="markdown-text">
    //                 <ReactMarkdown>{part.text}</ReactMarkdown>
    //               </div>
    //             )
    //           )
    //         ) : (
    //           <div className="markdown-text">
    //             <ReactMarkdown>{msg.text || ""}</ReactMarkdown>
    //           </div>
    //         )}
    //       </div>
    //     ))}
    //   </main>
    //   <footer className="ai-space-footer">
    //     <input
    //       type="text"
    //       placeholder="Your chat here..."
    //       value={userInput}
    //       onChange={(e) => setUserInput(e.target.value)}
    //       onKeyDown={handleKeyPress}
    //     />
    //     <div className="button-group">
    //       <button onClick={handleSubmit} disabled={loading || !userInput.trim()}>
    //         Send
    //       </button>
    //       <button onClick={handleCloseChatSession}>
    //         <FiPauseCircle />
    //       </button>
    //     </div>
    //   </footer>
    // </div>
  );
};
