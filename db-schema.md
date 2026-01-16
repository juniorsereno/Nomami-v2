CREATE SCHEMA "public";
CREATE SCHEMA "auth";
CREATE SCHEMA "neon_auth";
CREATE SCHEMA "pgrst";
CREATE TYPE "TipoPlano" AS ENUM('mensal', 'anual');
CREATE TYPE "TipoContato" AS ENUM('telefone', 'email', 'whatsapp', 'site');
CREATE TYPE "JobStatus" AS ENUM('running', 'completed', 'failed', 'cancelled');
CREATE TYPE "AuditAction" AS ENUM('INSERT', 'UPDATE', 'DELETE');
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
CREATE TABLE "asaas_webhook_logs" (
	"id" serial PRIMARY KEY,
	"received_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"request_body" jsonb,
	"error_message" text,
	"status" varchar(255),
	"asaas_api_response" jsonb
);
CREATE TABLE "assinante_historico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"assinante_id" uuid NOT NULL,
	"acao" varchar(50) NOT NULL,
	"dados_anteriores" jsonb,
	"dados_novos" jsonb,
	"user_id" uuid,
	"observacoes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"action" AuditAction NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"user_id" uuid,
	"ip_address" inet,
	"user_agent" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "cadence_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" varchar(10) NOT NULL,
	"content" text NOT NULL,
	"order_number" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "cadence_messages_type_check" CHECK (CHECK (((type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'video'::character varying])::text[]))))
);
CREATE TABLE "carteirinha_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"carteirinha_id" uuid NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"ip_address" inet,
	"user_agent" text,
	"referer" text,
	"access_type" varchar(20) DEFAULT 'view' NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"response_time_ms" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "carteirinhas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"assinante_id" uuid NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_until" timestamp NOT NULL,
	"qr_code_data" text,
	"card_number" varchar(19),
	"security_hash" varchar(255),
	"access_count" integer DEFAULT 0 NOT NULL,
	"last_accessed" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL
);
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"cnpj" varchar(18) NOT NULL CONSTRAINT "companies_cnpj_key" UNIQUE,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(20) NOT NULL,
	"contact_person" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"created_by" uuid,
	CONSTRAINT "companies_status_check" CHECK (CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'cancelled'::character varying])::text[]))))
);
CREATE TABLE "company_billing_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"billing_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"subscriber_count" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "company_billing_history_status_check" CHECK (CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying])::text[]))))
);
CREATE TABLE "company_plan_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"contracted_quantity" integer NOT NULL,
	"price_per_subscriber" numeric(10, 2) NOT NULL,
	"billing_day" integer NOT NULL,
	"changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"changed_by" uuid
);
CREATE TABLE "company_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL CONSTRAINT "company_plans_company_id_key" UNIQUE,
	"contracted_quantity" integer NOT NULL,
	"price_per_subscriber" numeric(10, 2) NOT NULL,
	"billing_day" integer NOT NULL,
	"start_date" date NOT NULL,
	"next_billing_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "company_plans_billing_day_check" CHECK (CHECK (((billing_day >= 1) AND (billing_day <= 28)))),
	CONSTRAINT "company_plans_contracted_quantity_check" CHECK (CHECK ((contracted_quantity > 0))),
	CONSTRAINT "company_plans_price_per_subscriber_check" CHECK (CHECK ((price_per_subscriber >= (0)::numeric))),
	CONSTRAINT "company_plans_status_check" CHECK (CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'cancelled'::character varying])::text[]))))
);
CREATE TABLE "dashboard_metrics_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"metric_type" varchar(50) NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"metric_data" jsonb NOT NULL,
	"calculated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp NOT NULL
);
CREATE TABLE "job_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"job_name" varchar(100) NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"status" JobStatus NOT NULL,
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"error_details" jsonb,
	"metadata" jsonb,
	"triggered_by" varchar(50) DEFAULT 'system' NOT NULL
);
CREATE TABLE "job_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"job_name" varchar(100) NOT NULL,
	"cron_expression" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run" timestamp,
	"next_run" timestamp,
	"description" text,
	"config" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL
);
CREATE TABLE "parceiros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"nome" varchar(255) NOT NULL,
	"cnpj" varchar(18),
	"categoria" varchar(100),
	"beneficio" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"observacoes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL,
	"endereco" text,
	"telefone" text,
	"logo_url" text,
	"site_url" text,
	"instagram_url" text
);
CREATE TABLE "stripe_webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"request_body" jsonb,
	"status" varchar(50),
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255),
	"phone" varchar(20),
	"email" varchar(255),
	"cpf" varchar(14) CONSTRAINT "subscribers_cpf_unique" UNIQUE,
	"plan_type" varchar(20),
	"start_date" timestamp,
	"next_due_date" timestamp,
	"status" varchar(20),
	"asaas_customer_id" varchar(255),
	"value" numeric(10, 2),
	"stripe_customer_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"asaas_subscription_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"card_id" varchar(12) CONSTRAINT "subscribers_card_id_key" UNIQUE,
	"expired_at" timestamp with time zone,
	"company_id" uuid,
	"subscriber_type" varchar(20) DEFAULT 'individual',
	"removed_at" timestamp with time zone,
	CONSTRAINT "subscribers_subscriber_type_check" CHECK (CHECK (((subscriber_type)::text = ANY ((ARRAY['individual'::character varying, 'corporate'::character varying])::text[]))))
);
CREATE TABLE "subscription_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"assinante_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_date" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"previous_status" varchar(20),
	"new_status" varchar(20),
	"amount" numeric(10, 2),
	"payment_method" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"setting_key" varchar(100) NOT NULL,
	"setting_value" text NOT NULL,
	"setting_type" varchar(20) DEFAULT 'string' NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL
);
CREATE TABLE "telemedicine_batches" (
	"id" serial PRIMARY KEY,
	"batch_identifier" text,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "telemedicine_clients" (
	"id" serial PRIMARY KEY,
	"batch_id" integer,
	"full_name" varchar(255) NOT NULL,
	"cpf" varchar(11) NOT NULL,
	"birth_date" varchar(10) NOT NULL,
	"gender" varchar(1) NOT NULL,
	"cellphone" varchar(11) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" inet,
	"user_agent" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'manager' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL,
	"cpf" varchar(11) CONSTRAINT "users_cpf_key" UNIQUE
);
CREATE TABLE "whatsapp_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" varchar(50) NOT NULL CONSTRAINT "whatsapp_config_key_key" UNIQUE,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "whatsapp_message_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"subscriber_id" uuid,
	"subscriber_name" varchar(255),
	"subscriber_phone" varchar(50),
	"message_id" uuid,
	"message_type" varchar(10),
	"message_content" text,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"api_response" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "whatsapp_message_logs_status_check" CHECK (CHECK (((status)::text = ANY ((ARRAY['success'::character varying, 'failed'::character varying, 'pending'::character varying])::text[]))))
);
CREATE TABLE "neon_auth"."users_sync" (
	"raw_json" jsonb NOT NULL,
	"id" text PRIMARY KEY GENERATED ALWAYS AS ((raw_json ->> 'id'::text)) STORED,
	"name" text GENERATED ALWAYS AS ((raw_json ->> 'display_name'::text)) STORED,
	"email" text GENERATED ALWAYS AS ((raw_json ->> 'primary_email'::text)) STORED,
	"created_at" timestamp with time zone GENERATED ALWAYS AS (to_timestamp((trunc((((raw_json ->> 'signed_up_at_millis'::text))::bigint)::double precision) / (1000)::double precision))) STORED,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
ALTER TABLE "assinante_historico" ADD CONSTRAINT "assinante_historico_assinante_id_fkey" FOREIGN KEY ("assinante_id") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assinante_historico" ADD CONSTRAINT "assinante_historico_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "carteirinha_access_logs" ADD CONSTRAINT "carteirinha_access_logs_carteirinha_id_fkey" FOREIGN KEY ("carteirinha_id") REFERENCES "carteirinhas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "carteirinhas" ADD CONSTRAINT "carteirinhas_assinante_id_fkey" FOREIGN KEY ("assinante_id") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "company_billing_history" ADD CONSTRAINT "company_billing_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;
ALTER TABLE "company_plan_history" ADD CONSTRAINT "company_plan_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id");
ALTER TABLE "company_plan_history" ADD CONSTRAINT "company_plan_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;
ALTER TABLE "company_plans" ADD CONSTRAINT "company_plans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id");
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_assinante_id_fkey" FOREIGN KEY ("assinante_id") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "telemedicine_clients" ADD CONSTRAINT "telemedicine_clients_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "telemedicine_batches"("id") ON DELETE CASCADE;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "cadence_messages"("id") ON DELETE SET NULL;
CREATE UNIQUE INDEX "_prisma_migrations_pkey" ON "_prisma_migrations" ("id");
CREATE UNIQUE INDEX "asaas_webhook_logs_pkey" ON "asaas_webhook_logs" ("id");
CREATE UNIQUE INDEX "assinante_historico_pkey" ON "assinante_historico" ("id");
CREATE UNIQUE INDEX "audit_logs_pkey" ON "audit_logs" ("id");
CREATE UNIQUE INDEX "cadence_messages_pkey" ON "cadence_messages" ("id");
CREATE INDEX "idx_cadence_is_active" ON "cadence_messages" ("is_active");
CREATE UNIQUE INDEX "idx_cadence_order_active" ON "cadence_messages" ("order_number");
CREATE UNIQUE INDEX "carteirinha_access_logs_pkey" ON "carteirinha_access_logs" ("id");
CREATE UNIQUE INDEX "carteirinhas_assinante_id_key" ON "carteirinhas" ("assinante_id");
CREATE UNIQUE INDEX "carteirinhas_cpf_key" ON "carteirinhas" ("cpf");
CREATE UNIQUE INDEX "carteirinhas_pkey" ON "carteirinhas" ("id");
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies" ("cnpj");
CREATE UNIQUE INDEX "companies_pkey" ON "companies" ("id");
CREATE INDEX "idx_companies_cnpj" ON "companies" ("cnpj");
CREATE INDEX "idx_companies_status" ON "companies" ("status");
CREATE UNIQUE INDEX "company_billing_history_pkey" ON "company_billing_history" ("id");
CREATE INDEX "idx_company_billing_history_company_id" ON "company_billing_history" ("company_id");
CREATE INDEX "idx_company_billing_history_status" ON "company_billing_history" ("status");
CREATE UNIQUE INDEX "company_plan_history_pkey" ON "company_plan_history" ("id");
CREATE INDEX "idx_company_plan_history_company_id" ON "company_plan_history" ("company_id");
CREATE UNIQUE INDEX "company_plans_company_id_key" ON "company_plans" ("company_id");
CREATE UNIQUE INDEX "company_plans_pkey" ON "company_plans" ("id");
CREATE INDEX "idx_company_plans_company_id" ON "company_plans" ("company_id");
CREATE UNIQUE INDEX "dashboard_metrics_cache_metric_type_period_type_period_star_key" ON "dashboard_metrics_cache" ("metric_type","period_type","period_start","period_end");
CREATE UNIQUE INDEX "dashboard_metrics_cache_pkey" ON "dashboard_metrics_cache" ("id");
CREATE UNIQUE INDEX "job_executions_pkey" ON "job_executions" ("id");
CREATE UNIQUE INDEX "job_schedules_job_name_key" ON "job_schedules" ("job_name");
CREATE UNIQUE INDEX "job_schedules_pkey" ON "job_schedules" ("id");
CREATE INDEX "idx_parceiros_ativo" ON "parceiros" ("ativo");
CREATE INDEX "idx_parceiros_categoria" ON "parceiros" ("categoria");
CREATE UNIQUE INDEX "parceiros_cnpj_key" ON "parceiros" ("cnpj");
CREATE UNIQUE INDEX "parceiros_pkey" ON "parceiros" ("id");
CREATE UNIQUE INDEX "stripe_webhook_logs_pkey" ON "stripe_webhook_logs" ("id");
CREATE INDEX "idx_subscribers_company_id" ON "subscribers" ("company_id");
CREATE INDEX "idx_subscribers_corporate" ON "subscribers" ("company_id","status");
CREATE INDEX "idx_subscribers_created_at" ON "subscribers" ("created_at");
CREATE INDEX "idx_subscribers_email" ON "subscribers" ("email");
CREATE INDEX "idx_subscribers_expired_at" ON "subscribers" ("expired_at");
CREATE INDEX "idx_subscribers_name_lower" ON "subscribers" ("lower((name)::text)");
CREATE INDEX "idx_subscribers_next_due_date" ON "subscribers" ("next_due_date");
CREATE INDEX "idx_subscribers_phone" ON "subscribers" ("phone");
CREATE INDEX "idx_subscribers_removed_at" ON "subscribers" ("removed_at");
CREATE INDEX "idx_subscribers_start_date" ON "subscribers" ("start_date");
CREATE INDEX "idx_subscribers_status" ON "subscribers" ("status");
CREATE INDEX "idx_subscribers_status_plan" ON "subscribers" ("status","plan_type");
CREATE INDEX "idx_subscribers_stripe_subscription_id" ON "subscribers" ("stripe_subscription_id");
CREATE INDEX "idx_subscribers_type" ON "subscribers" ("subscriber_type");
CREATE UNIQUE INDEX "subscribers_card_id_key" ON "subscribers" ("card_id");
CREATE UNIQUE INDEX "subscribers_cpf_unique" ON "subscribers" ("cpf");
CREATE UNIQUE INDEX "subscribers_pkey" ON "subscribers" ("id");
CREATE UNIQUE INDEX "subscription_events_pkey" ON "subscription_events" ("id");
CREATE UNIQUE INDEX "system_settings_pkey" ON "system_settings" ("id");
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings" ("setting_key");
CREATE INDEX "idx_telemedicine_batches_created_at" ON "telemedicine_batches" ("created_at");
CREATE INDEX "idx_telemedicine_batches_status" ON "telemedicine_batches" ("status");
CREATE UNIQUE INDEX "telemedicine_batches_pkey" ON "telemedicine_batches" ("id");
CREATE INDEX "idx_telemedicine_clients_batch_id" ON "telemedicine_clients" ("batch_id");
CREATE UNIQUE INDEX "telemedicine_clients_pkey" ON "telemedicine_clients" ("id");
CREATE UNIQUE INDEX "user_sessions_pkey" ON "user_sessions" ("id");
CREATE INDEX "idx_users_ativo" ON "users" ("ativo");
CREATE INDEX "idx_users_email" ON "users" ("email");
CREATE UNIQUE INDEX "users_cpf_key" ON "users" ("cpf");
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "users_pkey" ON "users" ("id");
CREATE UNIQUE INDEX "whatsapp_config_key_key" ON "whatsapp_config" ("key");
CREATE UNIQUE INDEX "whatsapp_config_pkey" ON "whatsapp_config" ("id");
CREATE INDEX "idx_whatsapp_logs_created_at" ON "whatsapp_message_logs" ("created_at");
CREATE INDEX "idx_whatsapp_logs_status" ON "whatsapp_message_logs" ("status");
CREATE INDEX "idx_whatsapp_logs_status_date" ON "whatsapp_message_logs" ("status","created_at");
CREATE UNIQUE INDEX "whatsapp_message_logs_pkey" ON "whatsapp_message_logs" ("id");
CREATE INDEX "users_sync_deleted_at_idx" ON "neon_auth"."users_sync" ("deleted_at");
CREATE UNIQUE INDEX "users_sync_pkey" ON "neon_auth"."users_sync" ("id");