import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";

import { ConnectMenu } from "./components/ConnectMenu";
import Lobby from "./pages/Lobby";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <>
      <div className="bg-blue-300">Mini App + Vite + TS + React + Wagmi</div>
      <ConnectMenu />
      <Lobby />
    </>
  );
}

export default App;
