/**
 * PDF Generation Service
 * 
 * Main service for generating PDF documents from order data
 */

import * as fs from 'fs'
import * as path from 'path'
import { ReceiptTemplate } from './templates/receipt-template'
import { PickSlipTemplate } from './templates/pick-slip-template'
import { 
  DocumentTemplateData, 
  PDFGenerationOptions, 
  DocumentGenerationResult,
  DocumentGenerationService,
  CompleteOrderData
} from '@/types/documents'

// Default company information (should be moved to config)
const DEFAULT_COMPANY_INFO = {
  name: 'Boots & Honey',
  address: '123 Business Street',
  city: 'San Diego',
  state: 'CA',
  zipCode: '92003',
  phone: '(555) 123-4567',
  email: 'orders@bootsandhoney.com',
  website: 'www.bootsandhoney.com'
}

export class PDFGenerationService implements DocumentGenerationService {
  private outputDir: string

  constructor(outputDir: string = '/tmp/documents') {
    this.outputDir = outputDir
    this.ensureOutputDirectory()
  }

  private ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  async generateReceipt(
    data: DocumentTemplateData, 
    options?: Partial<PDFGenerationOptions>
  ): Promise<DocumentGenerationResult> {
    const startTime = Date.now()

    try {
      // Create template and generate PDF
      const template = new ReceiptTemplate(options)
      const pdfBuffer = template.generate(data)

      // Generate filename
      const filename = options?.filename || `receipt_${data.order.order_number}_${Date.now()}.pdf`
      const filePath = path.join(this.outputDir, filename)

      // Write PDF to file
      fs.writeFileSync(filePath, pdfBuffer)

      // Get file stats
      const stats = fs.statSync(filePath)
      const generationTime = Date.now() - startTime

      return {
        success: true,
        filePath,
        metadata: {
          fileSize: stats.size,
          generationTime,
          pageCount: 1 // Receipts are typically single page
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async generatePickSlip(
    data: DocumentTemplateData, 
    options?: Partial<PDFGenerationOptions>
  ): Promise<DocumentGenerationResult> {
    const startTime = Date.now()

    try {
      // Create template and generate PDF
      const template = new PickSlipTemplate(options)
      const pdfBuffer = template.generate(data)

      // Generate filename
      const filename = options?.filename || `pickslip_${data.order.order_number}_${Date.now()}.pdf`
      const filePath = path.join(this.outputDir, filename)

      // Write PDF to file
      fs.writeFileSync(filePath, pdfBuffer)

      // Get file stats
      const stats = fs.statSync(filePath)
      const generationTime = Date.now() - startTime

      return {
        success: true,
        filePath,
        metadata: {
          fileSize: stats.size,
          generationTime,
          pageCount: 1 // Pick slips are typically single page
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async uploadDocument(filePath: string, fileName: string): Promise<{ fileUrl: string; filePath: string }> {
    const { storageService } = await import('@/lib/storage/supabase-storage')
    
    const result = await storageService.uploadFile(filePath, fileName, 'documents')
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed')
    }
    
    return {
      fileUrl: result.fileUrl!,
      filePath: result.filePath!
    }
  }

  /**
   * Prepare template data from order data
   */
  static prepareTemplateData(
    orderData: CompleteOrderData, 
    documentType: 'receipt' | 'pick_slip'
  ): DocumentTemplateData {
    return {
      ...orderData,
      generatedAt: new Date(),
      documentType,
      companyInfo: DEFAULT_COMPANY_INFO
    }
  }

  /**
   * Generate both receipt and pick slip for an order
   */
  async generateBothDocuments(
    orderData: CompleteOrderData,
    options?: Partial<PDFGenerationOptions>
  ): Promise<{
    receipt: DocumentGenerationResult;
    pickSlip: DocumentGenerationResult;
  }> {
    const receiptData = PDFGenerationService.prepareTemplateData(orderData, 'receipt')
    const pickSlipData = PDFGenerationService.prepareTemplateData(orderData, 'pick_slip')

    const [receipt, pickSlip] = await Promise.all([
      this.generateReceipt(receiptData, options),
      this.generatePickSlip(pickSlipData, options)
    ])

    return { receipt, pickSlip }
  }

  /**
   * Clean up old generated files (for maintenance)
   */
  cleanupOldFiles(maxAgeHours: number = 24): number {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000)
    let cleanedCount = 0

    try {
      const files = fs.readdirSync(this.outputDir)
      
      for (const file of files) {
        const filePath = path.join(this.outputDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath)
          cleanedCount++
        }
      }
    } catch (error) {
      console.warn('Error cleaning up old files:', error)
    }

    return cleanedCount
  }

  /**
   * Get service statistics
   */
  getServiceStats(): {
    outputDir: string;
    totalFiles: number;
    totalSize: number;
    oldestFile?: { name: string; age: number };
    newestFile?: { name: string; age: number };
  } {
    const stats = {
      outputDir: this.outputDir,
      totalFiles: 0,
      totalSize: 0,
      oldestFile: undefined as { name: string; age: number } | undefined,
      newestFile: undefined as { name: string; age: number } | undefined
    }

    try {
      const files = fs.readdirSync(this.outputDir)
      stats.totalFiles = files.length

      let oldestTime = Date.now()
      let newestTime = 0

      for (const file of files) {
        const filePath = path.join(this.outputDir, file)
        const fileStats = fs.statSync(filePath)
        
        stats.totalSize += fileStats.size

        if (fileStats.mtimeMs < oldestTime) {
          oldestTime = fileStats.mtimeMs
          stats.oldestFile = {
            name: file,
            age: Math.floor((Date.now() - fileStats.mtimeMs) / 1000 / 60) // minutes
          }
        }

        if (fileStats.mtimeMs > newestTime) {
          newestTime = fileStats.mtimeMs
          stats.newestFile = {
            name: file,
            age: Math.floor((Date.now() - fileStats.mtimeMs) / 1000 / 60) // minutes
          }
        }
      }
    } catch (error) {
      console.warn('Error getting service stats:', error)
    }

    return stats
  }
}

// Export singleton for easy use
export const pdfGenerator = new PDFGenerationService()