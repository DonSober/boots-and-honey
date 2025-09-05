import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { Database } from '@/types/database-generated'

type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
type OrderAddonInsert = Database['public']['Tables']['order_addons']['Insert']

interface PurchaseOrderRequest {
  products: Array<{
    id: string
    type: string
    name: string
    price_per_bundle: number
    quantity: number
  }>
  contactInfo: {
    companyName: string
    contactName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    poNumber: string
    specialInstructions: string
  }
  fulfillmentDate?: string | Date
  deliverySelected: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    
    const body: PurchaseOrderRequest = await request.json()
    
    // Generate unique order number using secure database function
    const { data: orderNumberResult, error: orderNumberError } = await supabase
      .rpc('generate_order_number')
    
    if (orderNumberError || !orderNumberResult) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate order number', details: orderNumberError },
        { status: 500 }
      )
    }
    
    const orderNumber = orderNumberResult
    
    // Fetch products from database to get accurate pricing  
    const productTypes = body.products
      .filter(p => p.quantity > 0)
      .map(p => p.type.toLowerCase() as Database['public']['Enums']['product_type_enum'])
      
    const { data: dbProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('type', productTypes)
      
    if (productsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products', details: productsError },
        { status: 500 }
      )
    }
    
    // Calculate total amount using database prices
    let productTotal = 0
    const orderItemsData = []
    
    for (const frontendProduct of body.products.filter(p => p.quantity > 0)) {
      const dbProduct = dbProducts?.find(p => p.type === frontendProduct.type.toLowerCase())
      if (!dbProduct) {
        return NextResponse.json(
          { success: false, error: `Product type ${frontendProduct.type} not found` },
          { status: 400 }
        )
      }
      
      const itemTotal = dbProduct.price_per_bundle * frontendProduct.quantity
      productTotal += itemTotal
      
      orderItemsData.push({
        product_id: dbProduct.id,
        quantity: frontendProduct.quantity,
        unit_price: dbProduct.price_per_bundle,
        total_price: itemTotal
      })
    }
    
    // Handle addon (delivery & disposal)
    let addonTotal = 0
    let deliveryAddon = null
    
    if (body.deliverySelected) {
      const { data: addon, error: addonError } = await supabase
        .from('addons')
        .select('*')
        .eq('name', 'Delivery & Disposal')
        .single()
        
      if (addonError) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch addon', details: addonError },
          { status: 500 }
        )
      }
      
      addonTotal = addon.price
      deliveryAddon = addon
    }
    
    const totalAmount = productTotal + addonTotal
    
    // Insert order
    const orderInsert: OrderInsert = {
      order_number: orderNumber,
      company_name: body.contactInfo.companyName,
      contact_name: body.contactInfo.contactName,
      email: body.contactInfo.email,
      phone: body.contactInfo.phone,
      business_address: body.contactInfo.address,
      city: body.contactInfo.city,
      state: body.contactInfo.state,
      zip_code: body.contactInfo.zipCode,
      po_number: body.contactInfo.poNumber || null,
      special_instructions: body.contactInfo.specialInstructions || null,
      requested_fulfillment_date: body.fulfillmentDate 
        ? (typeof body.fulfillmentDate === 'string' ? body.fulfillmentDate : body.fulfillmentDate.toISOString())
        : new Date().toISOString(),
      subtotal: productTotal,
      addon_total: addonTotal,
      total: totalAmount,
      status: 'pending'
    }
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select()
      .single()

    if (orderError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create order', details: orderError },
        { status: 500 }
      )
    }

    // Insert order items
    if (orderItemsData.length > 0) {
      const orderItems: OrderItemInsert[] = orderItemsData.map(item => ({
        order_id: order.id,
        ...item
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        return NextResponse.json(
          { success: false, error: 'Failed to create order items', details: itemsError },
          { status: 500 }
        )
      }
    }
    
    // Insert order addons if any
    if (deliveryAddon) {
      const orderAddon: OrderAddonInsert = {
        order_id: order.id,
        addon_id: deliveryAddon.id,
        price: deliveryAddon.price
      }
      
      const { error: addonError } = await supabase
        .from('order_addons')
        .insert(orderAddon)
        
      if (addonError) {
        return NextResponse.json(
          { success: false, error: 'Failed to create order addon', details: addonError },
          { status: 500 }
        )
      }
    }
    return NextResponse.json({
      success: true,
      orderId: order.id,
      totalAmount
    })
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}