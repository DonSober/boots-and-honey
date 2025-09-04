-- ============================================================================
-- Migration: 001 - Document Tracking Tables
-- Description: Add tables for tracking generated documents and email communications
-- Author: Claude Code Assistant  
-- Date: 2025-01-04
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: order_documents
-- Purpose: Track all generated documents (receipts, pick slips, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('receipt', 'pick_slip')),
    file_url TEXT, -- Public URL for accessing the document
    file_path TEXT, -- Internal storage path
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    webhook_event_id TEXT, -- Links to the webhook event that triggered generation
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'failed')),
    error_message TEXT, -- Error details if generation failed
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}', -- Additional document-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: order_communications  
-- Purpose: Track all email communications sent to customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    communication_type TEXT NOT NULL CHECK (communication_type IN ('confirmation', 'pickup_ready', 'delivered', 'cancelled')),
    recipient_email TEXT NOT NULL,
    subject TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    webhook_event_id TEXT, -- Links to the webhook event that triggered communication
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    provider_message_id TEXT, -- Email service provider's message ID
    error_message TEXT, -- Error details if sending failed
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}', -- Additional communication-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: webhook_events
-- Purpose: Log all webhook events for debugging and monitoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- e.g., 'order_created', 'order_updated'
    table_name TEXT NOT NULL, -- Source table name
    record_id UUID NOT NULL, -- ID of the record that triggered the event
    payload JSONB NOT NULL, -- Full webhook payload
    processed_at TIMESTAMP WITH TIME ZONE, -- When processing completed
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT, -- Error details if processing failed
    retry_count INTEGER DEFAULT 0,
    processing_duration_ms INTEGER, -- How long processing took
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- order_documents indexes
CREATE INDEX IF NOT EXISTS idx_order_documents_order_id ON order_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_status ON order_documents(status);
CREATE INDEX IF NOT EXISTS idx_order_documents_type ON order_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_order_documents_webhook_event ON order_documents(webhook_event_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_created_at ON order_documents(created_at);

-- order_communications indexes
CREATE INDEX IF NOT EXISTS idx_order_communications_order_id ON order_communications(order_id);
CREATE INDEX IF NOT EXISTS idx_order_communications_status ON order_communications(status);
CREATE INDEX IF NOT EXISTS idx_order_communications_type ON order_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_order_communications_webhook_event ON order_communications(webhook_event_id);
CREATE INDEX IF NOT EXISTS idx_order_communications_created_at ON order_communications(created_at);

-- webhook_events indexes  
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_record_id ON webhook_events(record_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for all new tables
CREATE TRIGGER update_order_documents_updated_at 
    BEFORE UPDATE ON order_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_communications_updated_at 
    BEFORE UPDATE ON order_communications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_events_updated_at 
    BEFORE UPDATE ON webhook_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Setup
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_communications ENABLE ROW LEVEL SECURITY;  
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing service role full access for now)
-- These can be refined later based on specific security requirements

CREATE POLICY "Service role can manage order_documents" ON order_documents
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage order_communications" ON order_communications
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage webhook_events" ON webhook_events
    FOR ALL TO service_role USING (true);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE order_documents IS 'Tracks all generated documents (receipts, pick slips) for orders';
COMMENT ON TABLE order_communications IS 'Tracks all email communications sent to customers';
COMMENT ON TABLE webhook_events IS 'Logs all webhook events for debugging and monitoring';

COMMENT ON COLUMN order_documents.webhook_event_id IS 'Links to the webhook event that triggered document generation';
COMMENT ON COLUMN order_documents.metadata IS 'Additional document-specific data (file size, generation time, etc.)';
COMMENT ON COLUMN order_communications.provider_message_id IS 'Email service provider message ID for tracking';
COMMENT ON COLUMN webhook_events.processing_duration_ms IS 'Processing time in milliseconds for performance monitoring';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 001-document-tracking-tables completed successfully';
    RAISE NOTICE 'Tables created: order_documents, order_communications, webhook_events';
    RAISE NOTICE 'Indexes created for performance optimization';
    RAISE NOTICE 'RLS enabled with service role policies';
END $$;