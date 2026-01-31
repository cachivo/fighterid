import React, { useState } from 'react';
import ChatWidget from './ChatWidget';

interface AdminLayoutWithAIProps {
  children: React.ReactNode;
}

const AdminLayoutWithAI: React.FC<AdminLayoutWithAIProps> = ({ children }) => {
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  const toggleChatMinimize = () => {
    setIsChatMinimized(!isChatMinimized);
  };

  return (
    <>
      {children}
      <ChatWidget 
        isMinimized={isChatMinimized}
        onToggleMinimize={toggleChatMinimize}
      />
    </>
  );
};

export default AdminLayoutWithAI;