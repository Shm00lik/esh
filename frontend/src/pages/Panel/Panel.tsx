import { useEffect, useState } from 'react';
import { createQrCode, getAllUsers, pinMessage, removePinnedMessage, updateUserBalance } from '../../api/ApiClient';
import {
  Box, Button, Container, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Modal, Snackbar, Alert, Grid
} from '@mui/material';

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

const Panel = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceChange, setBalanceChange] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      handleSnackbarOpen('Failed to fetch users.', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateQr = async () => {
    try {
      const response = await createQrCode();
      setQrCode(response.data.qr_base64);
    } catch (error) {
      handleSnackbarOpen('Failed to create QR code.', 'error');
    }
  };

  const handlePinMessage = async () => {
    try {
      await pinMessage(pinnedMessage);
      handleSnackbarOpen('Message pinned successfully!', 'success');
    } catch (error) {
      handleSnackbarOpen('Failed to pin message.', 'error');
    }
  };

  const handleRemovePin = async () => {
    try {
      await removePinnedMessage();
      handleSnackbarOpen('Pinned message removed.', 'success');
      setPinnedMessage('');
    } catch (error) {
      handleSnackbarOpen('Failed to remove pinned message.', 'error');
    }
  };

  const handleOpenBalanceModal = (user: any) => {
    setSelectedUser(user);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUser(null);
    setBalanceChange(0);
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser) return;
    try {
      await updateUserBalance(selectedUser.user_id, balanceChange);
      handleSnackbarOpen(`Balance updated for ${selectedUser.username}.`, 'success');
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      handleSnackbarOpen('Failed to update balance.', 'error');
    }
  };

  const handleSnackbarOpen = (message: string, severity: 'success' | 'error') => setSnackbar({ open: true, message, severity });
  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>Admin Panel</Typography>

      <Grid container spacing={3}>
        <Grid >
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h5" gutterBottom>User Management</Typography>
            <Button variant="contained" onClick={handleCreateQr}>Create User QR Code</Button>
            {qrCode && <Box mt={2} sx={{ textAlign: 'center' }}><Typography>New User QR Code:</Typography><img src={qrCode} alt="New User QR Code" style={{ maxWidth: '100%', height: 'auto' }} /></Box>}
          </Paper>
        </Grid>
        <Grid>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h5" gutterBottom>Pinned Message</Typography>
            <TextField label="Message to pin" fullWidth value={pinnedMessage} onChange={(e) => setPinnedMessage(e.target.value)} sx={{ mb: 2 }}/>
            <Box>
                <Button variant="contained" onClick={handlePinMessage} sx={{ mr: 1 }}>Pin Message</Button>
                <Button variant="outlined" color="error" onClick={handleRemovePin}>Remove Pin</Button>
            </Box>
          </Paper>
        </Grid>
        <Grid>
            <Typography variant="h5" gutterBottom sx={{mt: 2}}>Users</Typography>
            <TableContainer component={Paper}>
                <Table>
                <TableHead>
                    <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell align="right">Balance (esh)</TableCell>
                    <TableCell>Is Admin</TableCell>
                    <TableCell align="center">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((user) => (
                    <TableRow key={user.user_id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.user_id}</TableCell>
                        <TableCell align="right">{user.esh}</TableCell>
                        <TableCell>{user.is_admin ? 'Yes' : 'No'}</TableCell>
                        <TableCell align="center">
                        <Button size="small" onClick={() => handleOpenBalanceModal(user)}>Update Balance</Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </TableContainer>
        </Grid>
      </Grid>
      
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <Typography variant="h6">Update balance for {selectedUser?.username}</Typography>
          <Typography sx={{ mt: 1 }}>Current balance: {selectedUser?.esh}</Typography>
          <TextField label="Change amount (+/-)" type="number" fullWidth value={balanceChange} onChange={(e) => setBalanceChange(parseInt(e.target.value, 10) || 0)} sx={{ mt: 2 }} />
          <Button onClick={handleUpdateBalance} sx={{ mt: 2 }} variant="contained">Update</Button>
        </Box>
      </Modal>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default Panel;

