import { NextRequest, NextResponse } from "next/server";
import { serverGenerateExams } from "@/lib/ai-services";

export async function POST(req: NextRequest) {
  try {
    const { config, matrixData, aiSettings, sgkWorks, questionBankText, similarityRate, customPrompt } = await req.json();
    const result = await serverGenerateExams(
      config,
      matrixData,
      aiSettings,
      sgkWorks,
      questionBankText,
      similarityRate,
      customPrompt
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Lỗi tạo đề thi" }, { status: 500 });
  }
}
