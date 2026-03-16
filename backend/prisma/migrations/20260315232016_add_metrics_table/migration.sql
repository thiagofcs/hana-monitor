-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "refresh_interval" INTEGER NOT NULL DEFAULT 5,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "default_w" INTEGER NOT NULL DEFAULT 4,
    "default_h" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);
