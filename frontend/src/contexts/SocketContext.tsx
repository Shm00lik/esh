import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext<any>(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const userKey = localStorage.getItem('user_key');
    if (!userKey) {
      if (ws) {
        ws.close();
        setWs(null);
      }
      return;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
        return;
    }

    // Use wss for secure connections in production
    const socket = new WebSocket(`ws://localhost:8000/ws?key=${userKey}`);

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setWs(socket);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setWs(null);
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={lastMessage}>
      {children}
    </WebSocketContext.Provider>
  );
};
