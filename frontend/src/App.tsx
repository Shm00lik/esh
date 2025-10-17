import { BrowserRouter, Route, Routes } from "react-router";
import "./App.scss";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Transfer from "./pages/Transfer/Transfer";
import Panel from "./pages/Panel/Panel";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Init from "./pages/Init/Init";
import { WebSocketProvider } from "./contexts/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <WebSocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/transfer" element={<Transfer />} />
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
          <Route path="/init" element={<Init />} />
        </Routes>
      </BrowserRouter>
    </WebSocketProvider>
  );
}

export default App;
