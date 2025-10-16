import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { OrderStatus } from "@/packages/types/src";
import type { AppDatabase } from "@/lib/supabase-types";

const Body = z.object({ status: OrderStatus });

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = Body.parse(await req.json());
    const supabase = createServiceRoleClient();

    // Strictly typed update; ensure types are regenerated after schema changes
    const { error } = await supabase
      .from("orders")
      .update<AppDatabase["public"]["Tables"]["orders"]["Update"]>({ status: body.status })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: write to admin_audit_log once schema is finalized

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
