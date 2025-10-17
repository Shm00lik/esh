import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Typography, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CenteredPage from '../../components/CenteredPage/CenteredPage';
import './TransferSuccess.scss';

const COIN_ICON_URL = "https://i.imgur.com/Lh8jQ7i.png";

const TransferSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { amount, recipientName } = location.state || { amount: 0, recipientName: '...' };

    useEffect(() => {
        // Redirect if state is not available
        if (!location.state) {
            navigate('/');
        }

        // Play sound effect on component mount
        const audio = new Audio('/horn.mp3');
        audio.play().catch(e => console.error("Audio playback failed:", e));

    }, [location, navigate]);

    return (
        <CenteredPage>
            <Paper elevation={6} sx={{ p: 4, textAlign: 'center', maxWidth: '400px', mx: 2, position: 'relative', overflow: 'hidden' }}>
                <div className="coin-animation-container">
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className="falling-coin" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s` }}>
                            <img src={COIN_ICON_URL} alt="" />
                        </div>
                    ))}
                </div>

                <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />

                <Typography variant="h4" gutterBottom>
                    ההעברה הושלמה!
                </Typography>
                <Typography variant="h6">
                    <strong>{amount}</strong> <img src={COIN_ICON_URL} alt="אש" style={{ height: '1.2em', verticalAlign: 'middle' }} /> נשלחו אל
                </Typography>
                <Typography variant="h5" sx={{ color: 'primary.main', my: 2, fontWeight: 'bold' }}>
                    {recipientName}
                </Typography>

                <Button variant="contained" size="large" onClick={() => navigate('/')} sx={{ mt: 3 }}>
                    חזרה לדף הבית
                </Button>
            </Paper>
        </CenteredPage>
    );
};

export default TransferSuccess;
