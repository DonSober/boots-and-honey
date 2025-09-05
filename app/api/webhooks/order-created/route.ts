import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const payload = await request.json()
    console.log('Received webhook:', payload)

    // Extract order ID from payload
    const orderId = payload.record?.id || payload.order_id
    if (!orderId) {
      return NextResponse.json(
        { error: 'No order ID found in payload' },
        { status: 400 }
      )
    }

    // Get order data from database
    const supabase = createServiceRoleClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products (
          name,
          type,
          description
        )
      `)
      .eq('order_id', orderId)

    if (itemsError) {
      throw new Error(`Failed to fetch order items: ${itemsError.message}`)
    }

    // Get order addons
    const { data: addons, error: addonsError } = await supabase
      .from('order_addons')
      .select(`
        *,
        addons (
          name,
          description
        )
      `)
      .eq('order_id', orderId)

    if (addonsError) {
      throw new Error(`Failed to fetch order addons: ${addonsError.message}`)
    }

    // Generate receipt PDF
    const receiptPdf = await generateReceiptPDF({
      order,
      items: items || [],
      addons: addons || []
    })

    // Store in Supabase Storage
    const fileName = `receipt_${order.order_number}_${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('order-documents')
      .upload(`receipts/${fileName}`, receiptPdf, {
        contentType: 'application/pdf'
      })

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('order-documents')
      .getPublicUrl(`receipts/${fileName}`)

    // Record in order_documents table
    const { error: recordError } = await supabase
      .from('order_documents')
      .insert({
        order_id: orderId,
        document_type: 'receipt',
        file_url: publicUrl,
        file_path: uploadData.path,
        status: 'generated',
        generated_at: new Date().toISOString(),
        metadata: {
          webhook_triggered: true,
          generated_at: new Date().toISOString()
        }
      })

    if (recordError) {
      console.warn('Failed to record document:', recordError.message)
    }

    return NextResponse.json({
      success: true,
      orderId,
      documentUrl: publicUrl
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

interface OrderData {
  order: {
    order_number: string
    created_at: string
    company_name: string
    contact_name: string
    email: string
    total: number
  }
  items: Array<{
    quantity: number
    unit_price: number
    total_price: number
    products?: {
      name: string
    }
  }>
  addons: Array<{
    price: number
    addons?: {
      name: string
    }
  }>
}

// Simple PDF generation using Puppeteer
async function generateReceiptPDF(orderData: OrderData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    // Simple HTML template for receipt
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company { font-size: 24px; font-weight: bold; }
            .receipt-title { font-size: 18px; margin: 20px 0; }
            .order-info { margin: 20px 0; }
            .items { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; font-size: 18px; }
            .footer { margin-top: 40px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">Boots & Honey</div>
            <div>123 Business Street, San Diego, CA 92003</div>
            <div>(555) 123-4567 | orders@bootsandhoney.com</div>
          </div>
          
          <div class="receipt-title">RECEIPT</div>
          
          <div class="order-info">
            <strong>Order #:</strong> ${orderData.order.order_number}<br>
            <strong>Date:</strong> ${new Date(orderData.order.created_at).toLocaleDateString()}<br>
            <strong>Customer:</strong> ${orderData.order.company_name}<br>
            <strong>Contact:</strong> ${orderData.order.contact_name}<br>
            <strong>Email:</strong> ${orderData.order.email}
          </div>
          
          <div class="items">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items.map((item) => `
                  <tr>
                    <td>${item.products?.name || 'Custom Item'}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.unit_price}</td>
                    <td>$${item.total_price}</td>
                  </tr>
                `).join('')}
                ${orderData.addons.map((addon) => `
                  <tr>
                    <td>${addon.addons?.name || 'Addon'}</td>
                    <td>1</td>
                    <td>$${addon.price}</td>
                    <td>$${addon.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="total">
            <table>
              <tr>
                <td style="text-align: right;"><strong>Total: $${orderData.order.total}</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="footer">
            Thank you for your business!<br>
            This receipt was generated automatically.
          </div>
        </body>
      </html>
    `
    
    await page.setContent(html)
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })
    
    return Buffer.from(pdf)
    
  } finally {
    await browser.close()
  }
}