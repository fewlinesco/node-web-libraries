CREATE TABLE "posts" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "kind" varchar(255) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW(),
  "exercise_repo_hook" varchar(255),
  FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  PRIMARY KEY ("id")
);
