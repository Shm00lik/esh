import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { User, ChatMessage, LeaderboardUser } from '../types';

interface TimerState {
    end_time: number | null;
    duration: number;
    paused_at: number | null;
    is_running: boolean;
}

interface IWebSocketContext {
    users: User[];
    leaderboard: LeaderboardUser[];
    chatMessages: ChatMessage[];
    pinnedMessage: string | null;
    isConnected: boolean;
    timerState: TimerState | null;
}

const WebSocketContext = createContext<IWebSocketContext | null>(null);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [pinnedMessage, setPinnedMessage] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [timerState, setTimerState] = useState<TimerState | null>(null);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const userKey = localStorage.getItem('user_key');
        if (!userKey || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
            return;
        }

        if (ws.current) {
            ws.current.close();
        }

        const socket = new WebSocket(`ws://192.168.50.161:8000/ws?key=${userKey}`);
        ws.current = socket;

        socket.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                switch (message.type) {
                    case 'users_update':
                        setUsers(message.users);
                        break;
                    case 'leaderboard':
                        const sortedLeaderboard = message.users.sort((a: LeaderboardUser, b: LeaderboardUser) => b.esh - a.esh);
                        setLeaderboard(sortedLeaderboard);
                        break;
                    case 'message':
                        const newMessage: ChatMessage = {
                            id: `${Date.now()}-${Math.random()}`,
                            from: message.from,
                            text: message.text,
                            is_admin: message.is_admin,
                            timestamp: Date.now(),
                        };
                        setChatMessages(prev => [...prev, newMessage].slice(-20));
                        setTimeout(() => {
                            setChatMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
                        }, 15000);
                        break;
                    case 'pinned':
                        setPinnedMessage(message.text);
                        break;
                    case 'pin_removed':
                        setPinnedMessage(null);
                        break;
                    case 'coins_update':
                        setUsers(prev => prev.map(u => u.user_id === message.user_id ? { ...u, esh: message.esh } : u));
                        setLeaderboard(prev => prev.map(u => u.user_id === message.user_id ? { ...u, esh: message.esh } : u)
                          .sort((a,b) => b.esh - a.esh)
                        );
                        break;
                    case 'timer_update':
                        setTimerState(message.state);
                        break;
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            ws.current = null;
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            socket.close();
        };

        return () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, []);

    const value = {
        users,
        leaderboard,
        chatMessages,
        pinnedMessage,
        isConnected,
        timerState,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
