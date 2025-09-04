#!/usr/bin/env tsx

/**
 * Basic Phase 2 Test - Minimal test to verify core functionality
 */

import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testBasicPhase2() {
  console.log('🔍 Basic Phase 2 Test')
  console.log('=' .repeat(40))
  
  // Test 1: Environment Variables
  console.log('\n📋 Test 1: Environment Variables')
  console.log(`   ENABLE_DOCUMENT_GENERATION: ${process.env.ENABLE_DOCUMENT_GENERATION}`)
  console.log(`   SUPABASE_STORAGE_BUCKET: ${process.env.SUPABASE_STORAGE_BUCKET}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}`)
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'}`)

  // Test 2: Basic Supabase Connection
  console.log('\n🔌 Test 2: Supabase Connection')
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { error } = await supabase.from('orders').select('id').limit(1)
    if (!error) {
      console.log('   ✅ Database connection successful')
    } else {
      console.log(`   ❌ Database connection failed: ${error.message}`)
    }
  } catch (error) {
    console.log(`   ❌ Supabase connection error: ${error instanceof Error ? error.message : error}`)
  }

  // Test 3: Storage Bucket
  console.log('\n💾 Test 3: Storage Bucket Check')
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'order-documents'
    const { data, error } = await supabase.storage.getBucket(bucket)
    
    if (!error) {
      console.log(`   ✅ Storage bucket '${bucket}' exists`)
      console.log(`   📊 Bucket ID: ${data?.id}`)
      console.log(`   🔒 Public: ${data?.public}`)
    } else if (error.message.includes('not found')) {
      console.log(`   ⚠️  Storage bucket '${bucket}' not found - needs to be created`)
    } else {
      console.log(`   ❌ Storage bucket error: ${error.message}`)
    }
  } catch (error) {
    console.log(`   ❌ Storage test error: ${error instanceof Error ? error.message : error}`)
  }

  // Test 4: Simple PDF Generation Test
  console.log('\n📄 Test 4: PDF Library Check')
  try {
    const jsPDF = await import('jspdf')
    const doc = new jsPDF.jsPDF()
    doc.text('Test PDF', 10, 10)
    const output = doc.output('arraybuffer')
    console.log(`   ✅ PDF generation working - generated ${output.byteLength} bytes`)
  } catch (error) {
    console.log(`   ❌ PDF generation error: ${error instanceof Error ? error.message : error}`)
  }

  console.log('\n🏁 Basic test complete!')
  console.log('\nIf all tests pass, the core infrastructure is working.')
  console.log('The stack overflow issue may be in higher-level service integration.')
}

// Run tests
testBasicPhase2().catch(console.error)