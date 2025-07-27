

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."activity_level" AS ENUM (
    'sedentary',
    'light',
    'moderate',
    'active',
    'extra_active'
);


ALTER TYPE "public"."activity_level" OWNER TO "postgres";


CREATE TYPE "public"."biological_sex" AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE "public"."biological_sex" OWNER TO "postgres";


CREATE TYPE "public"."diet_goal" AS ENUM (
    'fat_loss',
    'muscle_gain',
    'recomp'
);


ALTER TYPE "public"."diet_goal" OWNER TO "postgres";


CREATE TYPE "public"."exercise_frequency" AS ENUM (
    '1-2_days',
    '3-4_days',
    '5-6_days',
    'daily'
);


ALTER TYPE "public"."exercise_frequency" OWNER TO "postgres";


CREATE TYPE "public"."exercise_intensity" AS ENUM (
    'light',
    'moderate',
    'vigorous'
);


ALTER TYPE "public"."exercise_intensity" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'free',
    'premium',
    'premium_annual',
    'trial',
    'trial_ended'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."user_rule" AS ENUM (
    'client',
    'coach'
);


ALTER TYPE "public"."user_rule" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RAISE LOG 'Trigger fired for user_id: %', NEW.id;
    
    -- Insert into your custom users table
    BEGIN
        INSERT INTO public.profile (user_id, created_at)
        VALUES (NEW.id, NOW());
        RAISE LOG 'Successfully inserted into users table for user_id: %', NEW.id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'Error inserting into users table for user_id %: %', NEW.id, SQLERRM;
    END;
    
    -- Insert into smart_plan table
    BEGIN
        INSERT INTO public.smart_plan (user_id, created_at, updated_at)
        VALUES (NEW.id, NOW(), NOW());
        RAISE LOG 'Successfully inserted into smart_planner table for user_id: %', NEW.id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'Error inserting into smart_planner table for user_id %: %', NEW.id, SQLERRM;
    END;
    
    -- Insert into meal_plans table
    BEGIN
        INSERT INTO public.meal_plans (user_id, created_at, updated_at)
        VALUES (NEW.id, NOW(), NOW());
        RAISE LOG 'Successfully inserted into meal_plans table for user_id: %', NEW.id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'Error inserting into meal_plans table for user_id %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."meal_plans" (
    "id" integer NOT NULL,
    "user_id" "text" NOT NULL,
    "meal_data" "jsonb" DEFAULT '{"days": [{"meals": [{"name": "Breakfast", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Morning Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Lunch", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Afternoon Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Dinner", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Evening Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}], "day_of_week": "Monday"}, {"meals": [{"name": "Breakfast", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Morning Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Lunch", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Afternoon Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Dinner", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Evening Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}], "day_of_week": "Tuesday"}, {"meals": [{"name": "Breakfast", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Morning Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Lunch", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Afternoon Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Dinner", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Evening Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}], "day_of_week": "Wednesday"}, {"meals": [{"name": "Breakfast", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Morning Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Lunch", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Afternoon Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Dinner", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Evening Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}], "day_of_week": "Thursday"}, {"meals": [{"name": "Breakfast", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Morning Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Lunch", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Afternoon Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Dinner", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Evening Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}], "day_of_week": "Friday"}, {"meals": [{"name": "Breakfast", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Morning Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Lunch", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Afternoon Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Dinner", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Evening Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}], "day_of_week": "Saturday"}, {"meals": [{"name": "Breakfast", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Morning Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Lunch", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Afternoon Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Dinner", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}, {"name": "Evening Snack", "total_fat": null, "custom_name": "", "ingredients": [], "total_carbs": null, "total_protein": null, "total_calories": null}], "day_of_week": "Sunday"}]}'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "ai_plan" "jsonb"
);


ALTER TABLE "public"."meal_plans" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."meal_plans_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."meal_plans_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."meal_plans_id_seq" OWNED BY "public"."meal_plans"."id";



CREATE TABLE IF NOT EXISTS "public"."profile" (
    "id" integer NOT NULL,
    "user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_onboarding_complete" boolean DEFAULT false,
    "age" integer,
    "biological_sex" "public"."biological_sex",
    "height_cm" double precision,
    "current_weight_kg" double precision,
    "target_weight_1month_kg" double precision,
    "long_term_goal_weight_kg" double precision,
    "physical_activity_level" "public"."activity_level",
    "primary_diet_goal" "public"."diet_goal",
    "pain_mobility_issues" "text"[],
    "injuries" "text"[],
    "surgeries" "text"[],
    "exercise_goals" "text"[],
    "preferred_exercise_types" "text"[],
    "exercise_frequency" "public"."exercise_frequency",
    "typical_exercise_intensity" "public"."exercise_intensity",
    "equipment_access" "text"[],
    "subscription_status" "public"."subscription_status",
    "bf_current" double precision,
    "bf_ideal" double precision,
    "bf_target" double precision,
    "bw_current" double precision,
    "bw_ideal" double precision,
    "bw_target" double precision,
    "hips_current" double precision,
    "hips_goal_1m" double precision,
    "hips_ideal" double precision,
    "left_arm_current" double precision,
    "left_arm_goal_1m" double precision,
    "left_arm_ideal" double precision,
    "left_leg_current" double precision,
    "left_leg_goal_1m" double precision,
    "left_leg_ideal" double precision,
    "mm_current" double precision,
    "mm_ideal" double precision,
    "mm_target" double precision,
    "right_arm_current" double precision,
    "right_arm_goal_1m" double precision,
    "right_arm_ideal" double precision,
    "right_leg_current" double precision,
    "right_leg_goal_1m" double precision,
    "right_leg_ideal" double precision,
    "waist_current" double precision,
    "waist_goal_1m" double precision,
    "waist_ideal" double precision,
    "meal_distributions" "jsonb",
    "preferred_diet" "text",
    "preferred_cuisines" "text"[] DEFAULT '{}'::"text"[],
    "dispreferrred_cuisines" "text"[] DEFAULT '{}'::"text"[],
    "preferred_ingredients" "text"[] DEFAULT '{}'::"text"[],
    "dispreferrred_ingredients" "text"[] DEFAULT '{}'::"text"[],
    "allergies" "text"[] DEFAULT '{}'::"text"[],
    "preferred_micronutrients" "text"[] DEFAULT '{}'::"text"[],
    "medical_conditions" "text"[] DEFAULT '{}'::"text"[],
    "medications" "text"[] DEFAULT '{}'::"text"[],
    "user_role" "public"."user_rule",
    CONSTRAINT "users_preferred_diet_check" CHECK (("preferred_diet" = ANY (ARRAY['none'::"text", 'vegetarian'::"text", 'vegan'::"text", 'keto'::"text", 'paleo'::"text", 'mediterranean'::"text", 'low_carb'::"text", 'low_fat'::"text", 'high_protein'::"text"])))
);


ALTER TABLE "public"."profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."smart_plan" (
    "id" integer NOT NULL,
    "user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bmr_kcal" double precision,
    "maintenance_calories_tdee" double precision,
    "target_daily_calories" double precision,
    "target_protein_g" double precision,
    "target_protein_percentage" double precision,
    "target_carbs_g" double precision,
    "target_carbs_percentage" double precision,
    "target_fat_g" double precision,
    "target_fat_percentage" double precision,
    "custom_total_calories" integer,
    "custom_protein_per_kg" numeric(3,1),
    "remaining_calories_carbs_percentage" integer,
    "custom_total_calories_final" integer,
    "custom_protein_g" numeric(5,1),
    "custom_protein_percentage" integer,
    "custom_carbs_g" numeric(5,1),
    "custom_carbs_percentage" integer,
    "custom_fat_g" numeric(5,1),
    "custom_fat_percentage" integer,
    "remaining_calories_carb_pct" double precision
);


ALTER TABLE "public"."smart_plan" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."smart_planner_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."smart_planner_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."smart_planner_id_seq" OWNED BY "public"."smart_plan"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."profile"."id";



ALTER TABLE ONLY "public"."meal_plans" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."meal_plans_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."profile" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."smart_plan" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."smart_planner_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."smart_plan"
    ADD CONSTRAINT "smart_planner_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."smart_plan"
    ADD CONSTRAINT "smart_planner_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "users_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_smart_planner_user_id" ON "public"."smart_plan" USING "btree" ("user_id");



CREATE INDEX "idx_users_user_id" ON "public"."profile" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_smart_planner_updated_at" BEFORE UPDATE ON "public"."smart_plan" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."smart_plan"
    ADD CONSTRAINT "smart_planner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("user_id") ON DELETE CASCADE;



CREATE POLICY "Enable insert access for all users" ON "public"."meal_plans" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for all users " ON "public"."smart_plan" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."profile" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."meal_plans" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profile" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."smart_plan" FOR SELECT USING (true);



CREATE POLICY "Enable update access for all users" ON "public"."meal_plans" FOR UPDATE USING (true);



CREATE POLICY "Enable update access for all users" ON "public"."profile" FOR UPDATE USING (true);



CREATE POLICY "Enable update for all users " ON "public"."smart_plan" FOR UPDATE USING (true);



ALTER TABLE "public"."meal_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."smart_plan" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."meal_plans" TO "anon";
GRANT ALL ON TABLE "public"."meal_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_plans" TO "service_role";



GRANT ALL ON SEQUENCE "public"."meal_plans_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."meal_plans_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."meal_plans_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profile" TO "anon";
GRANT ALL ON TABLE "public"."profile" TO "authenticated";
GRANT ALL ON TABLE "public"."profile" TO "service_role";



GRANT ALL ON TABLE "public"."smart_plan" TO "anon";
GRANT ALL ON TABLE "public"."smart_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."smart_plan" TO "service_role";



GRANT ALL ON SEQUENCE "public"."smart_planner_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."smart_planner_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."smart_planner_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
