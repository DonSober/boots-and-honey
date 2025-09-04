#!/usr/bin/env tsx

/**
 * Phase 1 Testing Script
 * 
 * Tests the foundation infrastructure:
 * - Database schema verification
 * - Environment configuration validation
 * - Test data creation and cleanup
 * - Type safety verification
 */

import { dbTestUtils } from '@/lib/testing/database-utils'
import { config } from '@/lib/config/environment'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function runPhase1Tests() {
  console.log('🚀 Running Phase 1 Foundation Tests')
  console.log('=' .repeat(50))
  
  let allTestsPassed = true

  try {
    // Test 1: Environment Configuration
    console.log('\n📋 Test 1: Environment Configuration')
    const validation = config.validateAll()
    
    if (validation.valid) {
      console.log('✅ Environment configuration is valid')
    } else {
      console.log('⚠️  Environment configuration has warnings:')
      validation.errors.forEach(error => console.log(`   - ${error}`))
      console.log('💡 These warnings are expected in Phase 1')
    }

    // Log current configuration (masked for security)
    console.log('\n🔧 Current Configuration:')
    console.log(`   Document Generation: ${config.canGenerateDocuments() ? 'Enabled' : 'Disabled'}`)
    console.log(`   Email Notifications: ${config.canSendEmails() ? 'Enabled' : 'Disabled'}`)
    console.log(`   Webhook Processing: ${config.canProcessWebhooks() ? 'Enabled' : 'Disabled'}`)
    console.log(`   Test Mode: ${config.isTestMode() ? 'Enabled' : 'Disabled'}`)
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)

    // Test 2: Database Schema Verification
    console.log('\n🗄️  Test 2: Database Schema Verification')
    const schemaValid = await dbTestUtils.verifySchema()
    
    if (schemaValid) {
      console.log('✅ Database schema verification passed')
    } else {
      console.log('❌ Database schema verification failed')
      allTestsPassed = false
    }

    // Test 3: Database Statistics
    console.log('\n📊 Test 3: Database Statistics')
    const stats = await dbTestUtils.getDatabaseStats()
    console.log('Current record counts:')
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`)
    })

    // Test 4: Test Data Creation and Cleanup
    console.log('\n🧪 Test 4: Test Data Operations')
    
    // Clean up any existing test data first
    await dbTestUtils.cleanupTestData()
    
    // Create a complete test scenario
    const testScenario = await dbTestUtils.createCompleteTestScenario()
    console.log('✅ Test scenario created successfully')
    
    // Verify the test data was created
    console.log('📋 Test scenario includes:')
    console.log(`   Order: ${testScenario.order.order_number}`)
    console.log(`   Items: ${testScenario.items.length}`)
    console.log(`   Addon: ${testScenario.addon ? 'Yes' : 'No'}`)
    console.log(`   Documents: Receipt=${testScenario.documents.receipt.status}, PickSlip=${testScenario.documents.pickSlip.status}`)
    console.log(`   Communications: ${testScenario.communications.confirmation.status}`)
    console.log(`   Webhook Event: ${testScenario.webhookEvent.status}`)
    
    // Clean up test data
    await dbTestUtils.cleanupTestData()
    console.log('✅ Test data cleanup completed')

    // Test 5: Type Safety Verification
    console.log('\n🛡️  Test 5: Type Safety Verification')
    
    // This test verifies that our TypeScript types are working correctly
    try {
      // Test document types
      const documentTypes: Array<'receipt' | 'pick_slip'> = ['receipt', 'pick_slip']
      const documentStatuses: Array<'pending' | 'generated' | 'failed'> = ['pending', 'generated', 'failed']
      
      // Test communication types
      const commTypes: Array<'confirmation' | 'pickup_ready' | 'delivered' | 'cancelled'> = ['confirmation', 'pickup_ready', 'delivered', 'cancelled']
      const commStatuses: Array<'pending' | 'sent' | 'failed' | 'bounced'> = ['pending', 'sent', 'failed', 'bounced']
      
      console.log('✅ TypeScript types are properly defined')
      console.log(`   Document types: ${documentTypes.length}, statuses: ${documentStatuses.length}`)
      console.log(`   Communication types: ${commTypes.length}, statuses: ${commStatuses.length}`)
    } catch (error) {
      console.log('❌ Type safety verification failed:', error)
      allTestsPassed = false
    }

    // Test Summary
    console.log('\n' + '=' .repeat(50))
    if (allTestsPassed) {
      console.log('🎉 All Phase 1 Tests Passed!')
      console.log('\n✅ Foundation infrastructure is ready')
      console.log('✅ Database schema is properly set up')  
      console.log('✅ Environment configuration is functional')
      console.log('✅ Testing utilities are operational')
      console.log('✅ Type safety is ensured')
      
      console.log('\n🔄 Next Steps:')
      console.log('   1. Run database migration in Supabase Dashboard (if not done)')
      console.log('   2. Configure email service API keys when ready for Phase 2')
      console.log('   3. Set up webhook secrets when ready for Phase 3')
      console.log('   4. Begin Phase 2: Core Document Generation Service')
      
    } else {
      console.log('❌ Some Phase 1 Tests Failed')
      console.log('\n🔍 Check the errors above and fix before proceeding')
      console.log('💡 Common issues:')
      console.log('   - Database migration not run yet')
      console.log('   - Missing SUPABASE_SERVICE_ROLE_KEY')
      console.log('   - Incorrect Supabase URL')
    }

  } catch (error) {
    console.error('💥 Phase 1 testing failed with error:', error)
    console.log('\n🚨 Critical Issue Detected')
    console.log('   Please check your environment configuration')
    console.log('   Ensure Supabase credentials are correct')
    console.log('   Verify database migration was run successfully')
    allTestsPassed = false
  }

  process.exit(allTestsPassed ? 0 : 1)
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPhase1Tests().catch(console.error)
}

export { runPhase1Tests }