/**
 * Document Generation Service
 * 
 * Main orchestrator for document generation, storage, and database tracking
 */

import { createClient } from '@supabase/supabase-js'
import { PDFGenerationService } from './pdf-generator'
import { storageService } from '@/lib/storage/supabase-storage'
import { CompleteOrderData } from '@/types/documents'
import { OrderDocumentInsert } from '@/types/database'
import { config } from '@/lib/config/environment'

export interface DocumentGenerationRequest {
  orderId: string
  documentType: 'receipt' | 'pick_slip' | 'both'
  webhookEventId?: string
}

export interface DocumentGenerationResponse {
  success: boolean
  documents: {
    receipt?: {
      id: string
      fileUrl: string
      status: 'generated' | 'failed'
      error?: string
    }
    pickSlip?: {
      id: string
      fileUrl: string
      status: 'generated' | 'failed'
      error?: string
    }
  }
  error?: string
}

export class DocumentService {
  private supabase: ReturnType<typeof createClient> | null = null
  private pdfGenerator: PDFGenerationService

  constructor() {
    this.pdfGenerator = new PDFGenerationService()
  }

  private getSupabase() {
    if (!this.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase credentials for document service')
      }

      this.supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }

    return this.supabase
  }

  /**
   * Generate documents for an order
   */
  async generateDocuments(request: DocumentGenerationRequest): Promise<DocumentGenerationResponse> {
    try {
      // Fetch complete order data
      const orderData = await this.fetchOrderData(request.orderId)
      if (!orderData) {
        return {
          success: false,
          documents: {},
          error: 'Order not found'
        }
      }

      const response: DocumentGenerationResponse = {
        success: true,
        documents: {}
      }

      // Generate receipt if requested
      if (request.documentType === 'receipt' || request.documentType === 'both') {
        const receiptResult = await this.generateSingleDocument(
          orderData,
          'receipt',
          request.webhookEventId
        )
        response.documents.receipt = receiptResult
      }

      // Generate pick slip if requested
      if (request.documentType === 'pick_slip' || request.documentType === 'both') {
        const pickSlipResult = await this.generateSingleDocument(
          orderData,
          'pick_slip',
          request.webhookEventId
        )
        response.documents.pickSlip = pickSlipResult
      }

      // Check if any generation failed
      const hasFailures = Object.values(response.documents).some(doc => doc?.status === 'failed')
      if (hasFailures) {
        response.success = false
        response.error = 'One or more documents failed to generate'
      }

      return response

    } catch (error) {
      return {
        success: false,
        documents: {},
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Generate a single document (receipt or pick slip)
   */
  private async generateSingleDocument(
    orderData: CompleteOrderData,
    documentType: 'receipt' | 'pick_slip',
    webhookEventId?: string
  ): Promise<{
    id: string
    fileUrl: string
    status: 'generated' | 'failed'
    error?: string
  }> {
    // Create database record first
    const documentRecord = await this.createDocumentRecord(
      orderData.order.id,
      documentType,
      webhookEventId
    )

    try {
      // Generate PDF
      const templateData = PDFGenerationService.prepareTemplateData(orderData, documentType)
      const pdfResult = documentType === 'receipt' 
        ? await this.pdfGenerator.generateReceipt(templateData)
        : await this.pdfGenerator.generatePickSlip(templateData)

      if (!pdfResult.success) {
        await this.updateDocumentRecord(documentRecord.id, 'failed', pdfResult.error)
        return {
          id: documentRecord.id,
          fileUrl: '',
          status: 'failed',
          error: pdfResult.error
        }
      }

      // Upload to storage
      const fileName = `${documentType}_${orderData.order.order_number}_${Date.now()}.pdf`
      const uploadResult = await storageService.uploadFile(
        pdfResult.filePath!,
        fileName,
        'documents'
      )

      if (!uploadResult.success) {
        await this.updateDocumentRecord(documentRecord.id, 'failed', uploadResult.error)
        return {
          id: documentRecord.id,
          fileUrl: '',
          status: 'failed',
          error: uploadResult.error
        }
      }

      // Update database record with file info
      await this.updateDocumentRecord(
        documentRecord.id,
        'generated',
        undefined,
        uploadResult.fileUrl,
        uploadResult.filePath,
        pdfResult.metadata
      )

      // Clean up local file
      try {
        const fs = await import('fs')
        fs.unlinkSync(pdfResult.filePath!)
      } catch {
        // Ignore cleanup errors
      }

      return {
        id: documentRecord.id,
        fileUrl: uploadResult.fileUrl!,
        status: 'generated'
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.updateDocumentRecord(documentRecord.id, 'failed', errorMessage)
      
      return {
        id: documentRecord.id,
        fileUrl: '',
        status: 'failed',
        error: errorMessage
      }
    }
  }

  /**
   * Fetch complete order data with items and addons
   */
  private async fetchOrderData(orderId: string): Promise<CompleteOrderData | null> {
    try {
      // Fetch order
      const { data: order, error: orderError } = await this.getSupabase()
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        return null
      }

      // Fetch order items with product info
      const { data: items, error: itemsError } = await this.getSupabase()
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

      // Fetch order addons with addon info
      const { data: addons, error: addonsError } = await this.getSupabase()
        .from('order_addons')
        .select(`
          *,
          addons (
            name,
            description,
            requirements
          )
        `)
        .eq('order_id', orderId)

      if (addonsError) {
        throw new Error(`Failed to fetch order addons: ${addonsError.message}`)
      }

      return {
        order,
        items: items.map(item => ({
          ...item,
          product: item.products ? {
            name: item.products.name,
            type: item.products.type,
            description: item.products.description
          } : undefined
        })),
        addons: addons.map(addon => ({
          ...addon,
          addon: addon.addons ? {
            name: addon.addons.name,
            description: addon.addons.description,
            requirements: addon.addons.requirements
          } : undefined
        }))
      }

    } catch (error) {
      return null
    }
  }

  /**
   * Create a document record in the database
   */
  private async createDocumentRecord(
    orderId: string,
    documentType: 'receipt' | 'pick_slip',
    webhookEventId?: string
  ) {
    const documentData: OrderDocumentInsert = {
      order_id: orderId,
      document_type: documentType,
      webhook_event_id: webhookEventId,
      status: 'pending',
      metadata: {
        generated_by: 'document-service',
        generation_started_at: new Date().toISOString()
      }
    }

    const { data, error } = await this.getSupabase()
      .from('order_documents')
      .insert(documentData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create document record: ${error.message}`)
    }

    return data
  }

  /**
   * Update document record in the database
   */
  private async updateDocumentRecord(
    documentId: string,
    status: 'pending' | 'generated' | 'failed',
    errorMessage?: string,
    fileUrl?: string,
    filePath?: string,
    metadata?: Record<string, unknown>
  ) {
    const updateData = {
      status,
      error_message: errorMessage,
      file_url: fileUrl,
      file_path: filePath,
      generated_at: status === 'generated' ? new Date().toISOString() : undefined,
      metadata: {
        ...metadata,
        generation_completed_at: new Date().toISOString()
      }
    }

    const { error } = await this.getSupabase()
      .from('order_documents')
      .update(updateData)
      .eq('id', documentId)

    if (error) {
      // Document record update failed - logged but not thrown to avoid cascading failures
    }
  }

  /**
   * Get documents for an order
   */
  async getOrderDocuments(orderId: string) {
    const { data, error } = await this.getSupabase()
      .from('order_documents')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    return data
  }

  /**
   * Retry failed document generation
   */
  async retryDocument(documentId: string): Promise<DocumentGenerationResponse> {
    const { data: document, error } = await this.getSupabase()
      .from('order_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error || !document) {
      return {
        success: false,
        documents: {},
        error: 'Document record not found'
      }
    }

    // Increment retry count
    await this.getSupabase()
      .from('order_documents')
      .update({ 
        retry_count: document.retry_count + 1,
        status: 'pending'
      })
      .eq('id', documentId)

    // Retry generation
    return this.generateDocuments({
      orderId: document.order_id,
      documentType: document.document_type as 'receipt' | 'pick_slip',
      webhookEventId: document.webhook_event_id
    })
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    try {
      // Check database connectivity
      const { error: dbError } = await this.getSupabase()
        .from('orders')
        .select('id')
        .limit(1)

      // Check storage connectivity
      const storageStats = await storageService.getStorageStats()

      // Check configuration
      const canGenerate = config.canGenerateDocuments()

      return {
        healthy: !dbError && canGenerate,
        database: !dbError,
        storage: storageStats.totalFiles >= 0,
        configuration: canGenerate,
        storageStats,
        lastCheck: new Date().toISOString()
      }

    } catch (error) {
      return {
        healthy: false,
        database: false,
        storage: false,
        configuration: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString()
      }
    }
  }
}

// Export singleton for easy use
export const documentService = new DocumentService()