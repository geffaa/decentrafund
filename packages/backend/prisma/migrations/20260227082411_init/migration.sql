-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'SUCCESSFUL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'VOTING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CAMPAIGN_FUNDED', 'MILESTONE_SUBMITTED', 'MILESTONE_APPROVED', 'MILESTONE_REJECTED', 'REFUND_AVAILABLE', 'CAMPAIGN_COMPLETED', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "nonce" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "contract_address" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "short_desc" TEXT,
    "image_hash" TEXT,
    "image_url" TEXT,
    "category" TEXT NOT NULL,
    "target_amount" TEXT NOT NULL,
    "current_amount" TEXT NOT NULL DEFAULT '0',
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "tx_hash" TEXT,
    "total_backers" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "votes_for" INTEGER NOT NULL DEFAULT 0,
    "votes_against" INTEGER NOT NULL DEFAULT 0,
    "voting_deadline" TIMESTAMP(3),
    "funds_released" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "block_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_votes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "milestone_id" TEXT NOT NULL,
    "support" BOOLEAN NOT NULL,
    "vote_weight" TEXT NOT NULL,
    "tx_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_stats" (
    "id" TEXT NOT NULL,
    "total_campaigns" INTEGER NOT NULL DEFAULT 0,
    "total_funded" TEXT NOT NULL DEFAULT '0',
    "total_backers" INTEGER NOT NULL DEFAULT 0,
    "success_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_contract_address_key" ON "campaigns"("contract_address");

-- CreateIndex
CREATE INDEX "campaigns_category_idx" ON "campaigns"("category");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_creator_id_idx" ON "campaigns"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_campaign_id_index_key" ON "milestones"("campaign_id", "index");

-- CreateIndex
CREATE UNIQUE INDEX "contributions_tx_hash_key" ON "contributions"("tx_hash");

-- CreateIndex
CREATE INDEX "contributions_user_id_idx" ON "contributions"("user_id");

-- CreateIndex
CREATE INDEX "contributions_campaign_id_idx" ON "contributions"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_votes_user_id_milestone_id_key" ON "milestone_votes"("user_id", "milestone_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_votes" ADD CONSTRAINT "milestone_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_votes" ADD CONSTRAINT "milestone_votes_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
