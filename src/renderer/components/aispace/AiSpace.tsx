
import { useState, useEffect, KeyboardEvent } from 'react';
import './AiSpace.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FiClipboard,FiPauseCircle } from 'react-icons/fi';
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
  const [userInput, setUserInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [webSearchContext, setWebSearchContext] = useState<string>("");

  useEffect(() => {
    window.electron.invokeCommand("ai:initialize");
  }, []);

  /**
   * Parses the raw AI response into parts of plain text or code blocks.
   */
  const parseAiResponse = (response: string): ChatResponsePart[] => {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts: ChatResponsePart[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      // Capture text before the code block.
      if (match.index > lastIndex) {
        const textSegment = response.slice(lastIndex, match.index).trim();
        if (textSegment) {
          parts.push({ text: textSegment });
        }
      }
      // Capture the code block.
      parts.push({
        text: match[2].trim(),
        isCode: true,
        language: match[1] || "plaintext",
      });
      lastIndex = codeBlockRegex.lastIndex;
    }
    // Capture any remaining text.
    console.log("response : " + response)
    if (lastIndex < response.length) {
      const remainingText = response.slice(lastIndex).trim();
      if (remainingText) {
        parts.push({ text: remainingText });
      }
    }
    return parts;
  };

  /**
   * Handles sending the chat prompt to the AI, optionally including web search context.
   */
  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    // Append user's message to chat.
    setChatHistory(prev => [...prev, { text: userInput, type: 'outgoing' }]);
    setLoading(true);

    // Add a loading placeholder.
    setChatHistory(prev => [...prev, { type: 'incoming', isLoading: true }]);

    try {
      // Combine the web search context with the user's input.
      // You might want to format it, for example:
      // "Relevant web context:\n<webSearchContext>\nUser query:\n<userInput>"
      const prompt = webSearchContext
        ? `Relevant web context:\n${webSearchContext}\n\nUser query:\n${userInput}`
        : userInput;

      const aiResponse = await window.electron.invokeCommand("ai:chat",prompt);
      const parts = parseAiResponse(aiResponse);

      // Replace the loading message.
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: 'incoming', parts };
        return updated;
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      setChatHistory(prev => [
        ...prev,
        { text: "Error getting response.", type: 'incoming' }
      ]);
    } finally {
      setLoading(false);
      setUserInput("");
      // Optionally clear the web search context after use.
      setWebSearchContext("");
    }
  };

  /**
    * Handles closing the current chat session.
   **/

  const handleCloseChatSession = async () => {
    try {
      await window.electron.invokeCommand("ai:close");
      // setChatHistory([]);
    } catch (error) {
      console.error("Error closing AI session:", error);
    }
  };

  /**
   * Handles web search to retrieve relevant context.
   * This function calls an IPC method exposed via Electron.
   */
  const handleWebSearch = async () => {
    if (!userInput.trim()) return;
    try {
      // Call your Electron IPC channel to perform web search.
      const searchResults = await window.electron.searchDuckDuckGo(userInput);
      
      // Process or summarize the search results as needed.
      // For example, extract the top 3 results and create a markdown list.
      const summary = searchResults
        .slice(0, 3)
        .map((result: any, idx: number) => `* **Result ${idx + 1}:** ${result.title} - ${result.snippet}`)
        .join('\n');

      setWebSearchContext(summary);
      console.log("Web search context set:", summary);
    } catch (error) {
      console.error("Error fetching web search results:", error);
      setWebSearchContext("No web context available.");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Scroll chat container on new messages.
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
                      <button className="copy-button">
                        <FiClipboard />
                      </button>
                    </CopyToClipboard>
                    <pre>
                      <code className={`language-${part.language}`}>
                        {part.text}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <div key={i} className="markdown-text">
                    <ReactMarkdown>{part.text}</ReactMarkdown>
                  </div>
                )
              )
            ) : (
              <div className="markdown-text">
                <ReactMarkdown>{msg.text || ""}</ReactMarkdown>
              </div>
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
          onKeyPress={handleKeyPress}
        />
        <div className="button-group">
          {/* <button onClick={handleWebSearch} disabled={loading || !userInput.trim()}>
            Web Search
          </button> */}
          <button onClick={handleSubmit} disabled={loading || !userInput.trim()}>
            Send
          </button>
          <button onClick={handleCloseChatSession}><FiPauseCircle></FiPauseCircle></button>
        </div>
      </footer>
    </div>
  );
};
