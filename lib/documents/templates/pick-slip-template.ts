/**
 * Pick Slip Template Generator
 * 
 * Generates pick slips for warehouse/fulfillment operations
 */

import jsPDF from 'jspdf'
import { DocumentTemplateData, PDFGenerationOptions } from '@/types/documents'

// Default company information
const DEFAULT_COMPANY_INFO = {
  name: 'Boots & Honey',
  address: '123 Business Street',
  city: 'San Diego',
  state: 'CA',
  zipCode: '92003',
  phone: '(555) 123-4567',
  email: 'orders@bootsandhoney.com'
}

export class PickSlipTemplate {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number

  constructor(options: Partial<PDFGenerationOptions> = {}) {
    const format = options.format || 'a4'
    const orientation = options.orientation || 'portrait'
    
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format
    })

    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = options.margins?.left || 20
    this.currentY = this.margin
  }

  generate(data: DocumentTemplateData): Buffer {
    // Header
    this.addHeader(data)
    
    // Order Summary
    this.addOrderSummary(data)
    
    // Customer & Delivery Info
    this.addCustomerDeliveryInfo(data)
    
    // Pick List
    this.addPickList(data)
    
    // Special Instructions
    this.addSpecialInstructions(data)
    
    // Fulfillment Checklist
    this.addFulfillmentChecklist()
    
    // Footer
    this.addFooter(data)

    return Buffer.from(this.doc.output('arraybuffer'))
  }

  private addHeader(data: DocumentTemplateData) {
    const company = data.companyInfo || DEFAULT_COMPANY_INFO

    // Company Name (Smaller for pick slip)
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(company.name, this.margin, this.currentY)
    this.currentY += 8

    // PICK SLIP Title (Large, Center)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    const pickSlipText = 'PICK SLIP'
    const pickSlipWidth = this.doc.getTextWidth(pickSlipText)
    this.doc.text(pickSlipText, (this.pageWidth - pickSlipWidth) / 2, this.currentY)

    // Date and Time (Right aligned)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    const dateTimeText = `Printed: ${data.generatedAt.toLocaleDateString()} ${data.generatedAt.toLocaleTimeString()}`
    const dateTimeWidth = this.doc.getTextWidth(dateTimeText)
    this.doc.text(dateTimeText, this.pageWidth - this.margin - dateTimeWidth, this.currentY - 10)

    this.currentY += 15

    // Horizontal line
    this.doc.setLineWidth(1)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 10
  }

  private addOrderSummary(data: DocumentTemplateData) {
    // Order summary in boxes
    const boxHeight = 25
    const boxWidth = (this.pageWidth - 3 * this.margin) / 2

    // Left box - Order Info
    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, this.currentY, boxWidth, boxHeight)

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('ORDER INFORMATION', this.margin + 3, this.currentY + 6)

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Order #: ${data.order.order_number}`, this.margin + 3, this.currentY + 12)
    this.doc.text(`PO #: ${data.order.po_number || 'N/A'}`, this.margin + 3, this.currentY + 17)
    this.doc.text(`Status: ${data.order.status.toUpperCase()}`, this.margin + 3, this.currentY + 22)

    // Right box - Fulfillment Info
    const rightBoxX = this.margin + boxWidth + this.margin
    this.doc.rect(rightBoxX, this.currentY, boxWidth, boxHeight)

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('FULFILLMENT', rightBoxX + 3, this.currentY + 6)

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    const orderDate = new Date(data.order.created_at).toLocaleDateString()
    this.doc.text(`Order Date: ${orderDate}`, rightBoxX + 3, this.currentY + 12)
    
    if (data.order.requested_fulfillment_date) {
      const reqDate = new Date(data.order.requested_fulfillment_date).toLocaleDateString()
      this.doc.text(`Requested: ${reqDate}`, rightBoxX + 3, this.currentY + 17)
    } else {
      this.doc.text('Requested: Standard', rightBoxX + 3, this.currentY + 17)
    }

    // Priority indicator
    const isRush = data.order.special_instructions?.toLowerCase().includes('rush') || 
                   data.order.special_instructions?.toLowerCase().includes('urgent')
    if (isRush) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(255, 0, 0)
      this.doc.text('⚠ RUSH ORDER', rightBoxX + 3, this.currentY + 22)
      this.doc.setTextColor(0, 0, 0)
    }

    this.currentY += boxHeight + 10
  }

  private addCustomerDeliveryInfo(data: DocumentTemplateData) {
    // Customer info box
    const boxHeight = 35
    const boxWidth = this.pageWidth - 2 * this.margin

    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, this.currentY, boxWidth, boxHeight)

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('CUSTOMER & DELIVERY INFORMATION', this.margin + 3, this.currentY + 6)

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    // Left column - Customer
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Customer:', this.margin + 3, this.currentY + 12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(data.order.company_name, this.margin + 25, this.currentY + 12)
    this.doc.text(`Contact: ${data.order.contact_name}`, this.margin + 3, this.currentY + 17)
    this.doc.text(`Phone: ${data.order.phone}`, this.margin + 3, this.currentY + 22)

    // Right column - Address
    const rightColX = this.pageWidth / 2 + 10
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Delivery Address:', rightColX, this.currentY + 12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(data.order.business_address, rightColX, this.currentY + 17)
    this.doc.text(`${data.order.city}, ${data.order.state} ${data.order.zip_code}`, rightColX, this.currentY + 22)

    // Check if delivery addon is selected
    const hasDelivery = data.addons.some(addon => 
      addon.addon?.name.toLowerCase().includes('delivery')
    )
    
    if (hasDelivery) {
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setFillColor(255, 255, 0) // Yellow highlight
      this.doc.rect(rightColX, this.currentY + 25, 40, 6, 'F')
      this.doc.text('🚛 DELIVERY REQUIRED', rightColX + 2, this.currentY + 29)
    }

    this.currentY += boxHeight + 10
  }

  private addPickList(data: DocumentTemplateData) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('PICK LIST', this.margin, this.currentY)
    this.currentY += 8

    // Table header
    const tableStartY = this.currentY
    const rowHeight = 8
    const colWidths = [15, 70, 20, 30] // Qty, Description, Type, Notes

    // Header background
    this.doc.setFillColor(220, 220, 220)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 'F')

    // Header text
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    let currentX = this.margin + 2

    this.doc.text('QTY', currentX, this.currentY + 5)
    currentX += colWidths[0]
    this.doc.text('DESCRIPTION', currentX, this.currentY + 5)
    currentX += colWidths[1]
    this.doc.text('TYPE', currentX, this.currentY + 5)
    currentX += colWidths[2]
    this.doc.text('PICKED ✓', currentX, this.currentY + 5)

    this.currentY += rowHeight

    // Items with checkboxes
    this.doc.setFont('helvetica', 'normal')
    data.items.forEach((item, index) => {
      // Alternate row colors for readability
      if (index % 2 === 1) {
        this.doc.setFillColor(248, 248, 248)
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 'F')
      }

      currentX = this.margin + 2

      // Quantity (Large and bold)
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(item.quantity.toString(), currentX, this.currentY + 5)
      
      currentX += colWidths[0]
      
      // Description
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      const description = item.product?.name || item.custom_description || 'Custom Item'
      this.doc.text(description, currentX, this.currentY + 5)
      
      currentX += colWidths[1]
      
      // Type
      if (item.product?.type) {
        this.doc.text(item.product.type.toUpperCase(), currentX, this.currentY + 5)
      }
      
      currentX += colWidths[2]
      
      // Checkbox for picking
      this.doc.setLineWidth(0.5)
      this.doc.rect(currentX + 5, this.currentY + 1, 4, 4)

      this.currentY += rowHeight
    })

    // Add-ons section
    if (data.addons.length > 0) {
      this.currentY += 5
      
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('ADD-ONS & SERVICES', this.margin, this.currentY)
      this.currentY += 6

      data.addons.forEach((addon, index) => {
        if (index % 2 === 1) {
          this.doc.setFillColor(248, 248, 248)
          this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 'F')
        }

        currentX = this.margin + 2

        // Quantity (always 1 for addons)
        this.doc.setFontSize(12)
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('1', currentX, this.currentY + 5)
        
        currentX += colWidths[0]
        
        // Description
        this.doc.setFontSize(10)
        this.doc.setFont('helvetica', 'normal')
        const description = addon.addon?.name || 'Custom Add-on'
        this.doc.text(description, currentX, this.currentY + 5)
        
        currentX += colWidths[1]
        
        // Type
        this.doc.text('SERVICE', currentX, this.currentY + 5)
        
        currentX += colWidths[2]
        
        // Checkbox
        this.doc.setLineWidth(0.5)
        this.doc.rect(currentX + 5, this.currentY + 1, 4, 4)

        this.currentY += rowHeight
      })
    }

    // Table border
    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, tableStartY, this.pageWidth - 2 * this.margin, this.currentY - tableStartY)

    this.currentY += 10
  }

  private addSpecialInstructions(data: DocumentTemplateData) {
    if (data.order.special_instructions) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('SPECIAL INSTRUCTIONS', this.margin, this.currentY)
      this.currentY += 6

      // Instructions box
      const boxHeight = 20
      this.doc.setFillColor(255, 255, 200) // Light yellow
      this.doc.setDrawColor(200, 200, 0)
      this.doc.setLineWidth(0.5)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 'FD')

      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      const instructions = this.doc.splitTextToSize(data.order.special_instructions, this.pageWidth - 2 * this.margin - 6)
      this.doc.text(instructions, this.margin + 3, this.currentY + 6)
      
      this.currentY += boxHeight + 10
    }
  }

  private addFulfillmentChecklist() {
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('FULFILLMENT CHECKLIST', this.margin, this.currentY)
    this.currentY += 8

    const checklist = [
      'All items picked and verified',
      'Quantities confirmed correct',
      'Quality check completed',
      'Special instructions followed',
      'Packaging prepared',
      'Delivery scheduled (if applicable)'
    ]

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    checklist.forEach((item) => {
      // Checkbox
      this.doc.setLineWidth(0.5)
      this.doc.rect(this.margin, this.currentY, 4, 4)
      
      // Text
      this.doc.text(item, this.margin + 8, this.currentY + 3)
      this.currentY += 6
    })

    this.currentY += 5
  }

  private addFooter(data: DocumentTemplateData) {
    // Signature section
    const footerStartY = this.pageHeight - 40
    this.currentY = footerStartY

    this.doc.setLineWidth(0.5)
    
    // Picked by signature line
    this.doc.text('Picked by:', this.margin, this.currentY)
    this.doc.line(this.margin + 25, this.currentY, this.margin + 80, this.currentY)
    this.doc.text('Date:', this.margin + 85, this.currentY)
    this.doc.line(this.margin + 95, this.currentY, this.margin + 130, this.currentY)

    this.currentY += 10

    // Quality check signature line
    this.doc.text('Quality Check:', this.margin, this.currentY)
    this.doc.line(this.margin + 30, this.currentY, this.margin + 85, this.currentY)
    this.doc.text('Date:', this.margin + 90, this.currentY)
    this.doc.line(this.margin + 100, this.currentY, this.margin + 135, this.currentY)

    this.currentY += 15

    // Order number footer
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Order: ${data.order.order_number}`, this.margin, this.currentY)
    
    const pageText = `Page 1 of 1`
    const pageWidth = this.doc.getTextWidth(pageText)
    this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, this.currentY)
  }
}