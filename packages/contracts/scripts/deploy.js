const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying DecentraFund contracts to", hre.network.name);
    console.log("=".repeat(50));

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    // 1. Deploy DecentraToken
    console.log("\n📦 Deploying DecentraToken...");
    const DecentraToken = await hre.ethers.getContractFactory("DecentraToken");
    const token = await DecentraToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ DecentraToken deployed to:", tokenAddress);

    // 2. Deploy CampaignFactory
    console.log("\n📦 Deploying CampaignFactory...");
    const CampaignFactory = await hre.ethers.getContractFactory("CampaignFactory");
    const factory = await CampaignFactory.deploy();
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("✅ CampaignFactory deployed to:", factoryAddress);

    // 3. Authorize Factory as minter on Token
    console.log("\n🔑 Authorizing CampaignFactory as token minter...");
    const authTx = await token.authorizeMinter(factoryAddress);
    await authTx.wait();
    console.log("✅ Factory authorized as minter");

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📋 Deployment Summary:");
    console.log("=".repeat(50));
    console.log("Network:", hre.network.name);
    console.log("DecentraToken:", tokenAddress);
    console.log("CampaignFactory:", factoryAddress);
    console.log("Owner:", deployer.address);

    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        deployer: deployer.address,
        contracts: {
            DecentraToken: tokenAddress,
            CampaignFactory: factoryAddress,
        },
        timestamp: new Date().toISOString(),
    };

    const deployDir = "./deployments";
    if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir);
    fs.writeFileSync(
        `${deployDir}/${hre.network.name}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`\n💾 Deployment info saved to ${deployDir}/${hre.network.name}.json`);

    // Verify contracts on Etherscan (Sepolia only)
    if (hre.network.name === "sepolia") {
        console.log("\n⏳ Waiting for block confirmations...");
        await new Promise((r) => setTimeout(r, 30000)); // 30s wait

        console.log("🔍 Verifying contracts on Etherscan...");
        try {
            await hre.run("verify:verify", { address: tokenAddress, constructorArguments: [] });
            console.log("✅ DecentraToken verified");
        } catch (e) {
            console.log("⚠️ Token verification:", e.message);
        }

        try {
            await hre.run("verify:verify", { address: factoryAddress, constructorArguments: [] });
            console.log("✅ CampaignFactory verified");
        } catch (e) {
            console.log("⚠️ Factory verification:", e.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
