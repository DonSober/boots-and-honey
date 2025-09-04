/**
 * Environment Configuration & Feature Flags
 * 
 * Centralized configuration management for the document generation system.
 * This allows for gradual rollout and easy configuration management.
 */

export interface DocumentConfig {
  generation: {
    enabled: boolean
    receiptEnabled: boolean
    pickSlipEnabled: boolean
    timeout: number
    maxRetries: number
  }
  email: {
    enabled: boolean
    orderConfirmationEnabled: boolean
    statusUpdateEnabled: boolean
    fromEmail: string
    fromName: string
    timeout: number
    maxRetries: number
    testMode: boolean
    testRecipient?: string
  }
  webhook: {
    enabled: boolean
    orderCreatedEnabled: boolean
    orderUpdatedEnabled: boolean
    secret: string
    maxRetries: number
    timeout: number
    rateLimit: number
  }
  storage: {
    bucket: string
    baseUrl: string
  }
  debug: {
    webhooks: boolean
    documents: boolean
    emails: boolean
  }
}

class EnvironmentConfig {
  private config: DocumentConfig

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): DocumentConfig {
    return {
      generation: {
        enabled: this.getBoolean('ENABLE_DOCUMENT_GENERATION', false),
        receiptEnabled: this.getBoolean('ENABLE_RECEIPT_GENERATION', false),
        pickSlipEnabled: this.getBoolean('ENABLE_PICK_SLIP_GENERATION', false),
        timeout: this.getNumber('DOCUMENT_GENERATION_TIMEOUT_MS', 30000),
        maxRetries: this.getNumber('DOCUMENT_GENERATION_MAX_RETRIES', 2)
      },
      email: {
        enabled: this.getBoolean('ENABLE_EMAIL_NOTIFICATIONS', false),
        orderConfirmationEnabled: this.getBoolean('ENABLE_ORDER_CONFIRMATION_EMAIL', false),
        statusUpdateEnabled: this.getBoolean('ENABLE_STATUS_UPDATE_EMAILS', false),
        fromEmail: this.getString('SMTP_FROM_EMAIL', 'orders@bootsandhoney.com'),
        fromName: this.getString('SMTP_FROM_NAME', 'Boots & Honey'),
        timeout: this.getNumber('EMAIL_SEND_TIMEOUT_MS', 10000),
        maxRetries: this.getNumber('EMAIL_MAX_RETRIES', 3),
        testMode: this.getBoolean('TEST_MODE', true),
        testRecipient: this.getOptionalString('TEST_EMAIL_RECIPIENT')
      },
      webhook: {
        enabled: this.getBoolean('ENABLE_WEBHOOK_PROCESSING', false),
        orderCreatedEnabled: this.getBoolean('ENABLE_ORDER_CREATED_WEBHOOK', false),
        orderUpdatedEnabled: this.getBoolean('ENABLE_ORDER_UPDATED_WEBHOOK', false),
        secret: this.getString('WEBHOOK_SECRET', ''),
        maxRetries: this.getNumber('WEBHOOK_MAX_RETRIES', 3),
        timeout: this.getNumber('WEBHOOK_PROCESSING_TIMEOUT_MS', 60000),
        rateLimit: this.getNumber('WEBHOOK_RATE_LIMIT_PER_MINUTE', 60)
      },
      storage: {
        bucket: this.getString('SUPABASE_STORAGE_BUCKET', 'order-documents'),
        baseUrl: this.getString('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
      },
      debug: {
        webhooks: this.getBoolean('DEBUG_WEBHOOK_EVENTS', false),
        documents: this.getBoolean('DEBUG_DOCUMENT_GENERATION', false),
        emails: this.getBoolean('DEBUG_EMAIL_SENDING', false)
      }
    }
  }

  private getString(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue
  }

  private getOptionalString(key: string): string | undefined {
    return process.env[key]
  }

  private getNumber(key: string, defaultValue: number): number {
    const value = process.env[key]
    if (!value) return defaultValue
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }

  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key]
    if (!value) return defaultValue
    return value.toLowerCase() === 'true'
  }

  // Public getters for different configuration sections
  get documentGeneration() {
    return this.config.generation
  }

  get email() {
    return this.config.email
  }

  get webhook() {
    return this.config.webhook
  }

  get storage() {
    return this.config.storage
  }

  get debug() {
    return this.config.debug
  }

  // Validation methods
  validateEmailConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (this.email.enabled) {
      if (!this.getString('RESEND_API_KEY', '')) {
        errors.push('RESEND_API_KEY is required when email notifications are enabled')
      }
      if (!this.email.fromEmail) {
        errors.push('SMTP_FROM_EMAIL is required when email notifications are enabled')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  validateWebhookConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (this.webhook.enabled) {
      if (!this.webhook.secret) {
        errors.push('WEBHOOK_SECRET is required when webhook processing is enabled')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  validateStorageConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (this.documentGeneration.enabled) {
      const supabaseUrl = this.getString('NEXT_PUBLIC_SUPABASE_URL', '')
      const serviceRoleKey = this.getString('SUPABASE_SERVICE_ROLE_KEY', '')

      if (!supabaseUrl) {
        errors.push('NEXT_PUBLIC_SUPABASE_URL is required for document storage')
      }
      if (!serviceRoleKey) {
        errors.push('SUPABASE_SERVICE_ROLE_KEY is required for document storage')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Complete validation
  validateAll(): { valid: boolean; errors: string[] } {
    const emailValidation = this.validateEmailConfig()
    const webhookValidation = this.validateWebhookConfig()
    const storageValidation = this.validateStorageConfig()

    const allErrors = [
      ...emailValidation.errors,
      ...webhookValidation.errors,
      ...storageValidation.errors
    ]

    return {
      valid: allErrors.length === 0,
      errors: allErrors
    }
  }

  // Development helpers
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  isTestMode(): boolean {
    return this.email.testMode || this.isDevelopment()
  }

  // Logging helper
  logConfig(section?: keyof DocumentConfig): void {
    if (!this.debug.webhooks && !this.isDevelopment()) return

    const configToLog = section ? { [section]: this.config[section] } : this.config

    console.log('🔧 Document Generation Config:', JSON.stringify(configToLog, null, 2))
  }

  // Feature flag helpers
  canGenerateDocuments(): boolean {
    return this.documentGeneration.enabled
  }

  canGenerateReceipts(): boolean {
    return this.documentGeneration.enabled && this.documentGeneration.receiptEnabled
  }

  canGeneratePickSlips(): boolean {
    return this.documentGeneration.enabled && this.documentGeneration.pickSlipEnabled
  }

  canSendEmails(): boolean {
    return this.email.enabled
  }

  canProcessWebhooks(): boolean {
    return this.webhook.enabled
  }

  canProcessOrderCreatedWebhooks(): boolean {
    return this.webhook.enabled && this.webhook.orderCreatedEnabled
  }

  canProcessOrderUpdatedWebhooks(): boolean {
    return this.webhook.enabled && this.webhook.orderUpdatedEnabled
  }
}

// Export singleton instance
export const config = new EnvironmentConfig()

// Export class for testing
export { EnvironmentConfig }