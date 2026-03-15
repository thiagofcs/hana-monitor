-- CreateTable
CREATE TABLE "hana_instances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 30015,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "useSsl" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hana_instances_pkey" PRIMARY KEY ("id")
);
