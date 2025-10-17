import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createQrCode, pinMessage, removePinnedMessage, updateUserBalance,
  getQrForUser, deleteUser, manageTimer
} from "../../api/ApiClient";
import {
  Box, Button, Container, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Snackbar, Alert,
  Grid, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, ButtonGroup
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import HomeIcon from '@mui/icons-material/Home';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import DeleteIcon from '@mui/icons-material/Delete';
import { useWebSocket } from "../../contexts/SocketContext";
import type { User } from "../../types";
import './Panel.scss';

const COIN_ICON_URL = "https://i.imgur.com/Lh8jQ7i.png";

const Panel = () => {
  const { users } = useWebSocket();
  const [pinnedMessageText, setPinnedMessageText] = useState("");
  const [qrModal, setQrModal] = useState<{ open: boolean; qr?: string; username?: string }>({ open: false });
  const [amountModal, setAmountModal] = useState<{ open: boolean; user?: User; action?: 'add' | 'subtract' }>({ open: false });
  const [amount, setAmount] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; user?: User }>({ open: false });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error"; }>({ open: false, message: "", severity: "success" });
  const [timerDuration, setTimerDuration] = useState(5); // Default 5 minutes
  const navigate = useNavigate();

  const handleCreateQr = async () => {
    try {
      const response = await createQrCode();
      setQrModal({ open: true, qr: response.data.qr_base64, username: "משתמש חדש" });
      handleSnackbarOpen("קוד QR למשתמש חדש נוצר.", "success");
    } catch (error) {
      handleSnackbarOpen("יצירת קוד QR נכשלה.", "error");
    }
  };

  const handleShowQr = async (user: User) => {
    try {
      const response = await getQrForUser(user.user_id);
      setQrModal({ open: true, qr: response.data.qr_base64, username: user.username || `User...` });
    } catch (error) {
      handleSnackbarOpen("אחזור קוד QR נכשל.", "error");
    }
  }

  const handlePinMessage = async () => {
    try {
      await pinMessage(pinnedMessageText);
      handleSnackbarOpen("ההודעה ננעצה בהצלחה!", "success");
    } catch (error) {
      handleSnackbarOpen("נעיצת ההודעה נכשלה.", "error");
    }
  };

  const handleRemovePin = async () => {
    try {
      await removePinnedMessage();
      handleSnackbarOpen("ההודעה הנעוצה הוסרה.", "success");
      setPinnedMessageText("");
    } catch (error) {
      handleSnackbarOpen("הסרת ההודעה הנעוצה נכשלה.", "error");
    }
  };

  const handleUpdateBalance = async (user: User, change: number) => {
    if (!user || change === 0) return;
    try {
      await updateUserBalance(user.user_id, change);
      handleSnackbarOpen(`היתרה של ${user.username} עודכנה.`, "success");
    } catch (error) {
      handleSnackbarOpen("עדכון היתרה נכשל.", "error");
    }
  };

  const handleOpenAmountModal = (user: User, action: 'add' | 'subtract') => {
    setAmountModal({ open: true, user, action });
  };
  const handleCloseAmountModal = () => {
    setAmountModal({ open: false });
    setAmount(0);
  };
  const handleConfirmAmount = async () => {
    if (!amountModal.user || amount <= 0) return;
    const change = amountModal.action === 'add' ? amount : -amount;
    await handleUpdateBalance(amountModal.user, change);
    handleCloseAmountModal();
  };

  const handleOpenDeleteConfirm = (user: User) => setDeleteConfirm({ open: true, user });
  const handleCloseDeleteConfirm = () => setDeleteConfirm({ open: false });
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.user) return;
    try {
      await deleteUser(deleteConfirm.user.user_id);
      handleSnackbarOpen(`המשתמש ${deleteConfirm.user.username} נמחק.`, "success");
    } catch (error: any) {
      handleSnackbarOpen(error.response?.data?.error || "מחיקת המשתמש נכשלה.", "error");
    } finally {
      handleCloseDeleteConfirm();
    }
  };

  const handleTimerAction = async (action: 'start' | 'pause' | 'reset') => {
    try {
      const duration = action === 'start' ? timerDuration * 60 : undefined;
      await manageTimer(action, duration);
      handleSnackbarOpen(`פעולת טיימר '${action}' הצליחה.`, 'success');
    } catch (error) {
      handleSnackbarOpen("ביצוע פעולת טיימר נכשל.", "error");
    }
  }

  const handleSnackbarOpen = (message: string, severity: "success" | "error") => setSnackbar({ open: true, message, severity });
  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  return (
    <Container sx={{ py: 4, direction: 'rtl' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1">פאנל ניהול</Typography>
        <ButtonGroup variant="outlined" aria-label="outlined primary button group">
          <Button startIcon={<HomeIcon />} onClick={() => navigate('/')}>&nbsp;&nbsp;בית</Button>
          <Button startIcon={<LeaderboardIcon />} onClick={() => navigate('/display')}>&nbsp;&nbsp;תצוגה</Button>
        </ButtonGroup>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{xs:12, md:4}}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>קליטת משתמש חדש</Typography>
              <Button variant="contained" onClick={handleCreateQr} fullWidth>צור קוד QR</Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12, md:8}}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>הודעה נעוצה</Typography>
              <TextField
                label="הודעה לנעיצה"
                fullWidth
                value={pinnedMessageText}
                onChange={(e) => setPinnedMessageText(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handlePinMessage}>נעל הודעה</Button>
                <Button variant="outlined" color="error" onClick={handleRemovePin}>הסר נעיצה</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12}}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>טיימר משחק</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="משך (דקות)"
                  type="number"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(Math.max(0, Number(e.target.value)))}
                  sx={{ width: '150px' }}
                  InputLabelProps={{ shrink: true }}
                />
                <Button variant="contained" color="success" onClick={() => handleTimerAction('start')}>הגדר והפעל</Button>
                <Button variant="contained" color="warning" onClick={() => handleTimerAction('pause')}>השהה/המשך</Button>
                <Button variant="contained" color="error" onClick={() => handleTimerAction('reset')}>איפוס</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12}}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>משתמשים מחוברים</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="right">שם משתמש</TableCell>
                  <TableCell align="center">מזהה</TableCell>
                  <TableCell align="center">יתרה</TableCell>
                  <TableCell align="center">פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id} className={user.is_admin ? 'admin-row' : ''}>
                    <TableCell align="right">
                      <Typography fontWeight={user.is_admin ? 'bold' : 'normal'}>
                        {user.username || "אין שם"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center"><Typography variant="body2" color="textSecondary">{user.user_id.substring(0,8)}...</Typography></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          {user.esh}
                          <img src={COIN_ICON_URL} alt="אש" style={{ height: '1.2em', width: '1.2em' }} />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="הוסף אש"><IconButton size="small" color="success" onClick={() => handleOpenAmountModal(user, 'add')}><AddIcon /></IconButton></Tooltip>
                      <Tooltip title="הסר אש"><IconButton size="small" color="error" onClick={() => handleOpenAmountModal(user, 'subtract')}><RemoveIcon /></IconButton></Tooltip>
                      <Tooltip title="הצג קוד QR"><IconButton size="small" onClick={() => handleShowQr(user)}><QrCode2Icon /></IconButton></Tooltip>
                      {!user.is_admin && (
                         <Tooltip title="מחק משתמש"><IconButton size="small" onClick={() => handleOpenDeleteConfirm(user)}><DeleteIcon /></IconButton></Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={amountModal.open} onClose={handleCloseAmountModal}>
        <DialogTitle>{amountModal.action === 'add' ? 'הוסף ליתרה של' : 'החסר מהיתרה של'} {amountModal.user?.username}</DialogTitle>
        <DialogContent>
          <Typography>יתרה נוכחית: {amountModal.user?.esh}</Typography>
          <TextField autoFocus margin="dense" label="סכום" type="number" fullWidth value={amount} onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAmountModal}>ביטול</Button>
          <Button onClick={handleConfirmAmount} variant="contained">אישור</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm.open} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>למחוק משתמש?</DialogTitle>
        <DialogContent><Typography>האם אתה בטוח שברצונך למחוק לצמיתות את {deleteConfirm.user?.username || 'המשתמש הזה'}? לא ניתן לבטל פעולה זו.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>ביטול</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">מחק</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={qrModal.open} onClose={() => setQrModal({ open: false })} maxWidth="sm">
        <DialogTitle>קוד QR עבור {qrModal.username}</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          {qrModal.qr ? <img src={qrModal.qr} alt="User QR Code" style={{ width: '100%', maxWidth: '350px', height: 'auto', borderRadius: '8px' }} /> : 'טוען...'}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrModal({ open: false })}>סגור</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default Panel;

