import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";

export function getATASync(owner: PublicKey, mint: PublicKey) {
    const [ata] = PublicKey.findProgramAddressSync(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    return ata;
  }

export const getOrCreateATAInstruction = async (
    tokenMint: PublicKey,
    owner: PublicKey,
    connection: Connection,
  ): Promise<[PublicKey, TransactionInstruction?]> => {
    let toAccount;
    try {
      toAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, tokenMint, owner);
      const account = await connection.getAccountInfo(toAccount);
      if (!account) {
        const ix = Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenMint,
          toAccount,
          owner,
          owner,
        );
        return [toAccount, ix];
      }
      return [toAccount, undefined];
    } catch (e) {
      /* handle error */
      console.error('Error::getOrCreateATAInstruction', e);
      throw e;
    }
  };