import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, transferCoins } from '../../api/ApiClient';
import {
  Box, Button, Container, Paper, Typography, Select, MenuItem,
  TextField, FormControl, InputLabel, Alert, Snackbar, CircularProgress
} from '@mui/material';
import CenteredPage from '../../components/CenteredPage/CenteredPage';

interface SimpleUser {
  user_id: string;
  username: string;
}

const Transfer = () => {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers();
        // Filter out the current user from the list of recipients
        const currentUserKey = localStorage.getItem('user_key');
        const currentUser = response.data.find((u: any) => u.user_key === currentUserKey);
        setUsers(response.data.filter((u: SimpleUser) => u.user_id !== currentUser?.user_id && u.username));
      } catch (err) {
        setError('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleTransfer = async () => {
    if (!recipient || !amount || amount <= 0) {
      setError('Please select a recipient and enter a valid amount.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await transferCoins(recipient, Number(amount));
      setSuccess(`Successfully transferred ${amount} esh!`);
      setTimeout(() => navigate('/'), 2000); // Redirect after 2 seconds
    } catch (err: any) {
      setError(err.response?.data?.error || 'Transfer failed.');
    }
  };

  if (loading) {
    return <CenteredPage><CircularProgress /></CenteredPage>;
  }

  return (
    <CenteredPage>
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Transfer Esh
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="recipient-label">To</InputLabel>
            <Select
              labelId="recipient-label"
              value={recipient}
              label="To"
              onChange={(e) => setRecipient(e.target.value)}
            >
              {users.map((user) => (
                <MenuItem key={user.user_id} value={user.user_id}>
                  {user.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Amount"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ mt: 3 }}
            inputProps={{ min: 1 }}
          />

          <Box sx={{ mt: 3, width: '100%' }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleTransfer}
            >
              Send
            </Button>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              sx={{ mt: 1 }}
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
            <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={2000} onClose={() => setSuccess('')}>
            <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>{success}</Alert>
        </Snackbar>
      </Container>
    </CenteredPage>
  );
};

export default Transfer;
