const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("DecentraFund", function () {
    // ============ Fixtures ============
    async function deployFixture() {
        const [owner, creator, backer1, backer2, backer3] = await ethers.getSigners();

        // Deploy Token
        const DecentraToken = await ethers.getContractFactory("DecentraToken");
        const token = await DecentraToken.deploy();

        // Deploy Factory
        const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
        const factory = await CampaignFactory.deploy();

        // Authorize factory
        await token.authorizeMinter(await factory.getAddress());

        return { token, factory, owner, creator, backer1, backer2, backer3 };
    }

    async function createCampaignFixture() {
        const fixture = await loadFixture(deployFixture);
        const { factory, creator } = fixture;

        const targetAmount = ethers.parseEther("10");
        const milestoneDescriptions = ["MVP Development", "Beta Launch", "Final Release"];
        const milestoneAmounts = [
            ethers.parseEther("3"),
            ethers.parseEther("3"),
            ethers.parseEther("4"),
        ];

        const tx = await factory.connect(creator).createCampaign(
            "Test Campaign",
            "A test crowdfunding campaign",
            "QmTestHash123",
            "Technology",
            targetAmount,
            30, // 30 days
            milestoneDescriptions,
            milestoneAmounts
        );

        const receipt = await tx.wait();
        const event = receipt.logs.find((log) => {
            try {
                return factory.interface.parseLog(log)?.name === "CampaignCreated";
            } catch {
                return false;
            }
        });

        const parsedEvent = factory.interface.parseLog(event);
        const campaignAddress = parsedEvent.args.campaignAddress;

        const Campaign = await ethers.getContractFactory("Campaign");
        const campaign = Campaign.attach(campaignAddress);

        return { ...fixture, campaign, campaignAddress, targetAmount };
    }

    // ============ DecentraToken Tests ============
    describe("DecentraToken", function () {
        it("should deploy with correct name and symbol", async function () {
            const { token } = await loadFixture(deployFixture);
            expect(await token.name()).to.equal("DecentraFund Token");
            expect(await token.symbol()).to.equal("DFUND");
        });

        it("should mint initial supply to owner", async function () {
            const { token, owner } = await loadFixture(deployFixture);
            const maxSupply = await token.MAX_SUPPLY();
            const expectedInitial = (maxSupply * 10n) / 100n;
            expect(await token.balanceOf(owner.address)).to.equal(expectedInitial);
        });

        it("should allow authorized minter to mint", async function () {
            const { token, owner, backer1 } = await loadFixture(deployFixture);
            await token.authorizeMinter(owner.address);
            const ethAmount = ethers.parseEther("1");
            await token.mintForContribution(backer1.address, ethAmount);
            const expectedTokens = ethAmount * 1000n;
            expect(await token.balanceOf(backer1.address)).to.equal(expectedTokens);
        });

        it("should reject unauthorized minting", async function () {
            const { token, backer1 } = await loadFixture(deployFixture);
            await expect(
                token.connect(backer1).mintForContribution(backer1.address, ethers.parseEther("1"))
            ).to.be.revertedWith("Not authorized to mint");
        });
    });

    // ============ CampaignFactory Tests ============
    describe("CampaignFactory", function () {
        it("should create a campaign", async function () {
            const { factory, creator } = await loadFixture(deployFixture);

            const tx = await factory.connect(creator).createCampaign(
                "My Campaign",
                "Description",
                "QmHash",
                "Technology",
                ethers.parseEther("5"),
                30,
                ["Milestone 1"],
                [ethers.parseEther("5")]
            );

            await expect(tx).to.emit(factory, "CampaignCreated");
            expect(await factory.getCampaignCount()).to.equal(1);
        });

        it("should track campaigns by creator", async function () {
            const { factory, creator, backer1 } = await loadFixture(deployFixture);

            // Creator makes 2 campaigns
            await factory.connect(creator).createCampaign("C1", "D1", "H1", "Tech", ethers.parseEther("1"), 30, ["M1"], [ethers.parseEther("1")]);
            await factory.connect(creator).createCampaign("C2", "D2", "H2", "Art", ethers.parseEther("2"), 30, ["M1"], [ethers.parseEther("2")]);

            // Backer1 makes 1 campaign
            await factory.connect(backer1).createCampaign("C3", "D3", "H3", "Tech", ethers.parseEther("1"), 30, ["M1"], [ethers.parseEther("1")]);

            const creatorCampaigns = await factory.getCampaignsByCreator(creator.address);
            expect(creatorCampaigns.length).to.equal(2);

            expect(await factory.getCampaignCount()).to.equal(3);
        });

        it("should reject campaign with empty title", async function () {
            const { factory, creator } = await loadFixture(deployFixture);
            await expect(
                factory.connect(creator).createCampaign("", "Desc", "Hash", "Tech", ethers.parseEther("1"), 30, ["M1"], [ethers.parseEther("1")])
            ).to.be.revertedWith("Title required");
        });
    });

    // ============ Campaign Tests ============
    describe("Campaign", function () {
        it("should store correct campaign info", async function () {
            const { campaign, creator, targetAmount } = await loadFixture(createCampaignFixture);
            const info = await campaign.getCampaignInfo();

            expect(info.creator).to.equal(creator.address);
            expect(info.title).to.equal("Test Campaign");
            expect(info.targetAmount).to.equal(targetAmount);
            expect(info.currentAmount).to.equal(0);
            expect(info.status).to.equal(0); // Active
            expect(info.totalMilestones).to.equal(3);
        });

        it("should accept contributions", async function () {
            const { campaign, backer1 } = await loadFixture(createCampaignFixture);
            const amount = ethers.parseEther("2");

            await expect(campaign.connect(backer1).contribute({ value: amount }))
                .to.emit(campaign, "ContributionMade")
                .withArgs(backer1.address, amount, await time.latest() + 1);

            expect(await campaign.contributions(backer1.address)).to.equal(amount);
            expect(await campaign.currentAmount()).to.equal(amount);
        });

        it("should reject creator self-contribution", async function () {
            const { campaign, creator } = await loadFixture(createCampaignFixture);
            await expect(
                campaign.connect(creator).contribute({ value: ethers.parseEther("1") })
            ).to.be.revertedWith("Creator cannot contribute");
        });

        it("should mark as Successful when target reached", async function () {
            const { campaign, backer1, backer2 } = await loadFixture(createCampaignFixture);

            await campaign.connect(backer1).contribute({ value: ethers.parseEther("6") });
            await campaign.connect(backer2).contribute({ value: ethers.parseEther("4") });

            const info = await campaign.getCampaignInfo();
            expect(info.status).to.equal(1); // Successful
        });

        it("should handle milestone flow: submit → vote → finalize", async function () {
            const { campaign, creator, backer1, backer2 } = await loadFixture(createCampaignFixture);

            // Fund the campaign
            await campaign.connect(backer1).contribute({ value: ethers.parseEther("6") });
            await campaign.connect(backer2).contribute({ value: ethers.parseEther("4") });

            // Creator submits milestone 0
            await campaign.connect(creator).submitMilestone();
            const milestone = await campaign.getMilestone(0);
            expect(milestone.status).to.equal(1); // Voting

            // Backers vote
            await campaign.connect(backer1).voteMilestone(true);
            await campaign.connect(backer2).voteMilestone(true);

            // Fast forward past voting period
            await time.increase(3 * 24 * 60 * 60 + 1); // 3 days + 1 second

            // Finalize milestone
            const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
            await campaign.finalizeMilestone();
            const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);

            // Creator should have received 3 ETH (milestone 0 amount)
            expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(ethers.parseEther("3"));

            // Milestone should be approved
            const finalizedMilestone = await campaign.getMilestone(0);
            expect(finalizedMilestone.status).to.equal(2); // Approved
            expect(await campaign.currentMilestone()).to.equal(1);
        });

        it("should reject milestone if majority votes against", async function () {
            const { campaign, creator, backer1, backer2 } = await loadFixture(createCampaignFixture);

            // Fund
            await campaign.connect(backer1).contribute({ value: ethers.parseEther("6") });
            await campaign.connect(backer2).contribute({ value: ethers.parseEther("4") });

            // Submit & vote against
            await campaign.connect(creator).submitMilestone();
            await campaign.connect(backer1).voteMilestone(false); // 6 ETH weight against
            await campaign.connect(backer2).voteMilestone(true);  // 4 ETH weight for

            // Finalize
            await time.increase(3 * 24 * 60 * 60 + 1);
            await campaign.finalizeMilestone();

            const milestone = await campaign.getMilestone(0);
            expect(milestone.status).to.equal(3); // Rejected
        });

        it("should allow refund when deadline passes without reaching target", async function () {
            const { campaign, backer1 } = await loadFixture(createCampaignFixture);
            const contribution = ethers.parseEther("3");

            await campaign.connect(backer1).contribute({ value: contribution });

            // Fast forward past deadline (30 days)
            await time.increase(31 * 24 * 60 * 60);

            const balanceBefore = await ethers.provider.getBalance(backer1.address);
            const tx = await campaign.connect(backer1).requestRefund();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const balanceAfter = await ethers.provider.getBalance(backer1.address);

            // Should get refund minus gas
            expect(balanceAfter + gasUsed - balanceBefore).to.equal(contribution);
        });

        it("should allow creator to cancel before milestones start", async function () {
            const { campaign, creator, backer1 } = await loadFixture(createCampaignFixture);

            await campaign.connect(backer1).contribute({ value: ethers.parseEther("2") });
            await campaign.connect(creator).cancelCampaign();

            const info = await campaign.getCampaignInfo();
            expect(info.status).to.equal(3); // Cancelled
        });

        it("should support pause/unpause", async function () {
            const { campaign, creator, backer1 } = await loadFixture(createCampaignFixture);

            await campaign.connect(creator).pause();
            await expect(
                campaign.connect(backer1).contribute({ value: ethers.parseEther("1") })
            ).to.be.reverted;

            await campaign.connect(creator).unpause();
            await campaign.connect(backer1).contribute({ value: ethers.parseEther("1") });
            expect(await campaign.currentAmount()).to.equal(ethers.parseEther("1"));
        });
    });
});
