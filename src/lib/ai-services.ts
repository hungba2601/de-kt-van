import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";
import { curriculumData } from "@/lib/curriculumData";

export async function serverExtractRawTextFromFile(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, text: "" };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = "";
    if (file.name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.name.endsWith(".pdf")) {
      try {
        const pdfParse = require("pdf-parse");
        const result = await pdfParse(buffer);
        text = result.text;
      } catch (err) {
        console.error("PDF parse error:", err);
      }
    } else {
      text = buffer.toString("utf-8");
    }

    return { success: true, text };
  } catch (err: any) {
    console.error("Lỗi extract raw text:", err);
    return { success: false, text: "", error: err.message };
  }
}

export function cleanAndParseJSON(rawText: string) {
  let text = (rawText || "").trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
  }

  // 1. Direct parse
  try {
    return JSON.parse(text);
  } catch (e) {}

  // 2. Trailing comma removal and break tags
  let sanitized = text.replace(/,\s*([\]}])/g, "$1");
  sanitized = sanitized.replace(/<br\s*\/?>/gi, "\\n");
  try {
    return JSON.parse(sanitized);
  } catch (e) {}

  // 3. Fix unescaped newlines and control characters inside strings
  let inString = false;
  let escaped = false;
  let fixedChars: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && !escaped) {
      inString = !inString;
      fixedChars.push(ch);
    } else if (inString && ch === '\n' && !escaped) {
      fixedChars.push('\\n');
    } else if (inString && ch === '\r') {
      // ignore carriage return
    } else if (inString && ch === '\t') {
      fixedChars.push('\\t');
    } else {
      fixedChars.push(ch);
    }
    escaped = (ch === '\\' && !escaped);
  }
  let fixedStr = fixedChars.join("");
  fixedStr = fixedStr.replace(/,\s*([\]}])/g, "$1");
  try {
    return JSON.parse(fixedStr);
  } catch (e) {}

  // 4. Truncation repair: search backwards for last complete object/array ending
  for (let i = fixedStr.length - 1; i >= 0; i--) {
    if (fixedStr[i] === '}' || fixedStr[i] === ']') {
      let sub = fixedStr.slice(0, i + 1).trim();
      sub = sub.replace(/,\s*([\]}])/g, "$1");
      let openBrackets = (sub.match(/\[/g) || []).length - (sub.match(/\]/g) || []).length;
      let openBraces = (sub.match(/\{/g) || []).length - (sub.match(/\}/g) || []).length;
      let suffix = "}".repeat(Math.max(0, openBraces)) + "]".repeat(Math.max(0, openBrackets));
      try {
        const parsed = JSON.parse(sub + suffix);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (err) {}
    }
  }

  // 5. Ultimate fallback: regex search for valid objects
  const objects: any[] = [];
  const regex = /\{[^{}]*"docHieu"[\s\S]*?"viet"[\s\S]*?\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      objects.push(JSON.parse(match[0]));
    } catch (e) {}
  }
  if (objects.length > 0) return objects;

  throw new Error("Không thể trích xuất JSON hợp lệ từ phản hồi của AI. Vui lòng bấm tạo lại.");
}

export function formatApiErrorMessage(err: any, selectedModel: string): string {
  const rawMsg = err?.message || err?.toString() || "Lỗi không xác định";
  const lowerMsg = rawMsg.toLowerCase();

  if (lowerMsg.includes("api_key") || lowerMsg.includes("api key") || lowerMsg.includes("403") || lowerMsg.includes("unauthenticated")) {
    return "GEMINI_API_ERROR: API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại API Key trong phần Cài đặt.";
  }
  if (lowerMsg.includes("404") || lowerMsg.includes("not found") || lowerMsg.includes("models/")) {
    return `GEMINI_API_ERROR: Mô hình AI '${selectedModel}' không khả dụng hoặc chưa hỗ trợ tài khoản này. Vui lòng vào Cài đặt đổi sang Gemini 2.5 Flash.`;
  }
  if (lowerMsg.includes("429") || lowerMsg.includes("resource_exhausted") || lowerMsg.includes("quota") || lowerMsg.includes("rate limit")) {
    return "GEMINI_API_ERROR: Tài khoản API Key của bạn đã hết hạn mức (Quota Exceeded / Rate Limit). Vui lòng thử lại sau vài phút hoặc đổi API Key khác.";
  }
  if (lowerMsg.includes("503") || lowerMsg.includes("overloaded") || lowerMsg.includes("high demand") || lowerMsg.includes("unavailable")) {
    return "GEMINI_API_ERROR: Mô hình AI hiện đang quá tải (High demand). Vui lòng đợi khoảng 1-2 phút rồi ấn lại, hoặc vào Cài đặt để đổi sang mô hình khác.";
  }

  return `GEMINI_API_ERROR: ${rawMsg}`;
}

export function normalizeSingleExam(exam: any, defaultDhPoints: number = 6, defaultVietPoints: number = 4): any {
  if (!exam || typeof exam !== 'object') {
    return {
      docHieu: { points: defaultDhPoints, text: "", questions: [] },
      viet: { points: defaultVietPoints, questions: [] }
    };
  }

  const docHieu = exam.docHieu || exam.doc_hieu || exam.reading || exam.doc || {};
  const viet = exam.viet || exam.writing || exam.tapLamVan || {};

  // Normalize docHieu questions
  let rawDhQuestions: any[] = [];
  if (Array.isArray(docHieu.questions)) {
    rawDhQuestions = docHieu.questions;
  } else if (Array.isArray(docHieu.cauHoi)) {
    rawDhQuestions = docHieu.cauHoi;
  } else if (Array.isArray(docHieu.items)) {
    rawDhQuestions = docHieu.items;
  } else if (docHieu.question || docHieu.cauHoi) {
    rawDhQuestions = [{ question: docHieu.question || docHieu.cauHoi, answer: docHieu.answer || docHieu.dapAn || "", points: 1, level: "Nhận biết" }];
  }

  const dhQuestions = rawDhQuestions.map((q: any, idx: number) => ({
    points: typeof q.points === 'number' ? q.points : parseFloat(q.points) || (q.diem ? parseFloat(q.diem) : 1.0),
    question: q.question || q.cauHoi || q.noiDung || `Câu hỏi ${idx + 1}`,
    answer: q.answer || q.dapAn || q.huongDan || "",
    level: q.level || q.mucDo || "Nhận biết"
  }));

  // Normalize viet questions
  let rawVietQuestions: any[] = [];
  if (Array.isArray(viet.questions)) {
    rawVietQuestions = viet.questions;
  } else if (Array.isArray(viet.cauHoi)) {
    rawVietQuestions = viet.cauHoi;
  } else if (Array.isArray(viet.items)) {
    rawVietQuestions = viet.items;
  } else if (viet.question || viet.cauHoi || viet.deBai) {
    rawVietQuestions = [{
      question: viet.question || viet.cauHoi || viet.deBai,
      answer: viet.answer || viet.dapAn || viet.danY || viet.huongDan || "",
      points: viet.points || defaultVietPoints,
      level: "Vận dụng cao"
    }];
  }

  const vietQuestions = rawVietQuestions.map((q: any, idx: number) => ({
    points: typeof q.points === 'number' ? q.points : parseFloat(q.points) || (viet.points || defaultVietPoints),
    question: q.question || q.cauHoi || q.deBai || `Đề bài viết ${idx + 1}`,
    answer: q.answer || q.dapAn || q.danY || q.huongDan || "",
    level: q.level || q.mucDo || "Vận dụng cao"
  }));

  return {
    docHieu: {
      points: docHieu.points || defaultDhPoints,
      text: docHieu.text || docHieu.vanBan || docHieu.nguLieu || docHieu.content || "",
      questions: dhQuestions
    },
    viet: {
      points: viet.points || defaultVietPoints,
      questions: vietQuestions
    }
  };
}

export function normalizeExams(parsedData: any, defaultDhPoints: number = 6, defaultVietPoints: number = 4): any[] {
  if (Array.isArray(parsedData) && parsedData.length > 0) {
    return parsedData.map(e => normalizeSingleExam(e, defaultDhPoints, defaultVietPoints));
  }

  if (parsedData && typeof parsedData === 'object') {
    // Check if wrapped in an array key
    for (const key of ['exams', 'deThi', 'de_thi', 'danhSachDe', 'tests', 'data', 'items', 'list']) {
      if (Array.isArray(parsedData[key]) && parsedData[key].length > 0) {
        return parsedData[key].map((e: any) => normalizeSingleExam(e, defaultDhPoints, defaultVietPoints));
      }
    }

    // Check if object keys are de1, de2 or numbered
    const values = Object.values(parsedData);
    const validObjects = values.filter(v => typeof v === 'object' && v !== null && ('docHieu' in v || 'viet' in v || 'doc_hieu' in v || 'reading' in v));
    if (validObjects.length > 0) {
      return validObjects.map(e => normalizeSingleExam(e, defaultDhPoints, defaultVietPoints));
    }

    // Single exam fallback
    if ('docHieu' in parsedData || 'viet' in parsedData || 'doc_hieu' in parsedData) {
      return [normalizeSingleExam(parsedData, defaultDhPoints, defaultVietPoints)];
    }
  }

  return [];
}

function validateApiKey(apiKeyRaw?: string): { valid: boolean; key: string; error?: string } {
  const trimmed = (apiKeyRaw || "").trim();
  if (!trimmed) {
    return {
      valid: false,
      key: "",
      error: "GEMINI_API_ERROR: Vui lòng nhập API Key trong mục Cài đặt để sử dụng tính năng AI."
    };
  }

  if (/[^\x00-\x7F]/.test(trimmed)) {
    return {
      valid: false,
      key: "",
      error: "GEMINI_API_ERROR: API Key đang chứa ký tự tiếng Việt có dấu (do bộ gõ Unikey/EVKey chèn dấu khi dán). Vui lòng vào Cài đặt API ở góc phải trên, chuyển sang bàn phím tiếng Anh và dán lại chính xác API Key."
    };
  }

  return { valid: true, key: trimmed };
}

export async function serverGenerateSpec(config: any, aiSettings?: any) {
  const check = validateApiKey(aiSettings?.apiKey);
  if (!check.valid) {
    return { success: false, error: check.error };
  }
  
  try {
    await new Promise((resolve, reject) => {
      if (check.key === "invalid") {
        setTimeout(() => reject(new Error("GEMINI_API_ERROR: API Key không hợp lệ (quota exceeded hoặc sai).")), 1000);
      } else {
        setTimeout(resolve, 1500);
      }
    });

    const gradeData = curriculumData[config?.grade] || [];
    const docHieuCategory = gradeData.find(g => g.category.includes("ĐỌC HIỂU"))?.items || [];
    const thtvCategory = gradeData.find(g => g.category.includes("TIẾNG VIỆT"))?.items || [];
    const vietCategory = gradeData.find(g => g.category.includes("VIẾT"))?.items || [];

    const docHieuLessons = config?.selectedLessons?.filter((l: string) => docHieuCategory.includes(l)) || [];
    const thtvLessons = config?.selectedLessons?.filter((l: string) => thtvCategory.includes(l)) || [];
    const vietLessons = config?.selectedLessons?.filter((l: string) => vietCategory.includes(l)) || [];

    const docHieuRatio = config?.skillRatio?.docHieu ?? 60;
    const vietRatio = config?.skillRatio?.viet ?? 40;

    const docHieuTotalPoints = docHieuRatio / 10;
    const vietTotalPoints = vietRatio / 10;

    let docHieuContent = docHieuLessons.length > 0 
      ? docHieuLessons.join("\n") 
      : "Văn bản văn học (Truyện ngắn)";
      
    const cleanedThtvLessons = thtvLessons.map((l: string) => l.replace(/^(Từ vựng|Ngữ pháp & Văn bản|Biện pháp tu từ|Dấu câu|Các kiến thức khác|Lịch sử ngôn ngữ|Dấu câu & Tài liệu):\s*/i, "").trim()).filter(Boolean);
    if (cleanedThtvLessons.length > 0) {
      docHieuContent += `\n\nThực hành tiếng Việt:\n- ${cleanedThtvLessons.join("\n- ")}`;
    } else if (thtvLessons.length > 0) {
      docHieuContent += `\n\nThực hành tiếng Việt`;
    }

    const totalNbPoints = (config?.ratio?.nb ?? 35) / 10;
    const totalThPoints = (config?.ratio?.th ?? 35) / 10;
    const totalVdPoints = (config?.ratio?.vd ?? 20) / 10;
    const totalVdcPoints = (config?.ratio?.vdc ?? 10) / 10;

    const dh_vdc = 0;
    let dh_vd = docHieuTotalPoints >= 3 ? Math.min(1, Math.floor(totalVdPoints)) : 0;
    let remainingDocHieu = Math.round(docHieuTotalPoints - dh_vd);

    const nbTargetShare = (totalNbPoints + totalThPoints > 0) ? (totalNbPoints / (totalNbPoints + totalThPoints)) : 0.5;
    let dh_nb = Math.min(Math.floor(totalNbPoints), Math.round(remainingDocHieu * nbTargetShare));
    let dh_th = remainingDocHieu - dh_nb;

    if (dh_th > totalThPoints) {
      const diff = dh_th - Math.floor(totalThPoints);
      dh_th -= diff;
      dh_nb += diff;
    }

    const v_nb = Math.max(0, parseFloat((totalNbPoints - dh_nb).toFixed(2)));
    const v_th = Math.max(0, parseFloat((totalThPoints - dh_th).toFixed(2)));
    const v_vd = Math.max(0, parseFloat((totalVdPoints - dh_vd).toFixed(2)));
    const v_vdc = Math.max(0, parseFloat((totalVdcPoints - dh_vdc).toFixed(2)));

    const mockMatrixData: any[] = [];

    mockMatrixData.push({
      skill: "Đọc hiểu",
      content: docHieuContent,
      nb: { count: dh_nb, points: parseFloat(dh_nb.toFixed(2)), text: dh_nb > 0 ? "- Nhận biết được đề tài, chi tiết tiêu biểu.\n- Nhận biết biện pháp tu từ." : "" },
      th: { count: dh_th, points: parseFloat(dh_th.toFixed(2)), text: dh_th > 0 ? "- Hiểu được chủ đề, thông điệp của văn bản.\n- Hiểu tác dụng của biện pháp tu từ." : "" },
      vd: { count: dh_vd, points: parseFloat(dh_vd.toFixed(2)), text: dh_vd > 0 ? "- Vận dụng kiến thức để giải quyết một tình huống tương tự." : "" },
      vdc: { count: dh_vdc, points: parseFloat(dh_vdc.toFixed(2)), text: dh_vdc > 0 ? "- Đánh giá sâu sắc văn bản." : "" },
      isGrouped: false,
    });

    let vietContent = "Viết bài văn nghị luận văn học";
    let vietGroupedText = "- Viết bài văn nghị luận phân tích, đánh giá một tác phẩm văn học.\n- Đảm bảo cấu trúc bài nghị luận.\n- Sáng tạo, thể hiện suy nghĩ sâu sắc.";

    if (vietLessons.length > 0) {
      vietContent = vietLessons.map((l: string) => `- ${l}`).join("\n");
      vietGroupedText = vietLessons.map((l: string) => `- Yêu cầu: ${l}\n- Đảm bảo cấu trúc bài văn.\n- Lập luận chặt chẽ, dẫn chứng thuyết phục.`).join("\n\n");
    }

    mockMatrixData.push({
      skill: "Viết",
      content: vietContent,
      nb: { count: v_nb > 0 ? "1*" : 0, points: parseFloat(v_nb.toFixed(2)), text: v_nb > 0 ? "- Nhận biết yêu cầu kiểu bài." : "" },
      th: { count: v_th > 0 ? "1*" : 0, points: parseFloat(v_th.toFixed(2)), text: v_th > 0 ? "- Hiểu và triển khai được cấu trúc bài." : "" },
      vd: { count: v_vd > 0 ? "1*" : 0, points: parseFloat(v_vd.toFixed(2)), text: v_vd > 0 ? "- Vận dụng lí lẽ và dẫn chứng." : "" },
      vdc: { count: v_vdc > 0 ? "1*" : 0, points: parseFloat(v_vdc.toFixed(2)), text: v_vdc > 0 ? "- Đánh giá được giá trị nội dung và nghệ thuật của tác phẩm." : "" },
      isGrouped: true,
      groupedText: vietGroupedText,
    });

    return {
      success: true,
      data: {
        matrixData: mockMatrixData,
        specData: JSON.parse(JSON.stringify(mockMatrixData))
      }
    };
  } catch (err: any) {
    const errorMsg = formatApiErrorMessage(err, aiSettings?.model || "gemini-2.5-flash");
    return { success: false, error: errorMsg };
  }
}

export async function serverGenerateExams(
  config: any, 
  matrixData: any[], 
  aiSettings?: any, 
  sgkWorks: string[] = [], 
  questionBankText: string = "", 
  similarityRate: number = 100,
  customPrompt?: string
) {
  const check = validateApiKey(aiSettings?.apiKey);
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  const model = aiSettings.model || "gemini-2.5-flash";

  try {
    const ai = new GoogleGenAI({ apiKey: check.key });

    const parseCount = (val: any) => {
      if (typeof val === 'string' && val.includes("*")) return 1;
      if (val === "*") return 1;
      const num = parseInt(val);
      return isNaN(num) ? 0 : num;
    };

    const docHieuRow = matrixData.find(r => r.skill === "Đọc hiểu");
    const dhPoints = docHieuRow ? (docHieuRow.nb.points || 0) + (docHieuRow.th.points || 0) + (docHieuRow.vd.points || 0) + (docHieuRow.vdc.points || 0) : 6;
    
    const vietRow = matrixData.find(r => r.skill === "Viết");
    const vietPoints = vietRow ? (vietRow.nb.points || 0) + (vietRow.th.points || 0) + (vietRow.vd.points || 0) + (vietRow.vdc.points || 0) : 4;
    const finalVietPoints = vietPoints > 0 ? vietPoints : (10 - dhPoints);

    let docHieuRuleText = `QUY TẮC BẮT BUỘC CHO NGỮ LIỆU ĐỌC HIỂU:
1. Mỗi đề thi có chính xác 1 ngữ liệu Đọc hiểu dài khoảng 250 đến 350 chữ phù hợp thể loại và lứa tuổi học sinh.
2. BẮT BUỘC ở cuối ngữ liệu đọc hiểu PHẢI CÓ nguồn dẫn chứng rõ ràng gồm: tên tác phẩm/nội dung trích dẫn và tên tác giả (đặt trong dấu ngoặc đơn ở cuối đoạn trích, ví dụ: "(Trích 'Tên tác phẩm', Tác giả: Tên tác giả)" hoặc "(Theo 'Tên bài viết/cuốn sách', Tác giả: Tên tác giả)"). Tuyệt đối không được bỏ quên tên tác phẩm và tên tác giả.
3. Với mỗi ngữ liệu, ra đúng:` + (docHieuRow ? ` ${parseCount(docHieuRow.nb?.count)} câu Nhận biết, ${parseCount(docHieuRow.th?.count)} câu Thông hiểu, ${parseCount(docHieuRow.vd?.count)} câu Vận dụng, ${parseCount(docHieuRow.vdc?.count)} câu Vận dụng cao. Tổng điểm phần Đọc hiểu: ${dhPoints} điểm.` : ` các câu hỏi theo ma trận.`);

    let vietCountsText = `BẮT BUỘC mỗi đề thi có chính xác 1 câu phần Viết. Tổng điểm phần Viết: ${finalVietPoints} điểm.`;

    const effectiveCustomPrompt = (customPrompt || config?.customPrompt || "").trim();
    let customPromptInstruction = "";
    if (effectiveCustomPrompt.length > 0) {
      customPromptInstruction = `
=== YÊU CẦU ĐẶC BIỆT CỦA NGƯỜI DÙNG (ƯU TIÊN HÀNG ĐẦU) ===
Người dùng có yêu cầu riêng biệt cho đề thi như sau:
"${effectiveCustomPrompt}"
=> BẠN BẮT BUỘC PHẢI ƯU TIÊN THỰC HIỆN ĐÚNG THEO YÊU CẦU TRÊN (ví dụ: tạo ngữ liệu đúng thể loại thơ 5 chữ, thơ lục bát, truyện ngắn, chủ đề cụ thể, hoặc các dạng câu hỏi được yêu cầu), đồng thời vẫn đảm bảo cấu trúc ma trận và dẫn chứng tên tác phẩm, tác giả ở cuối ngữ liệu.
`;
    }

    let questionBankInstruction = "";
    if (questionBankText && questionBankText.trim().length > 30) {
      // Limit text length to prevent context explosion
      const trimmedQBank = questionBankText.slice(0, 6000);
      if (similarityRate === 100) {
        questionBankInstruction = `\nQUAN TRỌNG: Người dùng đã cung cấp "Ngân hàng câu hỏi". Bạn hãy lấy trực tiếp ngữ liệu, câu hỏi và đáp án từ Ngân hàng câu hỏi này để lắp ghép thành 2 Đề thi hoàn chỉnh khớp với ma trận ở trên (vẫn đảm bảo cuối ngữ liệu có dẫn chứng tên tác phẩm, tác giả).\n\nNGÂN HÀNG CÂU HỎI:\n${trimmedQBank}\n`;
      } else {
        questionBankInstruction = `\nQUAN TRỌNG: Người dùng đã cung cấp "Ngân hàng câu hỏi". Bạn lấy khoảng ${similarityRate}% câu hỏi từ Ngân hàng này và tự sáng tác thêm ${100 - similarityRate}% câu hỏi mới để tạo thành 2 Đề thi hoàn chỉnh khớp ma trận (đảm bảo cuối mỗi ngữ liệu có dẫn chứng tên tác phẩm, tác giả).\n\nNGÂN HÀNG CÂU HỎI:\n${trimmedQBank}\n`;
      }
    } else {
      questionBankInstruction = `\nKhông có Ngân hàng câu hỏi sẵn. Hãy tự chọn ngữ liệu văn học ngoài SGK phù hợp để tạo ra 2 đề thi mới hoàn toàn (nhớ ghi rõ dẫn chứng tên tác phẩm, tác giả ở cuối mỗi ngữ liệu).\n`;
    }

    const promptText = `
Bạn là một giáo viên chuyên gia ra đề thi Ngữ Văn THCS. Hãy tạo "2 ĐỀ KIỂM TRA" ĐỘC LẬP (Đề 1 và Đề 2) dựa trên cấu trúc Ma trận sau.

${customPromptInstruction}

=== PHẦN ĐỌC HIỂU ===
Yêu cầu Ma trận:
${docHieuRow ? JSON.stringify(docHieuRow) : 'Không có'}
${docHieuRuleText}

=== PHẦN VIẾT ===
Yêu cầu:
${vietRow ? JSON.stringify(vietRow) : 'Không có'}
${vietCountsText}

${questionBankInstruction}

=== YÊU CẦU ĐẦU RA ===
- Trả về DUY NHẤT một mảng JSON chứa 2 đề thi (Đề 1 và Đề 2) theo đúng cấu trúc sau (KHÔNG dùng markdown code block, KHÔNG có chữ nào khác ngoài JSON).
- Viết đáp án và dàn ý cô đọng, súc tích, đóng đầy đủ các dấu ngoặc vuông ] và ngoặc nhọn } để JSON luôn hợp lệ:
[
  {
    "docHieu": {
      "points": ${dhPoints},
      "text": "Nội dung văn bản/đoạn trích của đề 1...\\n\\n(Trích 'Tên tác phẩm/bài viết', Tác giả: Họ và Tên tác giả)",
      "questions": [
        { "points": 1.0, "question": "Câu hỏi 1...", "answer": "Đáp án chi tiết...", "level": "Nhận biết" }
      ]
    },
    "viet": {
      "points": ${finalVietPoints},
      "questions": [
        { "question": "Đề bài viết của đề 1...", "answer": "Dàn ý chi tiết/Hướng dẫn chấm...", "level": "Vận dụng cao" }
      ]
    }
  },
  {
    "docHieu": {
      "points": ${dhPoints},
      "text": "Nội dung văn bản/đoạn trích của đề 2...\\n\\n(Trích 'Tên tác phẩm/bài viết', Tác giả: Họ và Tên tác giả)",
      "questions": [
        { "points": 1.0, "question": "Câu hỏi 1...", "answer": "Đáp án chi tiết...", "level": "Nhận biết" }
      ]
    },
    "viet": {
      "points": ${finalVietPoints},
      "questions": [
        { "question": "Đề bài viết của đề 2...", "answer": "Dàn ý chi tiết/Hướng dẫn chấm...", "level": "Vận dụng cao" }
      ]
    }
  }
]
`;

    const response = await ai.models.generateContent({
      model: model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      }
    });

    const parsedRaw = cleanAndParseJSON(response.text || "[]");
    const normalized = normalizeExams(parsedRaw, dhPoints, finalVietPoints);

    if (!normalized || normalized.length === 0) {
      throw new Error("Không thể trích xuất cấu trúc đề thi từ kết quả AI. Vui lòng ấn tạo lại.");
    }

    return { success: true, data: normalized };
  } catch (err: any) {
    console.error("Gemini exams generation error:", err);
    const errorMsg = formatApiErrorMessage(err, model);
    return { success: false, error: errorMsg };
  }
}

export async function serverGenerateReviewQuestions(
  config: any, 
  matrixData: any[], 
  aiSettings?: any, 
  sgkWorks: string[] = [], 
  useSgkForWriting: boolean = true,
  customPrompt?: string
) {
  const check = validateApiKey(aiSettings?.apiKey);
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  const model = aiSettings.model || "gemini-2.5-flash";

  try {
    const ai = new GoogleGenAI({ apiKey: check.key });

    const docHieuRow = matrixData.find(r => r.skill === "Đọc hiểu");
    const vietRow = matrixData.find(r => r.skill === "Viết");

    const parseCount = (val: any) => {
      if (typeof val === 'string' && val.includes("*")) return 1;
      if (val === "*") return 1;
      const num = parseInt(val);
      return isNaN(num) ? 0 : num;
    };

    let docHieuCountsText = "";
    if (docHieuRow) {
      const nb = parseCount(docHieuRow.nb?.count);
      const th = parseCount(docHieuRow.th?.count);
      const vd = parseCount(docHieuRow.vd?.count);
      const vdc = parseCount(docHieuRow.vdc?.count);
      
      const totalNb = nb * 3;
      const totalTh = th * 3;
      const totalVd = vd * 3;
      const totalVdc = vdc * 3;
      
      docHieuCountsText = `Tạo chính xác 3 ngữ liệu Đọc hiểu. Với MỖI ngữ liệu, ra đúng số lượng câu hỏi giống ma trận gốc: ${nb} câu Nhận biết, ${th} câu Thông hiểu, ${vd} câu Vận dụng, ${vdc} câu Vận dụng cao (Tổng cộng cả 3 ngữ liệu là: ${totalNb} NB, ${totalTh} TH, ${totalVd} VD, ${totalVdc} VDC).`;
    }

    let vietCountsText = "Tạo chính xác 3 đề bài ôn tập khác nhau cho phần Viết kèm dàn ý/hướng dẫn chấm chi tiết.";

    const effectiveCustomPrompt = (customPrompt || config?.customPrompt || "").trim();
    let customPromptInstruction = "";
    if (effectiveCustomPrompt.length > 0) {
      customPromptInstruction = `
=== YÊU CẦU ĐẶC BIỆT CỦA NGƯỜI DÙNG (ƯU TIÊN HÀNG ĐẦU) ===
Người dùng có yêu cầu riêng biệt cho câu hỏi ôn tập:
"${effectiveCustomPrompt}"
=> BẠN BẮT BUỘC PHẢI ƯU TIÊN THỰC HIỆN ĐÚNG THEO YÊU CẦU TRÊN (ví dụ: tạo thơ 5 chữ, thơ lục bát, truyện ngắn, chủ đề cụ thể, hoặc định hướng câu hỏi riêng của người dùng), đồng thời vẫn đảm bảo có dẫn chứng tên tác phẩm, tác giả ở cuối mỗi ngữ liệu.
`;
    }

    const docHieuTopics = config?.selectedLessons?.filter((l: string) => l.toLowerCase().includes("thể loại") || l.toLowerCase().includes("đọc hiểu") || l.toLowerCase().includes("thơ") || l.toLowerCase().includes("truyện") || l.toLowerCase().includes("kí") || l.toLowerCase().includes("văn bản")) || [];
    const vietTopics = config?.selectedLessons?.filter((l: string) => l.toLowerCase().includes("viết") || l.toLowerCase().includes("biểu cảm") || l.toLowerCase().includes("tự sự") || l.toLowerCase().includes("nghị luận")) || [];

    const promptText = `
Bạn là một giáo viên chuyên gia ra đề thi môn Ngữ Văn cấp THCS. Hãy tạo "Ngân hàng câu hỏi ôn tập" dựa trên cấu trúc Ma trận sau.

${customPromptInstruction}

=== PHẦN ĐỌC HIỂU ===
- Yêu cầu Ma trận: ${docHieuRow ? JSON.stringify(docHieuRow) : 'Không có'}
- Thể loại kiến thức: ${docHieuTopics.length > 0 ? docHieuTopics.join(', ') : 'Văn bản văn học'}

Quy tắc cho phần Đọc hiểu:
1. Cung cấp ĐÚNG 3 ngữ liệu (văn bản/đoạn trích/thơ) HOÀN TOÀN NGOÀI SGK (độ dài vừa phải khoảng 250-350 chữ/đoạn) phù hợp thể loại đã chọn.
2. BẮT BUỘC ở cuối mỗi ngữ liệu đọc hiểu PHẢI CÓ nguồn dẫn chứng rõ ràng gồm: tên tác phẩm/nội dung trích dẫn và tên tác giả (Ví dụ: "(Trích 'Tên tác phẩm', Tác giả: Họ và Tên tác giả)" hoặc "(Theo 'Tên bài viết', Tác giả: ...)").
3. ${docHieuCountsText}

=== PHẦN VIẾT ===
- Yêu cầu Ma trận: ${vietRow ? JSON.stringify(vietRow) : 'Không có'}
- Thể loại/Kiểu bài: ${vietTopics.length > 0 ? vietTopics.join(', ') : 'Nghị luận'}

Quy tắc cho phần Viết:
1. ${vietCountsText}
${useSgkForWriting ? 
  `2. QUAN TRỌNG: Hãy sử dụng trực tiếp các tác phẩm trong SGK sau đây làm đề tài cho các đề Viết: ${sgkWorks.length > 0 ? sgkWorks.join(', ') : 'Một tác phẩm tiêu biểu trong SGK'}.` : 
  `2. QUAN TRỌNG: Các đề Viết KHÔNG gắn với tác phẩm trong SGK. Hãy lấy một tác phẩm/vấn đề cụ thể ngoài SGK phù hợp thể loại.`
}

=== YÊU CẦU ĐẦU RA ===
Trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng cấu trúc sau (KHÔNG dùng markdown code block, KHÔNG có text thừa):
{
  "docHieu": [
    {
      "text": "Nội dung văn bản ngoài SGK 1...\\n\\n(Trích 'Tên tác phẩm/bài viết', Tác giả: Họ và Tên tác giả)",
      "questions": [
        { "question": "Nội dung câu hỏi...", "answer": "Đáp án chi tiết...", "level": "Nhận biết" }
      ]
    }
  ],
  "viet": [
    { "question": "Nội dung đề bài viết 1...", "answer": "Dàn ý chi tiết/Hướng dẫn chấm cho đề 1..." }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      }
    });

    const parsedData = cleanAndParseJSON(response.text || "{}");
    
    // Normalize docHieu and viet arrays
    let docHieuList = Array.isArray(parsedData.docHieu) ? parsedData.docHieu : (parsedData.reading || []);
    let vietList = Array.isArray(parsedData.viet) ? parsedData.viet : (parsedData.writing || []);

    return { 
      success: true, 
      data: {
        docHieu: docHieuList,
        viet: vietList
      }
    };
  } catch (err: any) {
    console.error("Gemini review questions generation error:", err);
    const errorMsg = formatApiErrorMessage(err, model);
    return { success: false, error: errorMsg };
  }
}
