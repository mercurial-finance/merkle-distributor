
import { MerkleDistributorSDK } from "../src/sdk";
import { u64 } from "@saberhq/token-utils";
import { createDistributorWithExistingMint } from "../tests/testutils";
import { chaiSolana } from "@saberhq/chai-solana";
import * as fs from 'fs';
import chai from "chai";
import { Keypair } from "@solana/web3.js";
import { buildTree, setupEnv } from "./helpers";
chai.use(chaiSolana);


var main = async () => {
    const { provider } = setupEnv();
    const sdk = MerkleDistributorSDK.load({ provider });
    const { tree, maxTotalClaim, maxNumNode } = buildTree();
    console.log("Num node: ", maxNumNode);
    console.log("Total claim: ", maxTotalClaim.toString());
    const decodedKey = new Uint8Array(
        JSON.parse(
            //replace with actual path from home dir. For example '.config/solana/devnet.json'
            fs.readFileSync('./cli/met.json', 'utf8')
        ));
    let mint = Keypair.fromSecretKey(decodedKey);

    try {
        const { distributor, pendingDistributor } = await createDistributorWithExistingMint(
            sdk,
            new u64(maxTotalClaim),
            new u64(maxNumNode),
            tree.getRoot(),
            mint.publicKey
        );
        const distributorW = await sdk.loadDistributor(distributor);
        console.log("distributor: ", pendingDistributor.distributor.toString())
        console.log("distributor ATA: ", pendingDistributor.distributorATA)
        console.log(distributorW.data)
    } catch (e) {
        console.log(e)
    }
}

main();