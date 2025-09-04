/**
 * Document Generation Types
 * 
 * Type definitions for PDF document generation system
 */

// Order data for document generation
export interface OrderForDocument {
  id: string
  order_number: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  business_address: string
  city: string
  state: string
  zip_code: string
  po_number: string | null
  requested_fulfillment_date: string | null
  special_instructions: string | null
  subtotal: number
  addon_total: number
  total: number
  status: string
  created_at: string
  updated_at: string
}

// Order item data for document generation
export interface OrderItemForDocument {
  id: string
  product_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  custom_description: string | null
  product?: {
    name: string
    type: string
    description: string | null
  }
}

// Order addon data for document generation
export interface OrderAddonForDocument {
  id: string
  addon_id: string
  price: number
  addon?: {
    name: string
    description: string | null
    requirements: string | null
  }
}

// Complete order data for document generation
export interface CompleteOrderData {
  order: OrderForDocument
  items: OrderItemForDocument[]
  addons: OrderAddonForDocument[]
}

// Document template data
export interface DocumentTemplateData extends CompleteOrderData {
  generatedAt: Date
  documentType: 'receipt' | 'pick_slip'
  companyInfo: CompanyInfo
}

// Company branding information
export interface CompanyInfo {
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  website?: string
  logo?: string
}

// PDF generation options
export interface PDFGenerationOptions {
  filename: string
  format: 'a4' | 'letter' | 'legal'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// Document generation result
export interface DocumentGenerationResult {
  success: boolean
  filePath?: string
  fileUrl?: string
  error?: string
  metadata?: {
    fileSize: number
    generationTime: number
    pageCount: number
  }
}

// Document generation service interface
export interface DocumentGenerationService {
  generateReceipt(data: DocumentTemplateData, options?: Partial<PDFGenerationOptions>): Promise<DocumentGenerationResult>
  generatePickSlip(data: DocumentTemplateData, options?: Partial<PDFGenerationOptions>): Promise<DocumentGenerationResult>
  uploadDocument(filePath: string, fileName: string): Promise<{ fileUrl: string; filePath: string }>
}