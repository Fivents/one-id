import { NextResponse } from "next/server";
import { logout } from "@/domain/auth";

export async function POST() {
  await logout();
  return NextResponse.json({ success: true });
}
