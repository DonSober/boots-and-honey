/**
 * Order Documents API Endpoint
 * 
 * GET /api/documents/[orderId]
 * Retrieves all documents for a specific order
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/documents/document-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    if (!orderId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'orderId is required' 
        },
        { status: 400 }
      )
    }

    // Get documents for the order
    const documents = await documentService.getOrderDocuments(orderId)

    return NextResponse.json({
      success: true,
      orderId,
      documents,
      count: documents.length
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch order documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}