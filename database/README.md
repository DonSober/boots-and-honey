# 📁 Database Setup - Step by Step

## 🎯 Overview

The database schema has been broken into 5 separate files to avoid dependency issues. Run them in order in your Supabase SQL editor.

## 📋 Execution Order

### 1. Extensions and Enums
```sql
-- Copy/paste: 01-enums-and-extensions.sql
```
- Creates PostgreSQL extensions
- Creates `product_type_enum` ('starter', 'premium')  
- Creates `order_status_enum` (8 status values)

### 2. Create Tables
```sql
-- Copy/paste: 02-create-tables.sql
```
- Creates all 6 tables with proper schemas
- Sets up foreign key relationships
- Adds check constraints for data integrity

### 3. Functions and Triggers
```sql
-- Copy/paste: 03-functions-and-triggers.sql
```
- Creates `generate_order_number()` function (now safe - tables exist)
- Creates `update_updated_at_column()` trigger function
- Applies triggers to all tables with `updated_at` columns

### 4. RLS and Policies  
```sql
-- Copy/paste: 04-rls-and-policies.sql
```
- Enables Row Level Security on all tables
- Creates policies for public catalog access
- Creates policies for authenticated order operations

### 5. Indexes and Initial Data
```sql
-- Copy/paste: 05-indexes-and-data.sql
```
- Creates performance indexes
- Inserts initial delivery zone data
- Adds table/function comments

## ✅ Verification

After running all 5 parts, verify:

1. **Tables exist**: Check that all 6 tables have proper columns
2. **Enums work**: Try `SELECT unnest(enum_range(NULL::product_type_enum));`  
3. **Function works**: Try `SELECT generate_order_number();`
4. **RLS enabled**: Check table properties show RLS as enabled
5. **Data inserted**: Check `delivery_zones` table has the 92003 record

## 🚀 Next Steps

Once all parts are executed successfully:

```bash
# Seed the database with products and delivery zones
npm run seed:safe

# Start the development server
npm run dev
```

## 🔧 Troubleshooting

**If any part fails:**
- Check the error message carefully
- Ensure previous parts completed successfully  
- You can re-run individual parts safely (uses `IF NOT EXISTS` and `CREATE OR REPLACE`)
- Make sure you're running them in the correct order

**Common issues:**
- Enum already exists → Safe to ignore (handled with exception blocks)
- Table already exists → Safe to ignore (uses `IF NOT EXISTS`)
- Function already exists → Safe to ignore (uses `CREATE OR REPLACE`)

The modular approach ensures you can debug and re-run specific parts without starting over!