import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CenteredPage from "../../components/CenteredPage/CenteredPage";
import "./Login.scss";
import { Button, TextField, Typography, Alert, Box } from "@mui/material";
import { loginUser } from "../../api/ApiClient";

const Login = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    setError("");
    try {
      await loginUser(username);
      navigate("/");
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setError("Username is already taken. Please choose another one.");
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Login failed:", err);
      }
    }
  };

  return (
    <CenteredPage>
      <Box className="login" sx={{p: 3, maxWidth: 400, width: '100%'}}>
        <Typography variant="h4" component="h1" gutterBottom>
          Initial Login
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2.5, textAlign: 'center' }}>
            Choose a username to get started.
        </Typography>

        <TextField
          label="Username"
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
          Login
        </Button>
      </Box>
    </CenteredPage>
  );
};

export default Login;
