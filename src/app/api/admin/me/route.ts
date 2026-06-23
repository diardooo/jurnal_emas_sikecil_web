import { NextRequest, NextResponse } from "next/server";
import { forbidden, getAdmin } from "@/lib/admin";

/** Identity probe for the admin dashboard auth gate. 403 if not an admin. */
export async function GET(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) return forbidden();
  return NextResponse.json({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
}
