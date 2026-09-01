export async function extractRawTextFromFile(formData: FormData) {
  try {
    const res = await fetch("/api/extract-text", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error("Lỗi extract raw text:", err);
    return { success: false, text: "", error: err.message || "Lỗi xử lý file" };
  }
}

export async function generateSpec(config: any, aiSettings?: any) {
  try {
    const res = await fetch("/api/generate-spec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config, aiSettings }),
    });
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error("Lỗi generateSpec:", err);
    return { success: false, error: err.message || "Lỗi kết nối tới máy chủ" };
  }
}

export async function generateExams(
  config: any, 
  matrixData: any[], 
  aiSettings?: any, 
  sgkWorks: string[] = [], 
  questionBankText: string = "", 
  similarityRate: number = 100,
  customPrompt?: string
) {
  try {
    const res = await fetch("/api/generate-exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config,
        matrixData,
        aiSettings,
        sgkWorks,
        questionBankText,
        similarityRate,
        customPrompt,
      }),
    });
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error("Lỗi generateExams:", err);
    return { success: false, error: err.message || "Lỗi kết nối tới máy chủ" };
  }
}

export async function generateReviewQuestions(
  config: any, 
  matrixData: any[], 
  aiSettings?: any, 
  sgkWorks: string[] = [], 
  useSgkForWriting: boolean = true,
  customPrompt?: string
) {
  try {
    const res = await fetch("/api/generate-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config,
        matrixData,
        aiSettings,
        sgkWorks,
        useSgkForWriting,
        customPrompt,
      }),
    });
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error("Lỗi generateReviewQuestions:", err);
    return { success: false, error: err.message || "Lỗi kết nối tới máy chủ" };
  }
}
