import { PublicKey } from "@solana/web3.js";
import { u64 } from "@saberhq/token-utils";
import { utils } from "@project-serum/anchor";

export const findDistributorKey = async (
  base: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("MerkleDistributor"), base.toBytes()],
    programId
  );
};

export const findClaimStatusKey = async (
  index: number,
  distributor: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode("ClaimStatus"),
      new u64(index).toArrayLike(Buffer, "le", 8),
      distributor.toBytes(),
    ],
    programId
  );
};
