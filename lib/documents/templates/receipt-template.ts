/**
 * Receipt Template Generator
 * 
 * Generates professional receipt PDFs for customer orders
 */

import jsPDF from 'jspdf'
import { DocumentTemplateData, PDFGenerationOptions } from '@/types/documents'

// Default company information (can be moved to environment config later)
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

export class ReceiptTemplate {
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
    
    // Customer Information
    this.addCustomerInfo(data)
    
    // Order Information
    this.addOrderInfo(data)
    
    // Items Table
    this.addItemsTable(data)
    
    // Totals
    this.addTotals(data)
    
    // Footer
    this.addFooter(data)

    return Buffer.from(this.doc.output('arraybuffer'))
  }

  private addHeader(data: DocumentTemplateData) {
    const company = data.companyInfo || DEFAULT_COMPANY_INFO

    // Company Name (Large, Bold)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(company.name, this.margin, this.currentY)
    this.currentY += 10

    // Company Info (Regular)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`${company.address}`, this.margin, this.currentY)
    this.currentY += 4
    this.doc.text(`${company.city}, ${company.state} ${company.zipCode}`, this.margin, this.currentY)
    this.currentY += 4
    this.doc.text(`Phone: ${company.phone} | Email: ${company.email}`, this.margin, this.currentY)
    if (company.website) {
      this.currentY += 4
      this.doc.text(`Website: ${company.website}`, this.margin, this.currentY)
    }
    this.currentY += 15

    // RECEIPT Title (Right aligned)
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    const receiptText = 'RECEIPT'
    const receiptWidth = this.doc.getTextWidth(receiptText)
    this.doc.text(receiptText, this.pageWidth - this.margin - receiptWidth, this.currentY - 25)

    // Date (Right aligned)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    const dateText = `Date: ${data.generatedAt.toLocaleDateString()}`
    const dateWidth = this.doc.getTextWidth(dateText)
    this.doc.text(dateText, this.pageWidth - this.margin - dateWidth, this.currentY - 18)

    // Horizontal line
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 10
  }

  private addCustomerInfo(data: DocumentTemplateData) {
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('BILL TO:', this.margin, this.currentY)
    this.currentY += 6

    this.doc.setFont('helvetica', 'normal')
    this.doc.text(data.order.company_name, this.margin, this.currentY)
    this.currentY += 4
    this.doc.text(`Attn: ${data.order.contact_name}`, this.margin, this.currentY)
    this.currentY += 4
    this.doc.text(data.order.business_address, this.margin, this.currentY)
    this.currentY += 4
    this.doc.text(`${data.order.city}, ${data.order.state} ${data.order.zip_code}`, this.margin, this.currentY)
    this.currentY += 4
    this.doc.text(`Phone: ${data.order.phone}`, this.margin, this.currentY)
    this.currentY += 4
    this.doc.text(`Email: ${data.order.email}`, this.margin, this.currentY)
    this.currentY += 15
  }

  private addOrderInfo(data: DocumentTemplateData) {
    // Order information in a box
    const boxY = this.currentY
    const boxHeight = 20

    // Draw box
    this.doc.setDrawColor(200, 200, 200)
    this.doc.setFillColor(248, 248, 248)
    this.doc.rect(this.margin, boxY, this.pageWidth - 2 * this.margin, boxHeight, 'FD')

    // Order details
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Order Number:', this.margin + 5, boxY + 8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(data.order.order_number, this.margin + 35, boxY + 8)

    if (data.order.po_number) {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('PO Number:', this.margin + 5, boxY + 15)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(data.order.po_number, this.margin + 35, boxY + 15)
    }

    // Right side - dates
    const rightX = this.pageWidth - this.margin - 60
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Order Date:', rightX, boxY + 8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(new Date(data.order.created_at).toLocaleDateString(), rightX + 25, boxY + 8)

    if (data.order.requested_fulfillment_date) {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Requested:', rightX, boxY + 15)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(new Date(data.order.requested_fulfillment_date).toLocaleDateString(), rightX + 25, boxY + 15)
    }

    this.currentY = boxY + boxHeight + 10
  }

  private addItemsTable(data: DocumentTemplateData) {
    // Table headers
    const tableStartY = this.currentY
    const rowHeight = 6
    const colWidths = [60, 20, 25, 30] // Description, Qty, Unit Price, Total

    // Header background
    this.doc.setFillColor(230, 230, 230)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 'F')

    // Header text
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'bold')
    let currentX = this.margin + 2

    this.doc.text('Description', currentX, this.currentY + 4)
    currentX += colWidths[0]
    this.doc.text('Qty', currentX, this.currentY + 4)
    currentX += colWidths[1]
    this.doc.text('Unit Price', currentX, this.currentY + 4)
    currentX += colWidths[2]
    this.doc.text('Total', currentX, this.currentY + 4)

    this.currentY += rowHeight

    // Items
    this.doc.setFont('helvetica', 'normal')
    data.items.forEach((item) => {
      currentX = this.margin + 2

      // Item description
      const description = item.product?.name || item.custom_description || 'Custom Item'
      this.doc.text(description, currentX, this.currentY + 4)
      
      // Add product type if available
      if (item.product?.type) {
        this.doc.setFontSize(8)
        this.doc.setTextColor(100, 100, 100)
        this.doc.text(`(${item.product.type.charAt(0).toUpperCase() + item.product.type.slice(1)})`, currentX, this.currentY + 8)
        this.doc.setFontSize(9)
        this.doc.setTextColor(0, 0, 0)
      }

      currentX += colWidths[0]
      this.doc.text(item.quantity.toString(), currentX, this.currentY + 4)
      
      currentX += colWidths[1]
      this.doc.text(`$${item.unit_price.toFixed(2)}`, currentX, this.currentY + 4)
      
      currentX += colWidths[2]
      this.doc.text(`$${item.total_price.toFixed(2)}`, currentX, this.currentY + 4)

      this.currentY += item.product?.type ? rowHeight + 3 : rowHeight
    })

    // Add-ons
    data.addons.forEach((addon) => {
      currentX = this.margin + 2

      const description = addon.addon?.name || 'Custom Add-on'
      this.doc.text(description, currentX, this.currentY + 4)
      
      if (addon.addon?.description) {
        this.doc.setFontSize(8)
        this.doc.setTextColor(100, 100, 100)
        this.doc.text(`(${addon.addon.description})`, currentX, this.currentY + 8)
        this.doc.setFontSize(9)
        this.doc.setTextColor(0, 0, 0)
      }

      currentX += colWidths[0]
      this.doc.text('1', currentX, this.currentY + 4)
      
      currentX += colWidths[1]
      this.doc.text(`$${addon.price.toFixed(2)}`, currentX, this.currentY + 4)
      
      currentX += colWidths[2]
      this.doc.text(`$${addon.price.toFixed(2)}`, currentX, this.currentY + 4)

      this.currentY += addon.addon?.description ? rowHeight + 3 : rowHeight
    })

    // Table border
    this.doc.setDrawColor(200, 200, 200)
    this.doc.rect(this.margin, tableStartY, this.pageWidth - 2 * this.margin, this.currentY - tableStartY)

    this.currentY += 10
  }

  private addTotals(data: DocumentTemplateData) {
    const totalsX = this.pageWidth - this.margin - 60
    
    // Subtotal
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Subtotal:', totalsX, this.currentY)
    this.doc.text(`$${data.order.subtotal.toFixed(2)}`, totalsX + 30, this.currentY)
    this.currentY += 5

    // Add-ons total
    if (data.order.addon_total > 0) {
      this.doc.text('Add-ons:', totalsX, this.currentY)
      this.doc.text(`$${data.order.addon_total.toFixed(2)}`, totalsX + 30, this.currentY)
      this.currentY += 5
    }

    // Total line
    this.doc.setLineWidth(0.5)
    this.doc.line(totalsX, this.currentY, totalsX + 50, this.currentY)
    this.currentY += 5

    // Total
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('TOTAL:', totalsX, this.currentY)
    this.doc.text(`$${data.order.total.toFixed(2)}`, totalsX + 30, this.currentY)
    this.currentY += 15
  }

  private addFooter(data: DocumentTemplateData) {
    // Special instructions
    if (data.order.special_instructions) {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Special Instructions:', this.margin, this.currentY)
      this.currentY += 5

      this.doc.setFont('helvetica', 'normal')
      const instructions = this.doc.splitTextToSize(data.order.special_instructions, this.pageWidth - 2 * this.margin)
      this.doc.text(instructions, this.margin, this.currentY)
      this.currentY += instructions.length * 4 + 10
    }

    // Thank you message
    const footerY = this.pageHeight - 30
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    const thankYou = 'Thank you for your business!'
    const thankYouWidth = this.doc.getTextWidth(thankYou)
    this.doc.text(thankYou, (this.pageWidth - thankYouWidth) / 2, footerY)

    // Footer line
    this.doc.setLineWidth(0.3)
    this.doc.line(this.margin, footerY + 5, this.pageWidth - this.margin, footerY + 5)
  }
}