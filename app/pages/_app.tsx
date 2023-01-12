import { useMemo } from "react";
import type { AppProps } from "next/app";
import { clusterApiUrl } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import * as AllWalletAdapters from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";
import "../styles/globals.css";
import { QueryClient, QueryClientProvider } from "react-query";

const {
  UnsafeBurnerWalletAdapter: _,
  WalletConnectWalletAdapter,
  BaseSolletWalletAdapter,
  ...allwalletAdatpers
} = AllWalletAdapters;

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => {
    const walletAdapters = Object.keys(allwalletAdatpers)
      .filter((key) => key.includes("Adapter"))
      .map((key) => new (allwalletAdatpers as any)[key]());

    return walletAdapters;
  }, [network]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Component {...pageProps} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
