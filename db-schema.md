CREATE SCHEMA "auth";
CREATE SCHEMA "neon_auth";
CREATE SCHEMA "pgrst";
CREATE SCHEMA "public";
CREATE TYPE "AuditAction" AS ENUM('INSERT', 'UPDATE', 'DELETE');
CREATE TYPE "JobStatus" AS ENUM('running', 'completed', 'failed', 'cancelled');
CREATE TYPE "TipoContato" AS ENUM('telefone', 'email', 'whatsapp', 'site');
CREATE TYPE "TipoPlano" AS ENUM('mensal', 'anual');
CREATE TABLE "neon_auth"."users_sync" (
	"raw_json" jsonb NOT NULL,
	"id" text NOT NULL,
	"name" text,
	"email" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	PRIMARY KEY ("id")
);
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "asaas_webhook_logs" (
	"id" integer DEFAULT nextval('asaas_webhook_logs_id_seq'::regclass) NOT NULL,
	"received_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"request_body" jsonb,
	"error_message" text,
	"status" varchar(255),
	"asaas_api_response" jsonb,
	PRIMARY KEY ("id")
);
CREATE TABLE "assinante_historico" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"assinante_id" uuid NOT NULL,
	"acao" varchar(50) NOT NULL,
	"dados_anteriores" jsonb,
	"dados_novos" jsonb,
	"user_id" uuid,
	"observacoes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "audit_logs" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"action" AuditAction NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"user_id" uuid,
	"ip_address" inet,
	"user_agent" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "cadence_messages" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(10) NOT NULL,
	"content" text NOT NULL,
	"order_number" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY ("id"),
	CONSTRAINT "cadence_messages_type_check" CHECK (((type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'video'::character varying])::text[])))
);
CREATE TABLE "carteirinha_access_logs" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"carteirinha_id" uuid NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"ip_address" inet,
	"user_agent" text,
	"referer" text,
	"access_type" varchar(20) DEFAULT 'view'::character varying NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"response_time_ms" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "carteirinhas" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
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
	"updated_at" timestamp NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "companies" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"cnpj" varchar(18) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(20) NOT NULL,
	"contact_person" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'active'::character varying NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"created_by" uuid,
	PRIMARY KEY ("id"),
	CONSTRAINT "companies_cnpj_key" UNIQUE,
	CONSTRAINT "companies_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'cancelled'::character varying])::text[])))
);
CREATE TABLE "company_billing_history" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"billing_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"subscriber_count" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending'::character varying NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY ("id"),
	CONSTRAINT "company_billing_history_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying])::text[])))
);
CREATE TABLE "company_plan_history" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"contracted_quantity" integer NOT NULL,
	"price_per_subscriber" numeric(10, 2) NOT NULL,
	"billing_day" integer NOT NULL,
	"changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"changed_by" uuid,
	PRIMARY KEY ("id")
);
CREATE TABLE "company_plans" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"contracted_quantity" integer NOT NULL,
	"price_per_subscriber" numeric(10, 2) NOT NULL,
	"billing_day" integer NOT NULL,
	"start_date" date NOT NULL,
	"next_billing_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'active'::character varying NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY ("id"),
	CONSTRAINT "company_plans_company_id_key" UNIQUE,
	CONSTRAINT "company_plans_contracted_quantity_check" CHECK ((contracted_quantity > 0)),
	CONSTRAINT "company_plans_price_per_subscriber_check" CHECK ((price_per_subscriber >= (0)::numeric)),
	CONSTRAINT "company_plans_billing_day_check" CHECK (((billing_day >= 1) AND (billing_day <= 28))),
	CONSTRAINT "company_plans_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'cancelled'::character varying])::text[])))
);
CREATE TABLE "dashboard_metrics_cache" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"metric_data" jsonb NOT NULL,
	"calculated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "job_executions" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
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
	"triggered_by" varchar(50) DEFAULT 'system'::character varying NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "job_schedules" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"job_name" varchar(100) NOT NULL,
	"cron_expression" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run" timestamp,
	"next_run" timestamp,
	"description" text,
	"config" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "parceiros" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
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
	"instagram_url" text,
	PRIMARY KEY ("id")
);
CREATE TABLE "stripe_webhook_logs" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"request_body" jsonb,
	"status" varchar(50),
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	PRIMARY KEY ("id")
);
CREATE TABLE "subscribers" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"phone" varchar(20),
	"email" varchar(255),
	"cpf" varchar(14),
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
	"card_id" varchar(12),
	"expired_at" timestamp with time zone,
	"company_id" uuid,
	"subscriber_type" varchar(20) DEFAULT 'individual'::character varying,
	"removed_at" timestamp with time zone,
	PRIMARY KEY ("id"),
	CONSTRAINT "subscribers_card_id_key" UNIQUE,
	CONSTRAINT "subscribers_cpf_unique" UNIQUE,
	CONSTRAINT "subscribers_subscriber_type_check" CHECK (((subscriber_type)::text = ANY ((ARRAY['individual'::character varying, 'corporate'::character varying])::text[])))
);
CREATE TABLE "subscription_events" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"assinante_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_date" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"previous_status" varchar(20),
	"new_status" varchar(20),
	"amount" numeric(10, 2),
	"payment_method" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "system_settings" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" text NOT NULL,
	"setting_type" varchar(20) DEFAULT 'string'::character varying NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "telemedicine_api_logs" (
	"id" integer DEFAULT nextval('telemedicine_api_logs_id_seq'::regclass) NOT NULL,
	"batch_id" integer,
	"request_body" jsonb NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY ("id")
);
CREATE TABLE "telemedicine_batches" (
	"id" integer DEFAULT nextval('telemedicine_batches_id_seq'::regclass) NOT NULL,
	"batch_identifier" text,
	"status" varchar(50) DEFAULT 'active'::character varying,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY ("id")
);
CREATE TABLE "telemedicine_clients" (
	"id" integer DEFAULT nextval('telemedicine_clients_id_seq'::regclass) NOT NULL,
	"batch_id" integer,
	"full_name" varchar(255) NOT NULL,
	"cpf" varchar(11) NOT NULL,
	"birth_date" varchar(10) NOT NULL,
	"gender" varchar(1) NOT NULL,
	"cellphone" varchar(11) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY ("id")
);
CREATE TABLE "user_sessions" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" inet,
	"user_agent" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY ("id")
);
CREATE TABLE "users" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'manager'::character varying NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL,
	"cpf" varchar(11),
	PRIMARY KEY ("id"),
	CONSTRAINT "users_cpf_key" UNIQUE
);
CREATE TABLE "whatsapp_config" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(50) NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY ("id"),
	CONSTRAINT "whatsapp_config_key_key" UNIQUE
);
CREATE TABLE "whatsapp_message_logs" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
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
	PRIMARY KEY ("id"),
	CONSTRAINT "whatsapp_message_logs_status_check" CHECK (((status)::text = ANY ((ARRAY['success'::character varying, 'failed'::character varying, 'pending'::character varying])::text[])))
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
ALTER TABLE "telemedicine_api_logs" ADD CONSTRAINT "telemedicine_api_logs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "telemedicine_batches"("id") ON DELETE CASCADE;
ALTER TABLE "telemedicine_clients" ADD CONSTRAINT "telemedicine_clients_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "telemedicine_batches"("id") ON DELETE CASCADE;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "cadence_messages"("id") ON DELETE SET NULL;
CREATE INDEX users_sync_deleted_at_idx ON neon_auth.users_sync USING btree (deleted_at);
CREATE UNIQUE INDEX users_sync_pkey ON neon_auth.users_sync USING btree (id);
CREATE UNIQUE INDEX _prisma_migrations_pkey ON public._prisma_migrations USING btree (id);
CREATE UNIQUE INDEX asaas_webhook_logs_pkey ON public.asaas_webhook_logs USING btree (id);
CREATE UNIQUE INDEX assinante_historico_pkey ON public.assinante_historico USING btree (id);
CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);
CREATE UNIQUE INDEX cadence_messages_pkey ON public.cadence_messages USING btree (id);
CREATE INDEX idx_cadence_is_active ON public.cadence_messages USING btree (is_active);
CREATE UNIQUE INDEX idx_cadence_order_active ON public.cadence_messages USING btree (order_number) WHERE (is_active = true);
CREATE UNIQUE INDEX carteirinha_access_logs_pkey ON public.carteirinha_access_logs USING btree (id);
CREATE UNIQUE INDEX carteirinhas_assinante_id_key ON public.carteirinhas USING btree (assinante_id);
CREATE UNIQUE INDEX carteirinhas_cpf_key ON public.carteirinhas USING btree (cpf);
CREATE UNIQUE INDEX carteirinhas_pkey ON public.carteirinhas USING btree (id);
CREATE UNIQUE INDEX companies_cnpj_key ON public.companies USING btree (cnpj);
CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);
CREATE INDEX idx_companies_cnpj ON public.companies USING btree (cnpj);
CREATE INDEX idx_companies_status ON public.companies USING btree (status);
CREATE UNIQUE INDEX company_billing_history_pkey ON public.company_billing_history USING btree (id);
CREATE INDEX idx_company_billing_history_company_id ON public.company_billing_history USING btree (company_id);
CREATE INDEX idx_company_billing_history_status ON public.company_billing_history USING btree (status);
CREATE UNIQUE INDEX company_plan_history_pkey ON public.company_plan_history USING btree (id);
CREATE INDEX idx_company_plan_history_company_id ON public.company_plan_history USING btree (company_id);
CREATE UNIQUE INDEX company_plans_company_id_key ON public.company_plans USING btree (company_id);
CREATE UNIQUE INDEX company_plans_pkey ON public.company_plans USING btree (id);
CREATE INDEX idx_company_plans_company_id ON public.company_plans USING btree (company_id);
CREATE UNIQUE INDEX dashboard_metrics_cache_metric_type_period_type_period_star_key ON public.dashboard_metrics_cache USING btree (metric_type, period_type, period_start, period_end);
CREATE UNIQUE INDEX dashboard_metrics_cache_pkey ON public.dashboard_metrics_cache USING btree (id);
CREATE UNIQUE INDEX job_executions_pkey ON public.job_executions USING btree (id);
CREATE UNIQUE INDEX job_schedules_job_name_key ON public.job_schedules USING btree (job_name);
CREATE UNIQUE INDEX job_schedules_pkey ON public.job_schedules USING btree (id);
CREATE INDEX idx_parceiros_ativo ON public.parceiros USING btree (ativo);
CREATE INDEX idx_parceiros_categoria ON public.parceiros USING btree (categoria);
CREATE UNIQUE INDEX parceiros_cnpj_key ON public.parceiros USING btree (cnpj);
CREATE UNIQUE INDEX parceiros_pkey ON public.parceiros USING btree (id);
CREATE UNIQUE INDEX stripe_webhook_logs_pkey ON public.stripe_webhook_logs USING btree (id);
CREATE INDEX idx_subscribers_company_id ON public.subscribers USING btree (company_id);
CREATE INDEX idx_subscribers_corporate ON public.subscribers USING btree (company_id, status) WHERE ((subscriber_type)::text = 'corporate'::text);
CREATE INDEX idx_subscribers_created_at ON public.subscribers USING btree (created_at);
CREATE INDEX idx_subscribers_email ON public.subscribers USING btree (email);
CREATE INDEX idx_subscribers_expired_at ON public.subscribers USING btree (expired_at);
CREATE INDEX idx_subscribers_name_lower ON public.subscribers USING btree (lower((name)::text));
CREATE INDEX idx_subscribers_next_due_date ON public.subscribers USING btree (next_due_date);
CREATE INDEX idx_subscribers_phone ON public.subscribers USING btree (phone);
CREATE INDEX idx_subscribers_removed_at ON public.subscribers USING btree (removed_at);
CREATE INDEX idx_subscribers_start_date ON public.subscribers USING btree (start_date);
CREATE INDEX idx_subscribers_status ON public.subscribers USING btree (status);
CREATE INDEX idx_subscribers_status_plan ON public.subscribers USING btree (status, plan_type);
CREATE INDEX idx_subscribers_stripe_subscription_id ON public.subscribers USING btree (stripe_subscription_id);
CREATE INDEX idx_subscribers_type ON public.subscribers USING btree (subscriber_type);
CREATE UNIQUE INDEX subscribers_card_id_key ON public.subscribers USING btree (card_id);
CREATE UNIQUE INDEX subscribers_cpf_unique ON public.subscribers USING btree (cpf);
CREATE UNIQUE INDEX subscribers_pkey ON public.subscribers USING btree (id);
CREATE UNIQUE INDEX subscription_events_pkey ON public.subscription_events USING btree (id);
CREATE UNIQUE INDEX system_settings_pkey ON public.system_settings USING btree (id);
CREATE UNIQUE INDEX system_settings_setting_key_key ON public.system_settings USING btree (setting_key);
CREATE INDEX idx_telemedicine_api_logs_batch_id ON public.telemedicine_api_logs USING btree (batch_id);
CREATE INDEX idx_telemedicine_api_logs_created_at ON public.telemedicine_api_logs USING btree (created_at);
CREATE UNIQUE INDEX telemedicine_api_logs_pkey ON public.telemedicine_api_logs USING btree (id);
CREATE INDEX idx_telemedicine_batches_created_at ON public.telemedicine_batches USING btree (created_at);
CREATE INDEX idx_telemedicine_batches_status ON public.telemedicine_batches USING btree (status);
CREATE UNIQUE INDEX telemedicine_batches_pkey ON public.telemedicine_batches USING btree (id);
CREATE INDEX idx_telemedicine_clients_batch_id ON public.telemedicine_clients USING btree (batch_id);
CREATE UNIQUE INDEX telemedicine_clients_pkey ON public.telemedicine_clients USING btree (id);
CREATE UNIQUE INDEX user_sessions_pkey ON public.user_sessions USING btree (id);
CREATE INDEX idx_users_ativo ON public.users USING btree (ativo);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE UNIQUE INDEX users_cpf_key ON public.users USING btree (cpf);
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);
CREATE UNIQUE INDEX whatsapp_config_key_key ON public.whatsapp_config USING btree (key);
CREATE UNIQUE INDEX whatsapp_config_pkey ON public.whatsapp_config USING btree (id);
CREATE INDEX idx_whatsapp_logs_created_at ON public.whatsapp_message_logs USING btree (created_at DESC);
CREATE INDEX idx_whatsapp_logs_status ON public.whatsapp_message_logs USING btree (status);
CREATE INDEX idx_whatsapp_logs_status_date ON public.whatsapp_message_logs USING btree (status, created_at DESC);
CREATE UNIQUE INDEX whatsapp_message_logs_pkey ON public.whatsapp_message_logs USING btree (id);
