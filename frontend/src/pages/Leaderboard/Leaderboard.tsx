import { useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/SocketContext';
import {
  Box, Container, Paper, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Fade
} from '@mui/material';
import type { LeaderboardUser } from '../../types';
import './Leaderboard.scss';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const lastMessage = useWebSocket();

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'leaderboard') {
      setLeaderboard(lastMessage.users);
    }
  }, [lastMessage]);

  return (
    <Container maxWidth="lg" className="leaderboard-container">
      <Typography variant="h2" component="h1" gutterBottom align="center" className="leaderboard-title">
        Live Leaderboard
      </Typography>
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: '10%' }}><Typography variant="h5">Rank</Typography></TableCell>
              <TableCell><Typography variant="h5">Username</Typography></TableCell>
              <TableCell align="right"><Typography variant="h5">Esh</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((user, index) => (
              <Fade in={true} timeout={500} key={user.username}>
                <TableRow className={`rank-${index}`}>
                  <TableCell align="center">
                    <Typography variant="h4" component="span" className="rank-number">
                      {index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h4">{user.username}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h4" className="esh-balance">
                      {user.esh}
                    </Typography>
                  </TableCell>
                </TableRow>
              </Fade>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Leaderboard;

