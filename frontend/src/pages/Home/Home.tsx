import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { getUserStatus, sendChatMessage } from '../../api/ApiClient';
import CenteredPage from '../../components/CenteredPage/CenteredPage';
import { Box, Button, CircularProgress, Typography, Container, Paper, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useWebSocket } from '../../contexts/SocketContext';
import type { User, ChatMessage } from '../../types';
import './Home.scss';


const Home = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [pinnedMessage, setPinnedMessage] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const navigate = useNavigate();
    const lastMessage = useWebSocket();
    const messageTimeouts = useRef<Map<string, number>>(new Map()).current;

    const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const id = `${Date.now()}-${Math.random()}`;
        const timestamp = Date.now();
        const newMessage = { ...msg, id, timestamp };

        setMessages(prev => [...prev, newMessage].slice(-20)); // Keep last 20 messages

        const timeoutId = setTimeout(() => {
            setMessages(prev => prev.filter(m => m.id !== id));
            messageTimeouts.delete(id);
        }, 15000); // Message fades after 15 seconds
        messageTimeouts.set(id, timeoutId);
    };

    useEffect(() => {
        return () => {
            // Cleanup timeouts on component unmount
            messageTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        };
    }, [messageTimeouts]);

    useEffect(() => {
        if (!lastMessage) return;

        switch (lastMessage.type) {
            case 'message':
                addMessage({ from: lastMessage.from, text: lastMessage.text, pinned: lastMessage.pinned });
                break;
            case 'pinned':
                setPinnedMessage(lastMessage.text);
                break;
            case 'pin_removed':
                setPinnedMessage(null);
                break;
            case 'coins_update':
                if (user && lastMessage.user_id === user.user_id) {
                    setUser(prev => prev ? { ...prev, esh: lastMessage.esh } : null);
                }
                break;
        }
    }, [lastMessage, user]);

    useEffect(() => {
        const fetchStatus = async () => {
            const userKey = localStorage.getItem('user_key');
            if (!userKey) {
                setLoading(false);
                return;
            }

            try {
                const response = await getUserStatus();
                if (response.data.username) {
                    setUser(response.data);
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error("Failed to fetch user status", error);
                localStorage.removeItem('user_key');
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [navigate]);

    const handleSendChat = async () => {
        if (!chatInput.trim()) return;
        try {
            await sendChatMessage(chatInput);
            setChatInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };


    if (loading) {
        return <CenteredPage><CircularProgress /></CenteredPage>
    }

    if (!user) {
        return (
            <CenteredPage>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">Could not verify user.</Typography>
                    <Typography>Please scan a valid QR code to begin.</Typography>
                </Box>
            </CenteredPage>
        )
    }

    return (
        <Container component="main" maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, direction: 'rtl' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, direction: 'ltr' }}>
                    <Box>
                        <Typography variant="h5" component="h1">
                            {user.username}
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Balance: {user.esh} esh
                        </Typography>
                    </Box>
                    <Box>
                        <Button variant="contained" onClick={() => navigate('/transfer')}>
                            Send
                        </Button>
                        {user.is_admin && (
                           <Button variant="outlined" onClick={() => navigate('/panel')} sx={{ml: 1}}>
                                Admin
                           </Button>
                        )}
                    </Box>
                </Box>

                {pinnedMessage && (
                    <Box className="pinned-message" sx={{ direction: 'ltr' }}>
                        <Typography variant="body1"><strong>Pinned:</strong> {pinnedMessage}</Typography>
                    </Box>
                )}

                <Box className="chat-area">
                    {messages.map((msg) => (
                        <Box key={msg.id} className="chat-message" sx={{ opacity: (Date.now() - msg.timestamp) > 12000 ? 0 : 1 }}>
                            <Typography><strong>{msg.from}:</strong> {msg.text}</Typography>
                        </Box>
                    ))}
                </Box>

                <Box sx={{ mt: 'auto', pt: 2, display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    />
                    <IconButton color="primary" onClick={handleSendChat}>
                        <SendIcon />
                    </IconButton>
                </Box>
            </Paper>
        </Container>
    );
};

export default Home;

