-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "priority" VARCHAR(10) NOT NULL DEFAULT 'medium';

-- RenameIndex
ALTER INDEX "task_id_user_id_unique" RENAME TO "tasks_id_user_id_key";
