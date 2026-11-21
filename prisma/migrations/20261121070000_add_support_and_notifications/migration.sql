-- CreateEnum
CREATE TYPE "SupportTicketCategory" AS ENUM ('ACCOUNT_LOGIN', 'SUBSCRIPTION_BILLING', 'DOMAIN_WEBSITE', 'TECHNICAL_ISSUE', 'FEATURE_REQUEST', 'GENERAL_INQUIRY', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_TENANT', 'TRIAL_EXPIRING', 'PENDING_PAYMENT', 'DOMAIN_REQUEST', 'SUPPORT_TICKET_NEW', 'SUPPORT_TICKET_REPLY', 'SUPPORT_TICKET_URGENT', 'SYSTEM_ALERT');

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "category" "SupportTicketCategory" NOT NULL DEFAULT 'GENERAL_INQUIRY',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'NEW',
    "requester_user_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "assigned_staff_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM_ALERT',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "support_tickets_requester_user_id_idx" ON "support_tickets"("requester_user_id");

-- CreateIndex
CREATE INDEX "support_tickets_tenant_id_idx" ON "support_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "support_tickets_assigned_staff_id_idx" ON "support_tickets"("assigned_staff_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_tickets_category_idx" ON "support_tickets"("category");

-- CreateIndex
CREATE INDEX "support_tickets_created_at_idx" ON "support_tickets"("created_at");

-- CreateIndex
CREATE INDEX "support_ticket_messages_ticket_id_idx" ON "support_ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "support_ticket_messages_author_user_id_idx" ON "support_ticket_messages"("author_user_id");

-- CreateIndex
CREATE INDEX "support_ticket_messages_created_at_idx" ON "support_ticket_messages"("created_at");

-- CreateIndex
CREATE INDEX "platform_notifications_user_id_idx" ON "platform_notifications"("user_id");

-- CreateIndex
CREATE INDEX "platform_notifications_is_read_idx" ON "platform_notifications"("is_read");

-- CreateIndex
CREATE INDEX "platform_notifications_type_idx" ON "platform_notifications"("type");

-- CreateIndex
CREATE INDEX "platform_notifications_created_at_idx" ON "platform_notifications"("created_at");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_notifications" ADD CONSTRAINT "platform_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
