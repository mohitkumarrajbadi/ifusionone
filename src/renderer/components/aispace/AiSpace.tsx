import React, { useState } from "react";
import AiChatManager from "./sections/AiChatManager";
import DatasetManager from "./sections/DatasetManager";
import ConversionManager from "./sections/ConversionManager";
import FinetuneManager from "./sections/FinetuneManager";
import Sidebar from "./Sidebar";
import AiAgentManager from "./sections/AiAgentManager";


export const AiSpace = () => {

  const [activeSection,setActiveSection] = useState<string>("chat");

  const renderSection = () => {
    switch (activeSection){
      case "chat":
        return <AiChatManager/>;
      case "dataset-manager":
        return <DatasetManager/>;
      case "conversion": 
        return <ConversionManager/>;
      case "fine-tune":
        return <FinetuneManager/>;
      case "agentic-framework":
        return <AiAgentManager/>;
      default:
        return <AiChatManager/>;
    }
  }


  return (
    <div className="ai-space">
        <Sidebar setActiveSection={setActiveSection}/>
        <div className="ai-space-main-content">{renderSection()}</div>
    </div>
  );
};