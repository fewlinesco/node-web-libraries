CREATE TABLE "posts" (
  "id" uuid NOT NULL,
  "title" varchar(255) NOT NULL,
  "text" varchar(255) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("id")
);
