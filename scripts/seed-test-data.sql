-- ============================================================================
-- Test Data Seeding Script for Phase 1 Testing
-- 
-- This script creates the minimum required product and addon data needed
-- for the testing utilities to function properly.
-- ============================================================================

-- Insert test products
INSERT INTO products (id, name, type, price_per_bundle, description, features) VALUES
  ('test-product-starter-1', 'Test Starter Bundle A', 'starter', 25.00, 'Test starter bundle for development', '["Basic items", "Simple packaging"]'),
  ('test-product-starter-2', 'Test Starter Bundle B', 'starter', 30.00, 'Another test starter bundle', '["Essential items", "Standard packaging"]'),
  ('test-product-premium-1', 'Test Premium Bundle A', 'premium', 50.00, 'Test premium bundle for development', '["Premium items", "Deluxe packaging", "Extra features"]'),
  ('test-product-premium-2', 'Test Premium Bundle B', 'premium', 60.00, 'Another test premium bundle', '["High-end items", "Luxury packaging", "Exclusive features"]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  price_per_bundle = EXCLUDED.price_per_bundle,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Insert test addons
INSERT INTO addons (id, name, description, price, requirements, is_active) VALUES
  ('test-addon-delivery-1', 'Test Local Delivery', 'Test delivery addon for development', 15.00, 'Within 10 miles', true),
  ('test-addon-delivery-2', 'Test Express Delivery', 'Test express delivery addon', 25.00, 'Same day delivery', true),
  ('test-addon-gift-wrap', 'Test Gift Wrapping', 'Test gift wrapping service', 5.00, 'Available for all orders', true),
  ('test-addon-custom-note', 'Test Custom Note', 'Test custom note service', 3.00, 'Personalized message', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  requirements = EXCLUDED.requirements,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Insert test delivery zones (if the table exists)
INSERT INTO delivery_zones (id, zip_code, max_distance_miles, delivery_price, is_active) VALUES
  ('test-zone-90210', '90210', 10, 15.00, true),
  ('test-zone-90211', '90211', 15, 20.00, true),
  ('test-zone-10001', '10001', 12, 18.00, true)
ON CONFLICT (id) DO UPDATE SET
  zip_code = EXCLUDED.zip_code,
  max_distance_miles = EXCLUDED.max_distance_miles,
  delivery_price = EXCLUDED.delivery_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Log completion
SELECT 'Test data seeding completed successfully' as status;