import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Read from products_view for backward compatibility
    // This view combines products_v2 + product_variants with legacy shape
    const { data: products, error } = await supabase
      .from('products_view')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: products
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
