import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserStatus } from '../../api/ApiClient';
import CenteredPage from '../../components/CenteredPage/CenteredPage';
import { Box, Button, CircularProgress, Typography, Container, Paper } from '@mui/material';

interface UserStatus {
    username: string | null;
    esh: number;
}

const Home = () => {
    const [user, setUser] = useState<UserStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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

    if (loading) {
        return <CenteredPage><CircularProgress /></CenteredPage>
    }

    if (!user) {
        return (
            <CenteredPage>
                <Box sx={{textAlign: 'center'}}>
                    <Typography variant="h5">Could not verify user.</Typography>
                    <Typography>Please scan a valid QR code to begin.</Typography>
                </Box>
            </CenteredPage>
        )
    }

    return (
        <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome, {user.username}!
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Your balance: {user.esh} esh
                </Typography>
                <Box sx={{ mt: 4 }}>
                    {/* The chat interface will be implemented here */}
                    <Typography>Chat functionality coming soon...</Typography>
                </Box>
                <Box sx={{ mt: 'auto', pt: 4, display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={() => navigate('/transfer')}>
                        Transfer Coins
                    </Button>
                    <Button variant="outlined" onClick={() => navigate('/panel')}>
                        Admin Panel
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Home;
