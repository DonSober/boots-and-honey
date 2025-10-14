import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { OrderStatus } from "@/packages/types/src";

const Body = z.object({ status: OrderStatus });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = Body.parse(await req.json());
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("orders")
      .update({ status: body.status })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: write to admin_audit_log once schema is finalized

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 400 });
  }
}