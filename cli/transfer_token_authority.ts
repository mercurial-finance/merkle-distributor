import { setupEnv } from "./helpers";
import {
    TOKEN_PROGRAM_ID,
} from "@saberhq/token-utils";
import {
    Keypair,
    PublicKey,
    Transaction,
} from "@solana/web3.js";
import { Token } from "@solana/spl-token";
import * as fs from 'fs';
import { chaiSolana } from "@saberhq/chai-solana";
import chai from "chai";
chai.use(chaiSolana);

const newAuth = new PublicKey("BULRqL3U2jPgwvz6HYCyBVq9BMtK94Y1Nz98KQop23aD");

export const transfer_token_authority = async () => {
    const { provider } = setupEnv();

    const decodedKey = new Uint8Array(
        JSON.parse(
            //replace with actual path from home dir. For example '.config/solana/devnet.json'
            fs.readFileSync('./cli/met.json', 'utf8')
        ));
    let mint = Keypair.fromSecretKey(decodedKey);
    console.log("transfer token authority: ", mint.publicKey.toString());

    const tx = new Transaction();
    try {
        tx.add(Token.createSetAuthorityInstruction(
            TOKEN_PROGRAM_ID, // always token program.
            mint.publicKey, // mint acocunt or token account
            newAuth, // new auth, if you want to turn off the auth, just pass null
            "MintTokens", // authority type, there are 4 types => 'MintTokens' | 'FreezeAccount' | 'AccountOwner' | 'CloseAccount'
            provider.wallet.publicKey, // original auth
            []
        ));
        let pendingTx = await provider.send(tx);
        console.log("signature: ", pendingTx.signature);
    } catch (err) {
        console.log(err);
    }


}

transfer_token_authority()