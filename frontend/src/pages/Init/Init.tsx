import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getUserStatus } from "../../api/ApiClient";
import CenteredPage from "../../components/CenteredPage/CenteredPage";
import { CircularProgress, Typography } from "@mui/material";

const Init = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>("Verifying user...");

  useEffect(() => {
    const userKey = searchParams.get("user_key");

    if (!userKey) {
      setMessage("Invalid URL. No user key found.");
      return;
    }

    localStorage.setItem("user_key", userKey);

    const checkStatus = async () => {
      try {
        const response = await getUserStatus();
        if (response.data.username) {
          navigate("/");
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Failed to get user status:", error);
        setMessage("Error verifying user. Please try scanning the QR code again.");
      }
    };

    checkStatus();
  }, [searchParams, navigate]);

  return (
    <CenteredPage>
      <div style={{ textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" style={{ marginTop: '1rem' }}>{message}</Typography>
      </div>
    </CenteredPage>
  );
};

export default Init;
