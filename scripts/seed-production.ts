#!/usr/bin/env tsx

/**
 * Production-Safe Database Seeding Script
 * 
 * This script uses the SERVICE ROLE KEY to bypass RLS for seeding.
 * 🔑 Key benefits:
 * - RLS remains enabled on all tables (production security)
 * - Service role bypasses RLS for administrative tasks
 * - Safe for use in deployments and local development
 * 
 * Usage:
 *   npm run seed:safe
 *   npm run seed:safe -- --reset  (clears existing data first)
 */

import { createClient } from '@supabase/supabase-js'
import { ProductInsert, AddonInsert, DeliveryZoneInsert } from '../types/database'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey)
  console.error('\nPlease add your service role key to .env.local')
  console.error('You can find it in: Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

// Create client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const products: ProductInsert[] = [
  {
    name: 'Mixed Variety',
    type: 'starter', // Using lowercase to match potential check constraint
    price_per_bundle: 30,
    description: 'Our Standard Harvest',
    features: [
      "12+ Month Maturity",
      "Gold & Green Varieties", 
      "Certified Organic",
      "Harvested to Order"
    ]
  },
  {
    name: 'Golden',
    type: 'premium', // Using lowercase to match potential check constraint
    price_per_bundle: 40,
    description: 'Selectively Harvested',
    features: [
      "18+ Month Maturity",
      "Pure Gold Cane",
      "Certified Organic", 
      "Harvested to Order"
    ]
  }
]

// Delivery zones (structured replacement for text-based requirements)
const deliveryZones: DeliveryZoneInsert[] = [
  {
    zip_code: '92003',
    max_distance_miles: 50,
    delivery_price: 99.00
  },
  {
    zip_code: '92004',
    max_distance_miles: 35,
    delivery_price: 79.00
  },
  {
    zip_code: '92028',
    max_distance_miles: 40,
    delivery_price: 89.00
  }
]

const addons: AddonInsert[] = [
  {
    name: 'Delivery & Disposal',
    description: 'Full service delivery and pulp disposal. Help reduce waste in landfills & contribute to enriching farmlands.',
    price: 99,
    requirements: 'Available in select delivery zones',
    is_active: true
  }
]

async function clearExistingData() {
  console.log('🧹 Clearing existing seed data...')
  
  // Delete in reverse dependency order
  await supabase.from('order_addons').delete().gte('created_at', '1900-01-01')
  await supabase.from('order_items').delete().gte('created_at', '1900-01-01')  
  await supabase.from('orders').delete().gte('created_at', '1900-01-01')
  await supabase.from('addons').delete().in('name', addons.map(a => a.name))
  await supabase.from('products').delete().in('type', products.map(p => p.type))
  await supabase.from('delivery_zones').delete().in('zip_code', deliveryZones.map(d => d.zip_code))
  
  console.log('✅ Existing data cleared')
}

export async function seedDatabase(reset = false) {
  try {
    console.log('🌱 Starting production-safe database seeding...')
    console.log(`🔑 Using service role key: ${serviceRoleKey.slice(0, 20)}...`)
    
    if (reset) {
      await clearExistingData()
    }
    
    // Seed delivery zones first (referenced by addons)
    console.log('🚚 Seeding delivery zones...')
    
    const { data: existingZones } = await supabase
      .from('delivery_zones')
      .select('zip_code')
      .in('zip_code', deliveryZones.map(d => d.zip_code))
    
    const existingZipCodes = new Set(existingZones?.map(z => z.zip_code) || [])
    const newZones = deliveryZones.filter(z => !existingZipCodes.has(z.zip_code))
    
    let zoneData = existingZones || []
    
    if (newZones.length > 0) {
      const { data: insertedZones, error: zoneError } = await supabase
        .from('delivery_zones')
        .insert(newZones)
        .select()
      
      if (zoneError) {
        console.error('❌ Error seeding delivery zones:', zoneError)
        return false
      }
      
      zoneData = [...zoneData, ...(insertedZones || [])]
    } else {
      console.log('   Delivery zones already exist, skipping...')
    }
    
    console.log(`✅ Delivery zones seeded: ${zoneData?.length} records`)
    zoneData?.forEach(z => console.log(`   - ${z.zip_code}: ${z.max_distance_miles} miles ($${z.delivery_price})`))
    
    // Seed products
    console.log('📦 Seeding products...')
    
    // Check if products already exist
    const { data: existingProducts } = await supabase
      .from('products')
      .select('type')
      .in('type', products.map(p => p.type))
    
    const existingTypes = new Set(existingProducts?.map(p => p.type) || [])
    const newProducts = products.filter(p => !existingTypes.has(p.type))
    
    let productData = existingProducts || []
    
    if (newProducts.length > 0) {
      const { data: insertedProducts, error: productError } = await supabase
        .from('products')
        .insert(newProducts)
        .select()
      
      if (productError) {
        console.error('❌ Error seeding products:', productError)
        return false
      }
      
      productData = [...productData, ...(insertedProducts || [])]
    } else {
      console.log('   Products already exist, skipping...')
    }
    
    console.log(`✅ Products seeded: ${productData?.length} records`)
    productData?.forEach(p => console.log(`   - ${p.type}: ${p.name} ($${p.price_per_bundle})`))
    
    // Seed addons
    console.log('🚚 Seeding addons...')
    
    // Check if addons already exist
    const { data: existingAddons } = await supabase
      .from('addons')
      .select('name')
      .in('name', addons.map(a => a.name))
    
    const existingNames = new Set(existingAddons?.map(a => a.name) || [])
    const newAddons = addons.filter(a => !existingNames.has(a.name))
    
    let addonData = existingAddons || []
    
    if (newAddons.length > 0) {
      const { data: insertedAddons, error: addonError } = await supabase
        .from('addons')
        .insert(newAddons)
        .select()
        
      if (addonError) {
        console.error('❌ Error seeding addons:', addonError)
        return false
      }
      
      addonData = [...addonData, ...(insertedAddons || [])]
    } else {
      console.log('   Addons already exist, skipping...')
    }
    
    console.log(`✅ Addons seeded: ${addonData?.length} records`)
    addonData?.forEach(a => console.log(`   - ${a.name}: $${a.price} (${a.is_active ? 'Active' : 'Inactive'})`))
    
    console.log('🎉 Database seeding completed successfully!')
    console.log('📍 Delivery zones:', zoneData?.length)
    console.log('📦 Products:', productData?.length)
    console.log('🚚 Addons:', addonData?.length)
    console.log('')
    console.log('🔒 Note: RLS is still enabled on all tables for production security')
    console.log('📝 You can now test your purchase order flow at http://localhost:3000')
    
    return true
    
  } catch (error) {
    console.error('💥 Seeding failed:', error)
    return false
  }
}

// CLI interface
if (require.main === module) {
  const shouldReset = process.argv.includes('--reset')
  
  seedDatabase(shouldReset).then(success => {
    process.exit(success ? 0 : 1)
  })
}