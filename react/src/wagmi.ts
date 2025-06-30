import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import { injected, metaMask } from 'wagmi/connectors'
import { base, baseSepolia, mainnet, hardhat } from "wagmi/chains";

export const config = createConfig({
  chains: [base, baseSepolia, mainnet, hardhat],
  connectors: [farcasterFrame(), injected(), metaMask()],
  multiInjectedProviderDiscovery: false,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
    [hardhat.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
