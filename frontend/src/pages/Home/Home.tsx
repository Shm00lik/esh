import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { getUserStatus, sendChatMessage } from '../../api/ApiClient';
import CenteredPage from '../../components/CenteredPage/CenteredPage';
import { Box, Button, CircularProgress, Typography, Container, Paper, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import { useWebSocket } from '../../contexts/SocketContext';
import type { User } from '../../types';
import './Home.scss';

const COIN_ICON_URL = "https://i.imgur.com/Lh8jQ7i.png";

const Home = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [chatInput, setChatInput] = useState('');
    const navigate = useNavigate();
    const { chatMessages, pinnedMessage, users } = useWebSocket();
    const chatAreaRef = useRef<HTMLDivElement>(null);

    // Effect for auto-scrolling chat
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Effect for live coin updates
    useEffect(() => {
        if (user) {
            const updatedSelf = users.find(u => u.user_id === user.user_id);
            if (updatedSelf && updatedSelf.esh !== user.esh) {
                // Update user state with new coin balance from WebSocket
                setUser(prevUser => ({ ...prevUser!, esh: updatedSelf.esh }));
            }
        }
    }, [users, user]);

    // Initial user status fetch
    useEffect(() => {
        const fetchStatus = async () => {
            const userKey = localStorage.getItem('user_key');
            if (!userKey) {
                navigate('/qr-request');
                return;
            }

            try {
                const response = await getUserStatus();
                if (response.data.username) {
                    setUser(response.data);
                } else {
                    navigate('/login');
                }
            } catch (error: any) {
                console.error("Failed to fetch user status", error);
                localStorage.removeItem('user_key');
                if (error.response?.status === 401) {
                    navigate('/qr-request');
                } else {
                    navigate('/login');
                }
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
        return null; // Should be redirected
    }

    return (
        <Container component="main" maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: { xs: 0, sm: 2 }, px: { xs: 0, sm: 2 } }}>
            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, direction: 'rtl', overflow: 'hidden', height: '100%', borderRadius: { xs: 0, sm: 4 } }}>
                {/* Header Section */}
                <Box sx={{ mb: 2, px: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="h5" component="h1">
                            {user.username}
                        </Typography>
                        <Typography variant="h4" sx={{
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#FFD700',
                            textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
                        }}>
                            {user.esh} <img src={COIN_ICON_URL} alt="אש" style={{ height: '1em', verticalAlign: 'middle' }} />
                        </Typography>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={() => navigate('/transfer')}
                            startIcon={<CurrencyExchangeIcon />}
                            sx={{
                                color: '#2f2f2f',
                                background: 'linear-gradient(45deg, #FFD700 30%, #FFC107 90%)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #FFCA28 30%, #FFD54F 90%)',
                                },
                                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                                mb: 1,
                                fontWeight: 'bold'
                            }}
                        >
                            &nbsp;&nbsp;שלח מטבעות
                        </Button>
                        {user.is_admin && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <Button variant="outlined" onClick={() => navigate('/panel')} startIcon={<AdminPanelSettingsIcon />}>
                                    &nbsp;&nbsp;ניהול
                                </Button>
                                <Button variant="outlined" onClick={() => navigate('/display')} startIcon={<LeaderboardIcon />}>
                                    &nbsp;&nbsp;תצוגה
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Main Content (Chat) */}
                <Box className="chat-area-wrapper">
                    {pinnedMessage && (
                        <Box className="pinned-message">
                            <Typography variant="body1"><strong>הודעה נעוצה:</strong> {pinnedMessage}</Typography>
                        </Box>
                    )}
                    <Box ref={chatAreaRef} className="chat-area">
                        {chatMessages.map((msg) => (
                            <Box key={msg.id} className={`chat-message ${msg.is_admin ? 'admin-message' : ''}`}>
                                <Typography><strong>{msg.from}:</strong> {msg.text}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Footer (Chat Input) */}
                <Box sx={{ mt: 'auto', pt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <IconButton color="primary" onClick={handleSendChat}>
                        <SendIcon />
                    </IconButton>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="הקלד/י הודעה..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}

                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default Home;
