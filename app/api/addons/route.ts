import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: addons, error } = await supabase
      .from('addons')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching addons:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch addons' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: addons
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}