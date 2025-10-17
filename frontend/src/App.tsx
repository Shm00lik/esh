import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.scss";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Transfer from "./pages/Transfer/Transfer";
import Panel from "./pages/Panel/Panel";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Init from "./pages/Init/Init";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/panel" element={<Panel />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/init" element={<Init />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
