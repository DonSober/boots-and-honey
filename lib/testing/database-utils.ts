/**
 * Database Testing Utilities
 *
 * Utilities for testing database operations, seeding test data,
 * and cleaning up after tests. Safe for development environment only.
 */

import { createClient } from "@supabase/supabase-js";
import {
  OrderInsert,
  OrderItemInsert,
  OrderAddonInsert,
  OrderDocumentInsert,
  OrderCommunicationInsert,
  WebhookEventInsert,
} from "@/types/database";

export class DatabaseTestUtils {
  private supabase: ReturnType<typeof createClient> | null = null;
  private isTestEnvironment: boolean;

  constructor() {
    // Safety check - only allow in development/test
    this.isTestEnvironment =
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test" ||
      !process.env.NODE_ENV; // Default for scripts

    if (!this.isTestEnvironment) {
      throw new Error(
        "Database test utilities can only be used in development/test environment"
      );
    }
  }

  private getSupabase() {
    if (!this.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
          "Missing Supabase credentials for testing. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
        );
      }

      this.supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return this.supabase;
  }

  /**
   * Create a test order with items and addons
   */
  async createTestOrder(overrides: Partial<OrderInsert> = {}) {
    const orderData: OrderInsert = {
      order_number: `TEST-${Date.now()}`,
      company_name: "Test Company",
      contact_name: "Test Contact",
      email: "test@example.com",
      phone: "555-0123",
      business_address: "123 Test St",
      city: "Test City",
      state: "CA",
      zip_code: "90210",
      po_number: "PO-TEST-123",
      special_instructions: "Test order for development",
      subtotal: 100,
      addon_total: 25,
      total: 125,
      status: "pending",
      ...overrides,
    };

    const { data: order, error } = await this.getSupabase()
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test order: ${error.message}`);
    }

    return order;
  }

  /**
   * Create test order items for an order
   */
  async createTestOrderItems(orderId: string, itemCount: number = 2) {
    // First, get some products to reference
    const { data: products, error: productsError } = await this.getSupabase()
      .from("products")
      .select("*")
      .limit(itemCount);

    if (productsError || !products?.length) {
      throw new Error("No products found for test order items");
    }

    const orderItems: OrderItemInsert[] = products.map((product, index) => ({
      order_id: orderId,
      product_id: product.id,
      quantity: index + 1,
      unit_price: product.price_per_bundle,
      total_price: product.price_per_bundle * (index + 1),
    }));

    const { data, error } = await this.getSupabase()
      .from("order_items")
      .insert(orderItems)
      .select();

    if (error) {
      throw new Error(`Failed to create test order items: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a test order addon
   */
  async createTestOrderAddon(orderId: string) {
    // Get an addon to reference
    const { data: addon, error: addonError } = await this.getSupabase()
      .from("addons")
      .select("*")
      .limit(1)
      .single();

    if (addonError || !addon) {
      throw new Error("No addons found for test order addon");
    }

    const orderAddon: OrderAddonInsert = {
      order_id: orderId,
      addon_id: addon.id,
      price: addon.price,
    };

    const { data, error } = await this.getSupabase()
      .from("order_addons")
      .insert(orderAddon)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test order addon: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a test document record
   */
  async createTestDocument(
    orderId: string,
    type: "receipt" | "pick_slip",
    status: "pending" | "generated" | "failed" = "pending"
  ) {
    const document: OrderDocumentInsert = {
      order_id: orderId,
      document_type: type,
      status: status,
      webhook_event_id: `test-event-${Date.now()}`,
      metadata: { test: true },
    };

    const { data, error } = await this.getSupabase()
      .from("order_documents")
      .insert(document)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test document: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a test communication record
   */
  async createTestCommunication(
    orderId: string,
    type: "confirmation" | "pickup_ready" | "delivered" | "cancelled",
    status: "pending" | "sent" | "failed" | "bounced" = "pending"
  ) {
    const communication: OrderCommunicationInsert = {
      order_id: orderId,
      communication_type: type,
      recipient_email: "test@example.com",
      subject: `Test ${type} email`,
      status: status,
      webhook_event_id: `test-event-${Date.now()}`,
      metadata: { test: true },
    };

    const { data, error } = await this.getSupabase()
      .from("order_communications")
      .insert(communication)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test communication: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a test webhook event record
   */
  async createTestWebhookEvent(
    orderId: string,
    eventType: string = "order_created",
    status: "pending" | "processing" | "completed" | "failed" = "pending"
  ) {
    const event: WebhookEventInsert = {
      event_type: eventType,
      table_name: "orders",
      record_id: orderId,
      payload: {
        type: "INSERT",
        table: "orders",
        record: { id: orderId },
        event_id: `test-${Date.now()}`,
        test: true,
      },
      status: status,
    };

    const { data, error } = await this.getSupabase()
      .from("webhook_events")
      .insert(event)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test webhook event: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a complete test scenario with order, items, documents, and communications
   */
  async createCompleteTestScenario() {
    console.log("🧪 Creating complete test scenario...");

    // Create test order
    const order = await this.createTestOrder();
    console.log(`✅ Created test order: ${order.order_number}`);

    // Create order items
    const items = await this.createTestOrderItems(order.id);
    console.log(`✅ Created ${items.length} order items`);

    // Create order addon
    const addon = await this.createTestOrderAddon(order.id);
    console.log(`✅ Created order addon`);

    // Create document records
    const receipt = await this.createTestDocument(
      order.id,
      "receipt",
      "generated"
    );
    const pickSlip = await this.createTestDocument(
      order.id,
      "pick_slip",
      "generated"
    );
    console.log(`✅ Created document records`);

    // Create communication records
    const confirmation = await this.createTestCommunication(
      order.id,
      "confirmation",
      "sent"
    );
    console.log(`✅ Created communication records`);

    // Create webhook event
    const webhookEvent = await this.createTestWebhookEvent(order.id);
    console.log(`✅ Created webhook event`);

    return {
      order,
      items,
      addon,
      documents: { receipt, pickSlip },
      communications: { confirmation },
      webhookEvent,
    };
  }

  /**
   * Clean up test data created during testing
   */
  async cleanupTestData() {
    if (!this.isTestEnvironment) {
      throw new Error(
        "Cleanup can only be run in development/test environment"
      );
    }

    console.log("🧹 Cleaning up test data...");

    // Delete test orders and related data (cascade will handle related records)
    const { error: orderError } = await this.getSupabase()
      .from("orders")
      .delete()
      .like("order_number", "TEST-%");

    if (orderError) {
      console.warn("⚠️ Error cleaning up test orders:", orderError.message);
    }

    // Delete test webhook events
    const { error: webhookError } = await this.getSupabase()
      .from("webhook_events")
      .delete()
      .eq("payload->>test", "true");

    if (webhookError) {
      console.warn(
        "⚠️ Error cleaning up test webhook events:",
        webhookError.message
      );
    }

    // Delete test documents
    const { error: docError } = await this.getSupabase()
      .from("order_documents")
      .delete()
      .eq("metadata->>test", "true");

    if (docError) {
      console.warn("⚠️ Error cleaning up test documents:", docError.message);
    }

    // Delete test communications
    const { error: commError } = await this.getSupabase()
      .from("order_communications")
      .delete()
      .eq("metadata->>test", "true");

    if (commError) {
      console.warn(
        "⚠️ Error cleaning up test communications:",
        commError.message
      );
    }

    console.log("✅ Test data cleanup completed");
  }

  /**
   * Verify database schema is properly set up
   */
  async verifySchema() {
    console.log("🔍 Verifying database schema...");

    const tables = [
      "orders",
      "order_items",
      "order_addons",
      "products",
      "addons",
      "order_documents",
      "order_communications",
      "webhook_events",
    ];

    const results = [];

    for (const tableName of tables) {
      try {
        const { error } = await this.getSupabase()
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          results.push({
            table: tableName,
            status: "error",
            error: error.message,
          });
        } else {
          results.push({ table: tableName, status: "ok" });
        }
      } catch (error) {
        results.push({
          table: tableName,
          status: "error",
          error: String(error),
        });
      }
    }

    const failedTables = results.filter((r) => r.status === "error");

    if (failedTables.length > 0) {
      console.error("❌ Schema verification failed for tables:");
      failedTables.forEach((t) => console.error(`   ${t.table}: ${t.error}`));
      return false;
    }

    console.log("✅ All database tables verified");
    return true;
  }

  /**
   * Get database statistics for monitoring
   */
  async getDatabaseStats() {
    const stats = {};

    const tables = [
      "orders",
      "order_items",
      "order_addons",
      "order_documents",
      "order_communications",
      "webhook_events",
    ];

    for (const tableName of tables) {
      try {
        const { count, error } = await this.getSupabase()
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (!error) {
          stats[tableName] = count || 0;
        }
      } catch (error) {
        stats[tableName] = "error";
      }
    }

    return stats;
  }
}

// Export singleton for easy use
export const dbTestUtils = new DatabaseTestUtils();
