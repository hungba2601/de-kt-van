import { NextRequest, NextResponse } from "next/server";
import { serverGenerateReviewQuestions } from "@/lib/ai-services";

export async function POST(req: NextRequest) {
  try {
    const { config, matrixData, aiSettings, sgkWorks, useSgkForWriting, customPrompt } = await req.json();
    const result = await serverGenerateReviewQuestions(
      config,
      matrixData,
      aiSettings,
      sgkWorks,
      useSgkForWriting,
      customPrompt
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Lỗi tạo câu hỏi ôn tập" }, { status: 500 });
  }
}
