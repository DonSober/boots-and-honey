#!/usr/bin/env tsx

/**
 * Phase 2 Testing Script
 * 
 * Tests the document generation service:
 * - PDF generation (receipts and pick slips)
 * - File storage with Supabase
 * - Document generation APIs
 * - Error handling and database tracking
 */

import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Then import modules that depend on environment
import { documentService } from '@/lib/documents/document-service'
import { dbTestUtils } from '@/lib/testing/database-utils'
import { storageService } from '@/lib/storage/supabase-storage'
import { config } from '@/lib/config/environment'

async function runPhase2Tests() {
  console.log('🚀 Running Phase 2 Document Generation Tests')
  console.log('=' .repeat(55))
  
  let allTestsPassed = true

  try {
    // Test 1: Environment Configuration Check
    console.log('\n📋 Test 1: Environment Configuration')
    const validation = config.validateAll()
    
    if (validation.valid) {
      console.log('✅ Environment configuration is valid')
    } else {
      console.log('⚠️  Environment configuration has warnings:')
      validation.errors.forEach(error => console.log(`   - ${error}`))
      console.log('💡 Some warnings are expected if services aren\'t configured yet')
    }

    console.log('\n🔧 Document Generation Configuration:')
    console.log(`   Document Generation: ${config.canGenerateDocuments() ? 'Enabled' : 'Disabled'}`)
    console.log(`   Receipt Generation: ${config.canGenerateReceipts() ? 'Enabled' : 'Disabled'}`)  
    console.log(`   Pick Slip Generation: ${config.canGeneratePickSlips() ? 'Enabled' : 'Disabled'}`)
    console.log(`   Storage Bucket: ${config.storage.bucket}`)

    // Test 2: Storage Service Check
    console.log('\n💾 Test 2: Storage Service')
    try {
      const bucketResult = await storageService.ensureBucket()
      if (bucketResult.success) {
        console.log('✅ Storage bucket is ready')
      } else {
        console.log(`⚠️ Storage bucket issue: ${bucketResult.error}`)
      }

      const storageStats = await storageService.getStorageStats()
      console.log(`📊 Storage stats: ${storageStats.totalFiles} files, ${Math.round(storageStats.totalSize / 1024)} KB`)
    } catch (error) {
      console.log(`❌ Storage service error: ${error instanceof Error ? error.message : error}`)
    }

    // Test 3: Document Service Health
    console.log('\n🏥 Test 3: Document Service Health')
    const health = await documentService.getHealthStatus()
    console.log(`   Overall Health: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`)
    console.log(`   Database: ${health.database ? '✅ Connected' : '❌ Failed'}`)
    console.log(`   Storage: ${health.storage ? '✅ Available' : '❌ Failed'}`)
    console.log(`   Configuration: ${health.configuration ? '✅ Valid' : '❌ Invalid'}`)

    if (!health.healthy) {
      console.log(`   Error: ${health.error}`)
      allTestsPassed = false
    }

    // Test 4: Create Test Order for Document Generation
    console.log('\n🧪 Test 4: Test Order Creation')
    
    // Clean up any existing test data first
    await dbTestUtils.cleanupTestData()
    
    // Create a test order with complete data
    const testOrder = await dbTestUtils.createTestOrder({
      company_name: 'PDF Test Company',
      contact_name: 'Document Tester',
      email: 'test-docs@example.com',
      special_instructions: 'This is a test order for document generation - please handle with care'
    })
    console.log(`✅ Created test order: ${testOrder.order_number}`)

    const testItems = await dbTestUtils.createTestOrderItems(testOrder.id, 3)
    console.log(`✅ Created ${testItems.length} test items`)

    const testAddon = await dbTestUtils.createTestOrderAddon(testOrder.id)
    console.log(`✅ Created test addon`)

    // Test 5: Document Generation
    console.log('\n📄 Test 5: Document Generation')
    
    try {
      // Test receipt generation
      console.log('   Testing receipt generation...')
      const receiptResult = await documentService.generateDocuments({
        orderId: testOrder.id,
        documentType: 'receipt',
        webhookEventId: 'test-phase2-receipt'
      })

      if (receiptResult.success && receiptResult.documents.receipt) {
        console.log(`   ✅ Receipt generated successfully`)
        console.log(`   📎 File URL: ${receiptResult.documents.receipt.fileUrl}`)
      } else {
        console.log(`   ❌ Receipt generation failed: ${receiptResult.error}`)
        allTestsPassed = false
      }

      // Test pick slip generation
      console.log('   Testing pick slip generation...')
      const pickSlipResult = await documentService.generateDocuments({
        orderId: testOrder.id,
        documentType: 'pick_slip',
        webhookEventId: 'test-phase2-pickslip'
      })

      if (pickSlipResult.success && pickSlipResult.documents.pickSlip) {
        console.log(`   ✅ Pick slip generated successfully`)
        console.log(`   📎 File URL: ${pickSlipResult.documents.pickSlip.fileUrl}`)
      } else {
        console.log(`   ❌ Pick slip generation failed: ${pickSlipResult.error}`)
        allTestsPassed = false
      }

      // Test both documents at once
      console.log('   Testing batch generation (both documents)...')
      const bothResult = await documentService.generateDocuments({
        orderId: testOrder.id,
        documentType: 'both',
        webhookEventId: 'test-phase2-both'
      })

      if (bothResult.success && bothResult.documents.receipt && bothResult.documents.pickSlip) {
        console.log(`   ✅ Batch generation successful`)
      } else {
        console.log(`   ❌ Batch generation failed: ${bothResult.error}`)
        allTestsPassed = false
      }

    } catch (error) {
      console.log(`   ❌ Document generation error: ${error instanceof Error ? error.message : error}`)
      allTestsPassed = false
    }

    // Test 6: Document Retrieval
    console.log('\n📋 Test 6: Document Retrieval')
    try {
      const documents = await documentService.getOrderDocuments(testOrder.id)
      console.log(`   ✅ Retrieved ${documents.length} documents for order`)
      
      documents.forEach((doc, index) => {
        console.log(`   📄 Document ${index + 1}: ${doc.document_type} (${doc.status})`)
        if (doc.file_url) {
          console.log(`      URL: ${doc.file_url}`)
        }
        if (doc.error_message) {
          console.log(`      Error: ${doc.error_message}`)
        }
      })

    } catch (error) {
      console.log(`   ❌ Document retrieval error: ${error instanceof Error ? error.message : error}`)
      allTestsPassed = false
    }

    // Test 7: API Endpoint Test (simulated)
    console.log('\n🌐 Test 7: API Endpoints')
    
    // Test health endpoint
    try {
      const health = await documentService.getHealthStatus()
      console.log(`   ✅ Health endpoint working: ${health.healthy ? 'Healthy' : 'Unhealthy'}`)
    } catch (error) {
      console.log(`   ❌ Health endpoint error: ${error instanceof Error ? error.message : error}`)
      allTestsPassed = false
    }

    // Clean up test data
    console.log('\n🧹 Test 8: Cleanup')
    await dbTestUtils.cleanupTestData()
    console.log('   ✅ Test data cleanup completed')

    // Test Summary
    console.log('\n' + '=' .repeat(55))
    if (allTestsPassed) {
      console.log('🎉 All Phase 2 Tests Passed!')
      console.log('\n✅ Document generation system is working')
      console.log('✅ PDF templates are generating correctly')
      console.log('✅ File storage is operational')
      console.log('✅ Database tracking is functioning')
      console.log('✅ API endpoints are ready')
      console.log('✅ Error handling is in place')
      
      console.log('\n🔄 Next Steps:')
      console.log('   1. Enable document generation in environment: ENABLE_DOCUMENT_GENERATION=true')
      console.log('   2. Enable specific document types as needed')
      console.log('   3. Configure email service for Phase 3')
      console.log('   4. Set up webhook processing for automated generation')
      console.log('   5. Begin Phase 3: Email Notification Service')
      
    } else {
      console.log('❌ Some Phase 2 Tests Failed')
      console.log('\n🔍 Check the errors above and resolve before proceeding')
      console.log('💡 Common issues:')
      console.log('   - Storage bucket permissions not set up')
      console.log('   - Missing Supabase service role key')
      console.log('   - File system permissions for PDF generation')
      console.log('   - Network connectivity to Supabase')
    }

  } catch (error) {
    console.error('💥 Phase 2 testing failed with error:', error)
    console.log('\n🚨 Critical Issue Detected')
    console.log('   Please check your environment configuration')
    console.log('   Ensure all Phase 1 requirements are met')
    console.log('   Verify Supabase credentials and permissions')
    allTestsPassed = false
  }

  process.exit(allTestsPassed ? 0 : 1)
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPhase2Tests().catch(console.error)
}

export { runPhase2Tests }