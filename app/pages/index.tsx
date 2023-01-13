import Head from "next/head";
import { getOrCreateATA, u64 } from "@saberhq/token-utils";
import { useCallback, useMemo } from "react";
import { useQuery } from "react-query";
import { Toaster, toast } from "react-hot-toast";
import { PublicKey, Transaction } from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  SolanaAugmentedProvider,
  SolanaProvider,
} from "@saberhq/solana-contrib";

import {
  MerkleDistributorIDL,
  MerkleDistributorJSON,
} from "../program/merkle_distributor_idl";
import snapshot from "../program/snapshot.json";
import Header from "../components/Header";
import { fromLamports } from "../utils/number";
import { findClaimStatusKey } from "../utils/pda";
import { getATASync } from "../utils/anchor";
import { BalanceTree } from "../utils/balance-tree";
import { toBytes32Array } from "../utils/bytes32";
import { shortenAddress } from "../utils/address";

const PROGRAM_ID = new PublicKey("MRKgRBL5XCCT5rwUGnim4yioq9wR4c6rj2EZkw8KdyZ");
const DISTRIBUTOR_ACCOUNT = new PublicKey(
  "ERWtH9Li91wJxebsb4erqRA3NSi1VkjovZx1qVznYJsG"
);

export default function Home() {
  const { connection } = useConnection();
  const walletContext = useWallet();

  const provider = useMemo(() => {
    // @ts-ignore
    return new AnchorProvider(connection, walletContext, {
      commitment: "confirmed",
    });
  }, [walletContext, connection]);

  const program = useMemo(() => {
    return new Program<MerkleDistributorIDL>(
      MerkleDistributorJSON,
      PROGRAM_ID,
      provider
    );
  }, [provider]);

  const snapShotIndex = useMemo(() => {
    if (!walletContext.connected) return;

    return snapshot.findIndex(
      (item) => item.authority === walletContext.publicKey?.toBase58()
    );
  }, [walletContext.publicKey, walletContext.connected]);

  const amount = useMemo(() => {
    if (
      !walletContext.connected ||
      typeof snapShotIndex === "undefined" ||
      snapShotIndex < 0 ||
      snapShotIndex > snapshot.length
    )
      return 0;

    return fromLamports(Number(snapshot[snapShotIndex].amount) ?? 0, 6);
  }, [walletContext.publicKey, walletContext.connected, snapShotIndex]);

  const { data: distributorState } = useQuery(
    [program.programId],
    async () =>
      await program.account.merkleDistributor.fetch(DISTRIBUTOR_ACCOUNT)
  );

  const {
    data: claimedAmount,
    refetch: refetchClaimedAmount,
    isLoading: isLoadingClaimedAmount,
  } = useQuery([snapShotIndex, walletContext.connected], async () => {
    if (typeof snapShotIndex === "undefined" || !walletContext.connected)
      return 0;

    const [claimPda] = await findClaimStatusKey(
      snapShotIndex,
      DISTRIBUTOR_ACCOUNT,
      PROGRAM_ID
    );

    let claimAccount;
    try {
      claimAccount = await program.account.claimStatus.fetch(claimPda);
    } catch (error) {
      claimAccount = undefined;
    }

    return claimAccount ? fromLamports(claimAccount.amount.toNumber(), 6) : 0;
  });

  const claimableAmount = useMemo(() => {
    if (typeof claimedAmount === "undefined" && isLoadingClaimedAmount) return;

    return amount === claimedAmount ? 0 : amount;
  }, [amount, claimedAmount, isLoadingClaimedAmount]);

  const tree = useMemo(
    () =>
      new BalanceTree(
        snapshot.map(({ authority, amount }) => ({
          account: new PublicKey(authority),
          amount: new u64(amount),
        }))
      ),
    []
  );

  const claimMET = useCallback(async () => {
    if (typeof snapShotIndex === "undefined" || !distributorState) return;

    const claimFn = async () => {
      const [claimStatus, bump] = await findClaimStatusKey(
        snapShotIndex,
        DISTRIBUTOR_ACCOUNT,
        PROGRAM_ID
      );
      const walletSnapshot = snapshot[snapShotIndex];
      const claimant = new PublicKey(walletSnapshot.authority);
      const amountToClaim = new u64(walletSnapshot.amount);
      const proof = tree.getProof(snapShotIndex, claimant, amountToClaim);
      const solanaProvider = SolanaProvider.init({
        connection: provider.connection,
        wallet: provider.wallet,
        opts: provider.opts,
      });
      const augmentedProvider = new SolanaAugmentedProvider(solanaProvider);
      const fromATA = await getATASync(
        DISTRIBUTOR_ACCOUNT,
        distributorState.mint
      );
      const {
        instruction: createOwnerDistributorATAIx,
        address: ownerDistributorATA,
      } = await getOrCreateATA({
        provider: augmentedProvider,
        mint: distributorState.mint,
        owner: claimant,
      });
      const preInstructions = createOwnerDistributorATAIx
        ? [createOwnerDistributorATAIx]
        : [];
      const accounts = {
        distributor: DISTRIBUTOR_ACCOUNT,
        claimStatus,
        from: fromATA,
        to: ownerDistributorATA,
        claimant,
        payer: claimant,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      };

      const tx = await program.methods
        .claim(
          bump,
          new u64(snapShotIndex),
          amountToClaim,
          proof.map((p) => toBytes32Array(p))
        )
        .accounts(accounts)
        .preInstructions(preInstructions)
        .rpc({
          commitment: "confirmed",
        });

      return tx;
    };

    toast.promise(claimFn(), {
      loading: "⏳ Loading...",
      success: (tx) => {
        refetchClaimedAmount();

        return (
          <div className="flex flex-col">
            <span>Success!</span>
            <a
              target="_blank"
              href={`https://solscan.io/tx/${tx}`}
              className="underline"
            >
              {shortenAddress(tx ?? "")}
            </a>
          </div>
        );
      },
      error: (error) => {
        return `Something went wrong. ${error}`;
      },
    });
  }, [
    provider,
    program,
    amount,
    snapShotIndex,
    distributorState,
    refetchClaimedAmount,
  ]);

  return (
    <>
      <Head>
        <title>Mercurial → Meteora</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-col flex-1 justify-center items-center">
          <div className="flex flex-col space-y-5">
            <div className="flex flex-col space-y-1">
              <span>Claimable amount</span>
              {typeof claimableAmount === "undefined" ? (
                <div className="animate-pulse bg-gray-300 w-36 h-7" />
              ) : (
                <span className="font-semibold text-2xl">{`${claimableAmount} MET`}</span>
              )}
            </div>
            <div className="flex flex-col space-y-1">
              <span>Claimed amount</span>
              {typeof claimedAmount === "undefined" ? (
                <div className="animate-pulse bg-gray-300 w-36 h-7" />
              ) : (
                <span className="font-semibold text-2xl">{`${claimedAmount} MET`}</span>
              )}
            </div>

            <button
              disabled={!claimableAmount}
              className="px-3 py-1 bg-black text-white rounded text-center disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={claimMET}
            >
              Claim MET
            </button>
          </div>
        </div>
        <Toaster />
      </div>
    </>
  );
}
