import {
  Container, Paper, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { useWebSocket } from '../../contexts/SocketContext';
import './Leaderboard.scss';
import { useLayoutEffect, useRef } from 'react';

const COIN_ICON_URL = "https://i.imgur.com/Lh8jQ7i.png";

const Leaderboard = () => {
  const { leaderboard } = useWebSocket();
  const rowsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  const prevLeaderboardRef = useRef(leaderboard);

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
    <Container maxWidth="lg" className="leaderboard-container" sx={{ direction: 'rtl' }}>
      <Typography variant="h2" component="h1" gutterBottom align="center" className="leaderboard-title">
        טבלת מובילים חיה
      </Typography>
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: '10%' }}><Typography variant="h5">דירוג</Typography></TableCell>
              <TableCell><Typography variant="h5">שם משתמש</Typography></TableCell>
              <TableCell align="center"><Typography variant="h5">אש</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((user, index) => (
              <TableRow
                  ref={(el) => {
                    rowsRef.current[user.user_id] = el;
                  }}
                  key={user.user_id}
                  className={`rank-${index}`}
              >
                <TableCell align="center">
                  <Typography variant="h4" component="span" className="rank-number">
                    {index + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h4">{user.username}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h4" className="esh-balance">
                    {user.esh}
                    <img src={COIN_ICON_URL} alt="אש" />
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Leaderboard;
