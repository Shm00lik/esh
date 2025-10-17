import {useEffect, useRef, useLayoutEffect, useState} from 'react';
import {useWebSocket} from '../../contexts/SocketContext';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Fade
} from '@mui/material';
import './Display.scss';
const COIN_ICON_URL = "https://i.imgur.com/Lh8jQ7i.png";


const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const Display = () => {
    const {leaderboard, chatMessages, timerState, pinnedMessage} = useWebSocket();
    const chatFeedRef = useRef<HTMLDivElement>(null);
    const rowsRef = useRef<{ [key: string]: HTMLElement | null }>({});
    const prevLeaderboardRef = useRef(leaderboard);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const timerIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (chatFeedRef.current) {
            chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
        }
    }, [chatMessages, pinnedMessage]);

    useEffect(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        if (timerState?.is_running && timerState.end_time) {
            if (timerState.paused_at) {
                const remainingSeconds = timerState.end_time - timerState.paused_at;
                setTimeLeft(formatTime(remainingSeconds));
            } else {
                 timerIntervalRef.current = window.setInterval(() => {
                    const now = Date.now() / 1000;
                    const remaining = timerState.end_time! - now;
                    if (remaining <= 0) {
                        setTimeLeft('00:00');
                        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                    } else {
                        setTimeLeft(formatTime(remaining));
                    }
                }, 500); // update twice a second for smoothness
            }
        } else {
            setTimeLeft(null); // Hide timer if not running
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        }
    }, [timerState]);


    useLayoutEffect(() => {
        const prevBoard = prevLeaderboardRef.current;
        const prevPositions = new Map(prevBoard.map((user, index) => [user.user_id, index]));

        leaderboard.forEach((user, newIndex) => {
            const row = rowsRef.current[user.user_id];
            if (!row) return;

            const oldIndex = prevPositions.get(user.user_id);
            if (oldIndex !== undefined && oldIndex !== newIndex) {
                const deltaY = (oldIndex - newIndex) * row.offsetHeight;
                requestAnimationFrame(() => {
                    row.style.transform = `translateY(${deltaY}px)`;
                    row.style.transition = 'transform 0s';
                    requestAnimationFrame(() => {
                        row.style.transform = '';
                        row.style.transition = 'transform 0.5s ease-in-out';
                    });
                });
            }
        });

        prevLeaderboardRef.current = leaderboard;
    }, [leaderboard]);

    return (
        <Box className="display-container" sx={{direction: 'rtl'}}>
            <Paper elevation={12} className="display-panel leaderboard-panel">
                <Typography variant="h2" component="h1" className="panel-title">
                    טבלת המובילים
                </Typography>
                <TableContainer>
                    <Table className="leaderboard-table">
                        <TableHead>
                            <TableRow>
                                <TableCell align="center">דירוג</TableCell>
                                <TableCell align="center">שם משתמש</TableCell>
                                <TableCell align="center">מטבעות</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaderboard.map((user, index) => (

                                <TableRow
                                    ref={(el) => {
                                        rowsRef.current[user.user_id] = el;
                                    }}
                                    key={user.user_id}
                                    className={`rank-${index}-display`}
                                >
                                    <TableCell align="center">
                                        <Typography component="span"
                                                    className="rank-number-display">{index + 1}</Typography>
                                    </TableCell>
                                    <TableCell><Typography>{user.username}</Typography></TableCell>
                                    <TableCell align="center">
                                        <Typography className="esh-balance-display">
                                            {user.esh}
                                            <img src={COIN_ICON_URL} alt="אש"/>
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            <Paper elevation={12} className="display-panel">
                <Typography variant="h2" component="h1" className="panel-title">
                    פיד חי
                </Typography>

                <Box className="chat-feed-display-wrapper">
                     <Box ref={chatFeedRef} className="chat-feed-display">
                        {pinnedMessage && (
                            <Fade in={true} timeout={300}>
                                <Box className="pinned-message-display">
                                    <Typography><strong>הודעה נעוצה:</strong> {pinnedMessage}</Typography>
                                </Box>
                            </Fade>
                        )}
                        {chatMessages.map((msg) => (
                            <Fade in={true} timeout={300} key={msg.id}>
                                <Box className={`chat-message-display ${msg.is_admin ? 'admin-message-display' : ''}`}>
                                    <Typography><strong>{msg.from}:</strong> {msg.text}</Typography>
                                </Box>
                            </Fade>
                        ))}
                    </Box>
                </Box>
            </Paper>
            {timerState?.is_running && timeLeft && (
                <Box sx={{
                    position: 'fixed',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: 'white',
                    padding: '1rem 3rem',
                    borderRadius: '16px',
                    zIndex: 1000,
                    boxShadow: '0 5px 25px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <Typography variant="h1" component="div" sx={{ fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                        {timeLeft}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default Display;
