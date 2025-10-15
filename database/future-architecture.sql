-- Profiles table for business info (run this in Supabase SQL editor)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  website text,
  phone text,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS: users can access only their own row
create policy if not exists "profiles_select_own" on public.profiles for select
using (user_id = auth.uid());

create policy if not exists "profiles_insert_own" on public.profiles for insert
with check (user_id = auth.uid());

create policy if not exists "profiles_update_own" on public.profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================================
-- Phase 1 — Schema: canonical Account & Contact + Orders FKs (idempotent)
-- ============================================================================
-- Extensions (safe if already enabled)
create extension if not exists citext;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- Accounts (organizations) with normalized name for matching & search
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name citext not null unique,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.normalize_account_name(raw text)
returns text language sql immutable as $$
  select regexp_replace(lower(trim(raw)), '(\\s+(inc|llc|ltd|co|corp|corporation|company|limited)\\.?)+$', '', 'gi')
$$;

create or replace function public.accounts_before_ins_upd()
returns trigger language plpgsql as $$
begin
  new.normalized_name := public.normalize_account_name(new.name);
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_accounts_norm on public.accounts;
create trigger trg_accounts_norm before insert or update on public.accounts
for each row execute function public.accounts_before_ins_upd();

-- Contacts (people) keyed by case-insensitive email
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  user_id uuid references auth.users(id) on delete set null,
  business_name text,
  phone text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_contact_ts()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' then new.updated_at := now(); end if;
  return new;
end; $$;

drop trigger if exists trg_contacts_ts on public.contacts;
create trigger trg_contacts_ts before update on public.contacts
for each row execute function public.touch_contact_ts();

-- Optional mapping if a Contact can belong to multiple Accounts (can defer)
create table if not exists public.account_contacts (
  account_id uuid not null references public.accounts(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  role text default 'member',
  primary key (account_id, contact_id)
);

-- Orders: add FKs for account/contact (keep existing snapshot columns)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='orders' and column_name='account_id'
  ) then
    alter table public.orders add column account_id uuid references public.accounts(id);
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='orders' and column_name='contact_id'
  ) then
    alter table public.orders add column contact_id uuid references public.contacts(id);
  end if;
end$$;

create index if not exists idx_orders_account_id on public.orders(account_id);
create index if not exists idx_orders_contact_id on public.orders(contact_id);
create index if not exists idx_accounts_normalized_name_trgm on public.accounts using gin (normalized_name gin_trgm_ops);

-- Optional RLS if you will query contacts client-side (admin uses service role)
-- alter table public.contacts enable row level security;
-- do $$ begin
--   if not exists (
--     select 1 from pg_policies where schemaname='public' and tablename='contacts' and policyname='contacts_select_own'
--   ) then
--     create policy "contacts_select_own" on public.contacts for select using (user_id = auth.uid());
--   end if;
--   if not exists (
--     select 1 from pg_policies where schemaname='public' and tablename='contacts' and policyname='contacts_update_own'
--   ) then
--     create policy "contacts_update_own" on public.contacts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
--   end if;
-- end $$;

-- ============================================================================
-- Phase 3 — Backfill existing data (non-destructive)
-- ============================================================================
-- Seed Accounts from orders.company_name
insert into public.accounts (name)
select distinct company_name
from public.orders
where company_name is not null and company_name <> ''
on conflict (normalized_name) do nothing;

-- Seed Contacts from orders.email
insert into public.contacts (email, business_name, last_seen_at)
select distinct lower(email)::citext, null, max(created_at)
from public.orders
where email is not null and email <> ''
group by lower(email)
on conflict (email) do update set last_seen_at = excluded.last_seen_at;

-- Link Orders to Accounts
update public.orders o
set account_id = a.id
from public.accounts a
where o.company_name is not null
  and a.normalized_name = public.normalize_account_name(o.company_name)
  and o.account_id is null;

-- Link Orders to Contacts
update public.orders o
set contact_id = c.id
from public.contacts c
where o.email is not null
  and lower(o.email) = lower(c.email)
  and o.contact_id is null;

-- =============================================================================
-- FUTURE ARCHITECTURE SCAFFOLD - Agricultural B2B System
--
-- This file contains the enhanced architecture for future development.
-- These tables and features are NOT implemented in the current MVP but
-- provide a clear roadmap for scaling the system.
--
-- 🚧 DO NOT EXECUTE THIS FILE - FOR REFERENCE ONLY 🚧
-- =============================================================================

-- =============================================================================
-- ENHANCED ENUMS (Future)
-- =============================================================================

-- Extended product types for different agricultural offerings
-- CREATE TYPE extended_product_type_enum AS ENUM (
--     'starter',
--     'premium', 
--     'specialty',
--     'bulk',
--     'custom'
-- );

-- More granular order status tracking
-- CREATE TYPE extended_order_status_enum AS ENUM (
--     'draft',
--     'pending_approval',
--     'approved',
--     'confirmed',
--     'in_production',
--     'ready_for_harvest',
--     'harvesting',
--     'processing',
--     'quality_check',
--     'packaging',
--     'ready_for_pickup',
--     'out_for_delivery',
--     'delivered',
--     'completed',
--     'cancelled',
--     'on_hold',
--     'rejected'
-- );

-- Product availability status
-- CREATE TYPE availability_status_enum AS ENUM (
--     'available',
--     'low_stock',
--     'out_of_stock',
--     'seasonal_unavailable',
--     'discontinued'
-- );

-- Order priority levels
-- CREATE TYPE order_priority_enum AS ENUM (
--     'low',
--     'normal', 
--     'high',
--     'urgent'
-- );

-- =============================================================================
-- CUSTOMER MANAGEMENT (Future Enhancement)
-- =============================================================================

-- Companies table for repeat customers and relationship management
-- CREATE TABLE companies (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     
--     -- Company Information
--     company_name TEXT NOT NULL UNIQUE,
--     business_type TEXT, -- Farm, Distributor, Processor, etc.
--     tax_id TEXT,
--     website TEXT,
--     
--     -- Primary Contact
--     primary_contact_name TEXT NOT NULL,
--     primary_email TEXT NOT NULL CHECK (primary_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
--     primary_phone TEXT NOT NULL,
--     
--     -- Business Address
--     business_address TEXT NOT NULL,
--     city TEXT NOT NULL,
--     state TEXT NOT NULL,
--     zip_code TEXT NOT NULL,
--     
--     -- Preferences & Settings
--     preferred_fulfillment_days INTEGER DEFAULT 7,
--     delivery_zone_id UUID REFERENCES delivery_zones(id),
--     payment_terms TEXT DEFAULT 'Net 30',
--     credit_limit DECIMAL(12,2) DEFAULT 0,
--     
--     -- Relationship Status
--     customer_tier TEXT DEFAULT 'standard' CHECK (customer_tier IN ('standard', 'preferred', 'premium')),
--     is_active BOOLEAN DEFAULT true,
--     
--     -- Timestamps
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW(),
--     
--     -- Indexes
--     CONSTRAINT idx_companies_name UNIQUE(company_name)
-- );

-- Additional company contacts for larger organizations
-- CREATE TABLE company_contacts (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
--     
--     name TEXT NOT NULL,
--     title TEXT,
--     email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
--     phone TEXT,
--     department TEXT,
--     is_primary BOOLEAN DEFAULT false,
--     is_active BOOLEAN DEFAULT true,
--     
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================================================
-- ENHANCED PRODUCT MANAGEMENT (Future)
-- =============================================================================

-- Product categories for better organization
-- CREATE TABLE product_categories (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL UNIQUE,
--     description TEXT,
--     sort_order INTEGER DEFAULT 0,
--     is_active BOOLEAN DEFAULT true,
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Enhanced products table with inventory and seasonality
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS bundle_size_kg DECIMAL(8,2);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS grade TEXT CHECK (grade IN ('A', 'B', 'C', 'Premium'));
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS harvest_season TEXT; -- 'Spring 2025', 'Fall 2024', etc.
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_status availability_status_enum DEFAULT 'available';
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_available INTEGER DEFAULT 0 CHECK (stock_available >= 0);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_reserved INTEGER DEFAULT 0 CHECK (stock_reserved >= 0);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_order_quantity INTEGER DEFAULT 1;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS maximum_order_quantity INTEGER;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 7;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Product availability windows (seasonal products)
-- CREATE TABLE product_availability (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
--     
--     harvest_season TEXT NOT NULL, -- 'Spring 2025', 'Fall 2024'
--     available_from TIMESTAMPTZ NOT NULL,
--     available_until TIMESTAMPTZ NOT NULL,
--     
--     total_harvest INTEGER NOT NULL CHECK (total_harvest > 0),
--     available_stock INTEGER NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
--     reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
--     
--     -- Pricing can vary by season/availability
--     seasonal_price_per_bundle DECIMAL(10,2),
--     
--     is_active BOOLEAN DEFAULT true,
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW(),
--     
--     -- Ensure availability dates make sense
--     CHECK (available_until > available_from),
--     CHECK (available_stock + reserved_stock <= total_harvest),
--     
--     -- One availability record per product per season
--     UNIQUE(product_id, harvest_season)
-- );

-- =============================================================================
-- ENHANCED ORDER MANAGEMENT (Future)
-- =============================================================================

-- Link orders to companies (instead of storing customer data inline)
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority order_priority_enum DEFAULT 'normal';
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_fulfillment_date TIMESTAMPTZ;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_fulfillment_date TIMESTAMPTZ;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS harvest_season TEXT;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled'));
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMPTZ;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_rep_notes TEXT;

-- Order status history for complete audit trail
-- CREATE TABLE order_status_history (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
--     
--     previous_status extended_order_status_enum,
--     new_status extended_order_status_enum NOT NULL,
--     
--     changed_by TEXT, -- User ID or 'system'
--     reason TEXT,
--     notes TEXT,
--     
--     changed_at TIMESTAMPTZ DEFAULT NOW(),
--     
--     -- Index for efficient queries
--     INDEX idx_order_status_history_order_id (order_id),
--     INDEX idx_order_status_history_changed_at (changed_at DESC)
-- );

-- Order attachments (contracts, specifications, etc.)
-- CREATE TABLE order_attachments (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
--     
--     filename TEXT NOT NULL,
--     file_path TEXT NOT NULL, -- S3 path or similar
--     file_size INTEGER,
--     mime_type TEXT,
--     description TEXT,
--     
--     uploaded_by TEXT, -- User ID
--     uploaded_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================================================
-- ADVANCED DELIVERY & LOGISTICS (Future)
-- =============================================================================

-- Enhanced delivery zones with more complex pricing
-- ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS region_name TEXT;
-- ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS base_delivery_fee DECIMAL(10,2) DEFAULT 0;
-- ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS per_mile_fee DECIMAL(10,2) DEFAULT 0;
-- ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS minimum_order_for_delivery DECIMAL(10,2) DEFAULT 0;
-- ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS delivery_days TEXT; -- 'Monday,Wednesday,Friday'
-- ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS cutoff_time TIME DEFAULT '12:00:00';

-- Delivery routes and scheduling
-- CREATE TABLE delivery_routes (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     route_name TEXT NOT NULL,
--     delivery_date DATE NOT NULL,
--     driver_name TEXT,
--     vehicle_info TEXT,
--     estimated_start_time TIME,
--     actual_start_time TIME,
--     status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
--     notes TEXT,
--     
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Link orders to delivery routes
-- CREATE TABLE order_deliveries (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
--     route_id UUID REFERENCES delivery_routes(id),
--     
--     scheduled_delivery_time TIMESTAMPTZ,
--     actual_delivery_time TIMESTAMPTZ,
--     delivery_notes TEXT,
--     recipient_signature TEXT, -- Base64 signature or file path
--     
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================================================
-- FINANCIAL MANAGEMENT (Future)
-- =============================================================================

-- Invoicing system
-- CREATE TABLE invoices (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     invoice_number TEXT NOT NULL UNIQUE,
--     order_id UUID NOT NULL REFERENCES orders(id),
--     company_id UUID NOT NULL REFERENCES companies(id),
--     
--     subtotal DECIMAL(12,2) NOT NULL,
--     tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
--     total_amount DECIMAL(12,2) NOT NULL,
--     
--     invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
--     due_date DATE NOT NULL,
--     payment_date DATE,
--     
--     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
--     notes TEXT,
--     
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW(),
--     
--     CHECK (total_amount = subtotal + tax_amount)
-- );

-- Payment tracking
-- CREATE TABLE payments (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     invoice_id UUID NOT NULL REFERENCES invoices(id),
--     
--     amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
--     payment_method TEXT CHECK (payment_method IN ('check', 'wire', 'ach', 'credit_card', 'cash')),
--     reference_number TEXT,
--     payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
--     
--     notes TEXT,
--     
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================================================
-- REPORTING & ANALYTICS (Future)
-- =============================================================================

-- Sales performance tracking
-- CREATE VIEW sales_summary AS
-- SELECT 
--     DATE_TRUNC('month', o.created_at) as month,
--     COUNT(*) as total_orders,
--     SUM(o.total) as total_revenue,
--     AVG(o.total) as average_order_value,
--     COUNT(DISTINCT o.company_id) as unique_customers
-- FROM orders o
-- WHERE o.status NOT IN ('cancelled', 'rejected')
-- GROUP BY DATE_TRUNC('month', o.created_at)
-- ORDER BY month DESC;

-- Product performance tracking
-- CREATE VIEW product_performance AS
-- SELECT 
--     p.name,
--     p.type,
--     COUNT(oi.id) as times_ordered,
--     SUM(oi.quantity) as total_quantity_sold,
--     SUM(oi.total_price) as total_revenue,
--     AVG(oi.unit_price) as average_selling_price
-- FROM products p
-- LEFT JOIN order_items oi ON p.id = oi.product_id
-- LEFT JOIN orders o ON oi.order_id = o.id
-- WHERE o.status NOT IN ('cancelled', 'rejected')
-- GROUP BY p.id, p.name, p.type
-- ORDER BY total_revenue DESC;

-- Customer analysis
-- CREATE VIEW customer_analysis AS
-- SELECT 
--     c.company_name,
--     c.customer_tier,
--     COUNT(o.id) as total_orders,
--     SUM(o.total) as total_spent,
--     AVG(o.total) as average_order_value,
--     MAX(o.created_at) as last_order_date,
--     DATE_PART('day', NOW() - MAX(o.created_at)) as days_since_last_order
-- FROM companies c
-- LEFT JOIN orders o ON c.id = o.company_id
-- WHERE o.status NOT IN ('cancelled', 'rejected')
-- GROUP BY c.id, c.company_name, c.customer_tier
-- ORDER BY total_spent DESC;

-- =============================================================================
-- ADVANCED FEATURES (Future)
-- =============================================================================

-- Inventory reservations for confirmed orders
-- CREATE TABLE inventory_reservations (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     product_id UUID NOT NULL REFERENCES products(id),
--     order_id UUID NOT NULL REFERENCES orders(id),
--     
--     quantity_reserved INTEGER NOT NULL CHECK (quantity_reserved > 0),
--     reserved_at TIMESTAMPTZ DEFAULT NOW(),
--     expires_at TIMESTAMPTZ, -- Auto-release if not fulfilled
--     
--     status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'released', 'expired')),
--     
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Quality control tracking
-- CREATE TABLE quality_inspections (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     order_id UUID NOT NULL REFERENCES orders(id),
--     
--     inspection_date TIMESTAMPTZ DEFAULT NOW(),
--     inspector_name TEXT NOT NULL,
--     
--     overall_grade TEXT CHECK (overall_grade IN ('A', 'B', 'C', 'Rejected')),
--     moisture_content DECIMAL(5,2),
--     purity_percentage DECIMAL(5,2),
--     defect_percentage DECIMAL(5,2),
--     
--     passed BOOLEAN NOT NULL,
--     notes TEXT,
--     
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Customer communications log
-- CREATE TABLE customer_communications (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     company_id UUID NOT NULL REFERENCES companies(id),
--     order_id UUID REFERENCES orders(id),
--     
--     communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'phone', 'meeting', 'note')),
--     subject TEXT,
--     content TEXT NOT NULL,
--     direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
--     
--     contact_person TEXT,
--     staff_member TEXT,
--     
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================

-- When implementing these enhancements:
-- 1. Migrate existing orders to use company_id instead of inline customer data
-- 2. Create default product categories and assign existing products
-- 3. Set up initial product availability records for current products
-- 4. Initialize order status history for existing orders
-- 5. Update application code to use new enum values
-- 6. Create appropriate indexes for performance
-- 7. Update RLS policies for new tables and relationships
-- 8. Create database functions for complex business logic
-- 9. Set up automated tasks for inventory management and order processing
-- 10. Implement audit logging for sensitive operations

-- =============================================================================
-- PERFORMANCE CONSIDERATIONS
-- =============================================================================

-- Recommended indexes for production:
-- CREATE INDEX CONCURRENTLY idx_orders_company_id ON orders(company_id);
-- CREATE INDEX CONCURRENTLY idx_orders_harvest_season ON orders(harvest_season);
-- CREATE INDEX CONCURRENTLY idx_orders_payment_status ON orders(payment_status);
-- CREATE INDEX CONCURRENTLY idx_orders_priority ON orders(priority);
-- CREATE INDEX CONCURRENTLY idx_product_availability_season ON product_availability(harvest_season);
-- CREATE INDEX CONCURRENTLY idx_product_availability_dates ON product_availability(available_from, available_until);
-- CREATE INDEX CONCURRENTLY idx_inventory_reservations_product_status ON inventory_reservations(product_id, status);

-- =============================================================================
-- END OF FUTURE ARCHITECTURE SCAFFOLD
-- =============================================================================