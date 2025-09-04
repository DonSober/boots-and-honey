/**
 * Document Generation API Endpoint
 * 
 * POST /api/documents/generate
 * Generates PDF documents (receipts, pick slips) for orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/documents/document-service'
import { config } from '@/lib/config/environment'

interface GenerateRequest {
  orderId: string
  documentType: 'receipt' | 'pick_slip' | 'both'
  webhookEventId?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if document generation is enabled
    if (!config.canGenerateDocuments()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Document generation is currently disabled' 
        },
        { status: 503 }
      )
    }

    // Parse request body
    const body: GenerateRequest = await request.json()

    // Validate required fields
    if (!body.orderId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'orderId is required' 
        },
        { status: 400 }
      )
    }

    if (!body.documentType) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'documentType is required' 
        },
        { status: 400 }
      )
    }

    // Validate document type
    const validTypes = ['receipt', 'pick_slip', 'both']
    if (!validTypes.includes(body.documentType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'documentType must be one of: receipt, pick_slip, both' 
        },
        { status: 400 }
      )
    }

    // Generate documents
    const result = await documentService.generateDocuments({
      orderId: body.orderId,
      documentType: body.documentType,
      webhookEventId: body.webhookEventId
    })

    // Return success response
    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during document generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    const health = await documentService.getHealthStatus()
    
    return NextResponse.json({
      service: 'document-generation',
      ...health
    }, { 
      status: health.healthy ? 200 : 503 
    })

  } catch (error) {
    return NextResponse.json({
      service: 'document-generation',
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}