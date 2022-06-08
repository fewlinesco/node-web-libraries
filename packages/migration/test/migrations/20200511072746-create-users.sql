CREATE TABLE "users" (
  "id" uuid NOT NULL,
  "email" varchar(255),
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("id")
);
