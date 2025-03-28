import React, { useState } from "react";
import "./AiSpace.css";

interface SidebarProps {
  setActiveSection: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveSection }) => {
  const [active, setActive] = useState<string>("chat");

  const handleSectionClick = (section: string) => {
    setActive(section);
    setActiveSection(section);
  };

  return (
    <div className="sidebar">
      <h3>Omini</h3>
      <ul>
        <li
          className={active === "chat" ? "active" : ""}
          onClick={() => handleSectionClick("chat")}
        >
          Chat
        </li>
        <li
          className={active === "fine-tune" ? "active" : ""}
          onClick={() => handleSectionClick("fine-tune")}
        >
          Fine-tune
        </li>
        <li
          className={active === "conversion" ? "active" : ""}
          onClick={() => handleSectionClick("conversion")}
        >
          Conversion
        </li>
        <li
          className={active === "dataset-manager" ? "active" : ""}
          onClick={() => handleSectionClick("dataset-manager")}
        >
          Dataset Management
        </li>
        <li
          className={active === "agentic-framework" ? "active" : ""}
          onClick={() => handleSectionClick("agentic-framework")}
        >
          Agentic Framework
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
