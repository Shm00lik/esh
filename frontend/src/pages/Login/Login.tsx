import { useState } from "react";
// import { useNavigate } from "react-router-dom";
import CenteredPage from "../../components/CenteredPage/CenteredPage";
import "./Login.scss";
import { Button, TextField, Typography, Alert, Box } from "@mui/material";
import { loginUser } from "../../api/ApiClient";

const Login = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  // const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim()) {
      setError("שם המשתמש לא יכול להיות ריק.");
      return;
    }
    setError("");
    try {
      await loginUser(username);
      // Full page reload to ensure WebSocket connects
      window.location.assign("/");
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setError("שם המשתמש תפוס. אנא בחר/י שם אחר.");
      } else {
        setError("אירעה שגיאה בלתי צפויה. אנא נסה/י שוב.");
        console.error("Login failed:", err);
      }
    }
  };

  return (
    <CenteredPage>
      <Box className="login" sx={{p: 3, maxWidth: 400, width: '100%', direction: 'rtl'}}>
        <Typography variant="h4" component="h1" gutterBottom>
          כניסה ראשונית
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2.5, textAlign: 'center' }}>
            בחר/י שם משתמש כדי להתחיל.
        </Typography>

        <TextField
          label="שם משתמש"
          variant="outlined"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />

        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}

        <Button
            variant="contained"
            color="primary"
            onClick={handleLogin}
            fullWidth
            size="large"
            sx={{ mt: 2 }}
        >
          כניסה
        </Button>
      </Box>
    </CenteredPage>
  );
};

export default Login;
