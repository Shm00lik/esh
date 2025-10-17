import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, transferCoins, getUserStatus } from '../../api/ApiClient';
import {
  Box, Button, Container, Paper, Typography, TextField,
  CircularProgress, List, ListItem, ListItemButton, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CenteredPage from '../../components/CenteredPage/CenteredPage';
import type { User, SimpleUser } from '../../types';

const COIN_ICON_URL = "https://i.imgur.com/Lh8jQ7i.png";

const Transfer = () => {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SimpleUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);
  const [amount, setAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, statusResponse] = await Promise.all([
          getAllUsers(),
          getUserStatus()
        ]);
        const activeUsers: SimpleUser[] = usersResponse.data.filter((u: SimpleUser) => u.username);
        setUsers(activeUsers);
        setFilteredUsers(activeUsers);
        setCurrentUser(statusResponse.data);
      } catch (err) {
        setError('טעינת הנתונים נכשלה.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }
    setFilteredUsers(
      users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, users]);

  const handleSelectUser = (user: SimpleUser) => {
    setSelectedUser(user);
    setError(''); // Clear previous errors
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
    setAmount('');
    setError('');
  };

  const handleTransfer = async () => {
    if (!selectedUser || !amount || amount <= 0) {
      setError('אנא הזן/הזיני סכום תקין.');
      return;
    }
    if (currentUser && amount > currentUser.esh) {
      setError('אין מספיק יתרה.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await transferCoins(selectedUser.user_id, Number(amount));
      navigate('/transfer/success', { state: { amount: Number(amount), recipientName: selectedUser.username } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'ההעברה נכשלה.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <CenteredPage><CircularProgress /></CenteredPage>;
  }

  return (
    <CenteredPage>
      <Container component="main" maxWidth="sm" sx={{ py: 4, direction: 'rtl' }}>
        <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            העברת אש
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="חפש/י משתמש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ my: 2 }}
          />
          <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <List>
              {filteredUsers.map((user) => (
                <ListItem key={user.user_id} disablePadding>
                  <ListItemButton onClick={() => handleSelectUser(user)}>
                    <ListItemText
                      primary={user.username}
                      primaryTypographyProps={{
                        color: user.is_admin ? 'error' : 'text.primary',
                        fontWeight: user.is_admin ? 'bold' : 'normal',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate(-1)}>
            חזרה
          </Button>
        </Paper>

        <Dialog open={!!selectedUser} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
          <DialogTitle>שלח אש ל {selectedUser?.username}</DialogTitle>
          <DialogContent>
            <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              היתרה שלך: {currentUser?.esh} <img src={COIN_ICON_URL} alt="אש" style={{ height: '1em', verticalAlign: 'middle' }} />
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="סכום"
              type="number"
              fullWidth
              variant="standard"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              inputProps={{ min: 1 }}
              error={!!error}
              helperText={error}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isSubmitting}>ביטול</Button>
            <Button onClick={handleTransfer} variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'שלח'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </CenteredPage>
  );
};

export default Transfer;
