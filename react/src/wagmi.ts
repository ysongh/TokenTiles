import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import { injected, metaMask } from 'wagmi/connectors'
import { baseSepolia } from "wagmi/chains";

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [farcasterFrame(), injected(), metaMask()],
  multiInjectedProviderDiscovery: false,
  transports: {
    [baseSepolia.id]: http()
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
