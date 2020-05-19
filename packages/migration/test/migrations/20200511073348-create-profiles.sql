CREATE TABLE "profiles" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "first_name" varchar(255),
  "lase_name" varchar(255),
  "avatar_url" varchar(255),
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  PRIMARY KEY ("id")
);
