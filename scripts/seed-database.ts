import { createClient } from '@supabase/supabase-js'
import { ProductInsert, AddonInsert } from '../types/database'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const products: ProductInsert[] = [
  {
    name: 'Mixed Variety',
    type: 'starter',
    price_per_bundle: 30,
    description: 'Our Standard Harvest',
    features: JSON.stringify([
      "12+ Month Maturity",
      "Gold & Green Varieties", 
      "Certified Organic",
      "Harvested to Order"
    ])
  },
  {
    name: 'Golden',
    type: 'premium',
    price_per_bundle: 40,
    description: 'Selectively Harvested',
    features: JSON.stringify([
      "18+ Month Maturity",
      "Pure Gold Cane",
      "Certified Organic", 
      "Harvested to Order"
    ])
  }
]

const addons: AddonInsert[] = [
  {
    name: 'Delivery & Disposal',
    description: 'Full service delivery and pulp disposal. Help reduce waste in landfills & contribute to enriching farmlands.',
    price: 99,
    requirements: 'Must be within 50 miles of 92003'
  }
]

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Seed products
    console.log('📦 Seeding products...')
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert(products)
      .select()
    
    if (productError) {
      console.error('❌ Error seeding products:', productError)
      return
    }
    
    console.log('✅ Products seeded successfully:', productData?.length)
    
    // Seed addons
    console.log('🚚 Seeding addons...')
    const { data: addonData, error: addonError } = await supabase
      .from('addons')
      .insert(addons)
      .select()
      
    if (addonError) {
      console.error('❌ Error seeding addons:', addonError)
      return
    }
    
    console.log('✅ Addons seeded successfully:', addonData?.length)
    console.log('🎉 Database seeding completed!')
    
  } catch (error) {
    console.error('💥 Seeding failed:', error)
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
}