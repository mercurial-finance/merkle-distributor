import React, { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

const WalletAndSettingsNoSSR = dynamic(
  () => Promise.resolve(WalletAndSettings),
  {
    ssr: false,
  }
);

const WalletAndSettings = () => {
  const { connected } = useWallet();

  return (
    <div>
      {!connected && <WalletMultiButton />}
      {connected && <WalletDisconnectButton />}
    </div>
  );
};

const Header: FC = () => {
  return (
    <div className="w-full flex flex-row items-center justify-between h-20 px-5 py-4 bg-black">
      <div className="flex items-center space-x-2 font-bold text-xl text-white">
        MER → MET
      </div>
      <WalletAndSettingsNoSSR />
    </div>
  );
};

export default Header;
