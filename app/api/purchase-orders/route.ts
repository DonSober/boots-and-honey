import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'

interface Product {
  type: string
  quantity: number
}

interface ContactInfo {
  companyName: string
  contactName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  poNumber?: string
  specialInstructions?: string
}

interface PurchaseOrderRequest {
  products: Product[]
  contactInfo: ContactInfo
  fulfillmentDate?: string | Date
  deliverySelected: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body: PurchaseOrderRequest = await request.json()

    // Build payload for submit_purchase_order RPC
    // Note: No idempotency key - allows repeat customers to place same order multiple times
    const rpcPayload = {
      products: body.products.map(p => ({
        type: p.type.toLowerCase(),
        quantity: p.quantity
      })),
      contactInfo: {
        companyName: body.contactInfo.companyName,
        contactName: body.contactInfo.contactName,
        email: body.contactInfo.email,
        phone: body.contactInfo.phone,
        address: body.contactInfo.address,
        city: body.contactInfo.city,
        state: body.contactInfo.state,
        zipCode: body.contactInfo.zipCode,
        poNumber: body.contactInfo.poNumber || '',
        specialInstructions: body.contactInfo.specialInstructions || ''
      },
      fulfillmentDate: body.fulfillmentDate
        ? (typeof body.fulfillmentDate === 'string' ? body.fulfillmentDate : body.fulfillmentDate.toISOString())
        : new Date().toISOString(),
      deliverySelected: body.deliverySelected
    }

    // Call the RPC function
    const { data, error } = await supabase.rpc('submit_purchase_order', {
      p_payload: rpcPayload
    })

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to create purchase order', details: error?.message || 'No data returned' },
        { status: 500 }
      )
    }

    const result = data[0]

    return NextResponse.json({
      success: true,
      orderId: result.order_id,
      orderNumber: result.order_number
    })

  } catch (error) {
    console.error('Purchase order error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
