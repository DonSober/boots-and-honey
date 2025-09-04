/**
 * Document Retry API Endpoint
 * 
 * POST /api/documents/retry/[documentId]
 * Retries failed document generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/documents/document-service'
import { config } from '@/lib/config/environment'

interface RouteParams {
  params: {
    documentId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { documentId } = params

    if (!documentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'documentId is required' 
        },
        { status: 400 }
      )
    }

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

    // Retry document generation
    const result = await documentService.retryDocument(documentId)

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during document retry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}