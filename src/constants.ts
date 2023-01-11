import { SuperCoder } from "@saberhq/anchor-contrib";
import { PublicKey } from "@solana/web3.js";

import type { MerkleDistributorTypes } from ".";
import { MerkleDistributorJSON } from "./idls/merkle_distributor";

export const PROGRAM_ID = new PublicKey(
  "MRKgRBL5XCCT5rwUGnim4yioq9wR4c6rj2EZkw8KdyZ"
);

export const MERKLE_DISTRIBUTOR_PROGRAM_ID = PROGRAM_ID;

export const MERKLE_DISTRIBUTOR_CODER = new SuperCoder<MerkleDistributorTypes>(
  MERKLE_DISTRIBUTOR_PROGRAM_ID,
  MerkleDistributorJSON
);
