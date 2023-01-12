
import { MerkleDistributorSDK } from "../src/sdk";
import { u64 } from "@saberhq/token-utils";
import { createAndSeedDistributor } from "../tests/testutils";
import { chaiSolana } from "@saberhq/chai-solana";
import chai from "chai";
import { buildTree, setupEnv } from "./helpers";
chai.use(chaiSolana);


var main = async () => {
    const { provider } = setupEnv();
    const sdk = MerkleDistributorSDK.load({ provider });
    const { tree, maxTotalClaim, maxNumNode } = buildTree();
    console.log("Num node: ", maxNumNode);
    console.log("Total claim: ", maxTotalClaim.toString());
    try {
        const { distributor, pendingDistributor } = await createAndSeedDistributor(
            sdk,
            new u64(maxTotalClaim),
            new u64(maxNumNode),
            tree.getRoot()
        );
        const distributorW = await sdk.loadDistributor(distributor);
        console.log(pendingDistributor)
        console.log(distributorW.data)
    } catch (e) {
        console.log(e)
    }
}

main();