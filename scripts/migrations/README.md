# 📊 Database Migrations for Document Tracking System

## Overview
This directory contains database migrations for the webhook-driven document generation system. These migrations add tables for tracking generated documents and email communications without affecting existing functionality.

## 🚀 How to Run Migration 001

Since Supabase doesn't allow direct SQL execution via client libraries, follow these steps:

### Step 1: Open Supabase Dashboard
1. Go to [app.supabase.com](https://app.supabase.com)
2. Open your Boots & Honey project
3. Navigate to **SQL Editor** in the sidebar

### Step 2: Execute Migration
1. Click **"New Query"**
2. Copy the entire contents of `001-document-tracking-tables.sql`
3. Paste into the SQL editor
4. Click **"Run"** to execute the migration

### Step 3: Verify Tables Created
After running the migration, you should see these new tables in the **Table Editor**:

- `order_documents` - Track generated receipts and pick slips
- `order_communications` - Track email notifications  
- `webhook_events` - Log webhook processing events

## 🔍 What the Migration Does

### Creates Three New Tables:

#### 1. `order_documents`
Tracks all generated PDFs (receipts, pick slips):
- Links to orders via `order_id`
- Stores file URLs and paths
- Tracks generation status and errors
- Includes retry mechanisms

#### 2. `order_communications`
Tracks all email communications:
- Links to orders via `order_id`
- Records email delivery status
- Tracks bounce and error handling
- Provider message ID tracking

#### 3. `webhook_events`
Logs all webhook events for debugging:
- Stores webhook payloads
- Tracks processing status
- Records execution times
- Error logging and retry counts

### Performance Optimizations:
- **Indexes** on frequently queried columns
- **Foreign key constraints** to maintain data integrity
- **Check constraints** for data validation
- **Timestamps** with automatic updates

### Security:
- **Row Level Security (RLS)** enabled on all tables
- **Service role policies** for backend access
- **Cascade deletes** to prevent orphaned records

## 🧪 Testing the Migration

After running the migration, test that it worked correctly:

```sql
-- Test that tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('order_documents', 'order_communications', 'webhook_events');

-- Test that indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('order_documents', 'order_communications', 'webhook_events');

-- Test that RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('order_documents', 'order_communications', 'webhook_events');
```

## ⚠️ Safety Notes

- ✅ **Safe to run multiple times** - Uses `IF NOT EXISTS` for idempotency
- ✅ **No existing data affected** - Only creates new tables
- ✅ **Backwards compatible** - Existing order functionality unchanged
- ✅ **Can be rolled back** - Tables can be dropped if needed

## 🔄 Rollback Instructions

If you need to rollback this migration (not recommended unless there are issues):

```sql
-- WARNING: This will delete all document tracking data
DROP TABLE IF EXISTS order_documents CASCADE;
DROP TABLE IF EXISTS order_communications CASCADE; 
DROP TABLE IF EXISTS webhook_events CASCADE;

-- Clean up the update function if no other tables use it
DROP FUNCTION IF EXISTS update_updated_at_column();
```

## 📝 Migration Log

| Version | Date | Description | Status |
|---------|------|-------------|---------|
| 001 | 2025-01-04 | Document tracking tables | ✅ Ready |

## 🔄 Next Steps

After running this migration successfully:

1. ✅ Tables created and verified
2. 🔄 Add environment variables for document services
3. 🔄 Set up testing infrastructure
4. 🔄 Begin Phase 2 implementation

---

**Need Help?** Check the main `WEBHOOK_IMPLEMENTATION.md` file for the complete implementation plan.