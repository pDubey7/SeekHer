import { useEffect, useState, useRef } from 'react';
import { getMessages } from '../services/neon';

export const useMessages = (matchId: string) => {
  const [messages, setMessages] = useState([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initial fetch
    loadMessages();
    
    // Poll every 3 seconds (fast enough for chat feel)
    intervalRef.current = setInterval(loadMessages, 3000);
    
    return () => clearInterval(intervalRef.current);
  }, [matchId]);

  const loadMessages = async () => {
    const msgs = await getMessages(matchId);
    setMessages(msgs);
  };

  return { messages, refresh: loadMessages };
};