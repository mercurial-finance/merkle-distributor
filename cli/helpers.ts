


import { BalanceTree } from "../src/utils";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { u64 } from "@saberhq/token-utils";
import * as fs from 'fs';
import { AnchorProvider, setProvider, Wallet } from "@project-serum/anchor";
import snapshot from './snapshot.json'
import { SolanaProvider, TransactionEnvelope } from "@saberhq/solana-contrib";
import { chaiSolana } from "@saberhq/chai-solana";
import chai, { expect } from "chai";
chai.use(chaiSolana);


export const buildTree = () => {
    const elements: { account: PublicKey; amount: u64 }[] = [];
    let maxTotalClaim = 0;
    let maxNumNode = 0;
    for (let i in snapshot) {
        let object = Object(snapshot[i]);
        let amount = new u64(object.amount);
        elements.push({ account: new PublicKey(object.authority), amount });
        maxNumNode++;
        maxTotalClaim = maxTotalClaim + amount.toNumber();
    }
    const tree = new BalanceTree(elements);
    return {
        tree, maxTotalClaim, maxNumNode
    }
}


export const setupEnv = () => {
    let connection = new Connection('https://api.devnet.solana.com/', { commitment: 'confirmed' });
    const decodedKey = new Uint8Array(
        JSON.parse(
            //replace with actual path from home dir. For example '.config/solana/devnet.json'
            fs.readFileSync('./cli/admin.json', 'utf8')
        ));

    let adminWallet = Keypair.fromSecretKey(decodedKey);

    const anchorProvider = new AnchorProvider(connection, new Wallet(adminWallet), {
        commitment: 'confirmed',
    });
    // if the program isn't loaded, load the default
    // Configure the client to use the provider.
    setProvider(anchorProvider);

    const provider = SolanaProvider.init({
        connection: anchorProvider.connection,
        wallet: anchorProvider.wallet,
        opts: anchorProvider.opts,
    });

    return { provider }
}
