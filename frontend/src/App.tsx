import { useMemo } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from "@mui/material";

import "./App.scss";
import { WebSocketProvider } from "./contexts/SocketContext";
import { lightTheme, darkTheme } from "./theme";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Transfer from "./pages/Transfer/Transfer";
import TransferSuccess from "./pages/Transfer/TransferSuccess";
import Panel from "./pages/Panel/Panel";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Init from "./pages/Init/Init";
import ProtectedRoute from "./components/ProtectedRoute";
import Display from "./pages/Display/Display";
import QRRequest from "./pages/QRRequest/QRRequest";

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () => createTheme(prefersDarkMode ? darkTheme : lightTheme),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WebSocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/transfer/success" element={<TransferSuccess />} />
            <Route path="/panel" element={
              <ProtectedRoute>
                <Panel />
              </ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } />
            <Route path="/display" element={
              <ProtectedRoute>
                <Display />
              </ProtectedRoute>
            } />
            <Route path="/init" element={<Init />} />
            <Route path="/qr-request" element={<QRRequest />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </ThemeProvider>
  );
}

export default App;
