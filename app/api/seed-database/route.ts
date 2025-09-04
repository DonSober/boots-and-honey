import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { ProductInsert, AddonInsert } from '@/types/database'

const products: ProductInsert[] = [
  {
    name: 'Mixed Variety',
    type: 'starter',
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
    type: 'premium',
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

const addons: AddonInsert[] = [
  {
    name: 'Delivery & Disposal',
    description: 'Full service delivery and pulp disposal. Help reduce waste in landfills & contribute to enriching farmlands.',
    price: 99,
    requirements: 'Must be within 50 miles of 92003'
  }
]

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Seed products
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert(products)
      .select()
    
    if (productError) {
      console.error('Error seeding products:', productError)
      return NextResponse.json(
        { success: false, error: 'Failed to seed products', details: productError },
        { status: 500 }
      )
    }
    
    // Seed addons
    const { data: addonData, error: addonError } = await supabase
      .from('addons')
      .insert(addons)
      .select()
      
    if (addonError) {
      console.error('Error seeding addons:', addonError)
      return NextResponse.json(
        { success: false, error: 'Failed to seed addons', details: addonError },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        products: productData?.length,
        addons: addonData?.length
      }
    })
    
  } catch (error) {
    console.error('Seeding failed:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}