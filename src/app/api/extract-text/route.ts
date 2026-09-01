import { NextRequest, NextResponse } from "next/server";
import { serverExtractRawTextFromFile } from "@/lib/ai-services";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await serverExtractRawTextFromFile(formData);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Lỗi xử lý file" }, { status: 500 });
  }
}
