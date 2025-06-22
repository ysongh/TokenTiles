import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom"

import { ConnectMenu } from "./components/ConnectMenu";
import Lobby from "./pages/Lobby";
import TokenTiles from "./pages/TokenTiles";
import Leaderboard from "./pages/Leaderboard";
import CreateWords from "./pages/CreateWords";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <HashRouter>
      <ConnectMenu />
      <Routes>
        <Route
          path="/createwords"
          element={<CreateWords />} />
        <Route
          path="/leaderboard"
          element={<Leaderboard />} />
        <Route
          path="/game/:id"
          element={<TokenTiles />} />
        <Route
          path="/"
          element={<Lobby />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
