import { NextRequest, NextResponse } from "next/server";
import { serverGenerateSpec } from "@/lib/ai-services";

export async function POST(req: NextRequest) {
  try {
    const { config, aiSettings } = await req.json();
    const result = await serverGenerateSpec(config, aiSettings);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Lỗi tạo ma trận" }, { status: 500 });
  }
}
