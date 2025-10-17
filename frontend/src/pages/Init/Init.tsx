import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getUserStatus } from "../../api/ApiClient";
import CenteredPage from "../../components/CenteredPage/CenteredPage";
import { CircularProgress, Typography } from "@mui/material";

const Init = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>("מאמת משתמש...");

  useEffect(() => {
    const userKey = searchParams.get("user_key");

    if (!userKey) {
      setMessage("כתובת לא תקינה. לא נמצא מפתח משתמש.");
      return;
    }

    localStorage.setItem("user_key", userKey);

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const checkStatus = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await getUserStatus();
          if (response.data.username) {
            window.location.assign("/");
            return; // Success
          } else {
            navigate("/login");
            return; // Needs to set username
          }
        } catch (error) {
          console.error(`Failed to get user status (attempt ${i + 1}):`, error);
          if (i < retries - 1) {
            setMessage(`מאמת... (ניסיון ${i + 2})`);
            await delay(1000); // Wait before retrying
          } else {
            setMessage("שגיאה באימות המשתמש. אנא נסה/י לסרוק את קוד ה-QR שוב.");
          }
        }
      }
    };

    // A small delay helps ensure the localStorage item is set before the API interceptor fires.
    setTimeout(() => checkStatus(), 100);

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
