#!/usr/bin/env tsx

/**
 * Simple API Test - Test document generation via API endpoints
 */

import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testAPI() {
  console.log('🌐 Testing Document Generation API')
  console.log('=' .repeat(40))
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  try {
    // Test health endpoint
    console.log('\n🏥 Testing Health Endpoint')
    const healthResponse = await fetch(`${baseUrl}/api/documents/generate`, {
      method: 'GET'
    })
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('   ✅ Health endpoint responding')
      console.log(`   📊 Service: ${healthData.service}`)
      console.log(`   💚 Healthy: ${healthData.healthy}`)
    } else {
      console.log(`   ⚠️ Health endpoint returned: ${healthResponse.status}`)
    }
    
  } catch (error) {
    console.log(`   ❌ API test error: ${error instanceof Error ? error.message : error}`)
    console.log(`   💡 Make sure the dev server is running: npm run dev`)
  }
  
  console.log('\n🏁 API test complete!')
}

// Run test
testAPI().catch(console.error)