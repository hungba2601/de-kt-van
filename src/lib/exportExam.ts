import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export const exportExamToDocx = async (config: any, examData: any, examNumber: number) => {
  const children: any[] = [];

  const docHieuPoints = examData?.docHieu?.points ?? 6;
  const vietPoints = examData?.viet?.points ?? 4;
  const docHieuText = examData?.docHieu?.text || "";
  const docHieuQuestions = examData?.docHieu?.questions || [];
  const vietQuestions = examData?.viet?.questions || [];

  // --- Header ---
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `SỞ GIÁO DỤC VÀ ĐÀO TẠO` })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `TRƯỜNG: ${config.schoolName || '................'}`, bold: true })] }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `ĐỀ KIỂM TRA MÔN ${config.subject.toUpperCase()}`, bold: true, size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `LỚP: ${config.grade}`, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `ĐỀ SỐ: ${examNumber}`, bold: true })] }),
    new Paragraph({ text: "", spacing: { after: 400 } })
  );

  // --- Đề thi ---
  children.push(
    new Paragraph({
      text: `PHẦN ĐỀ THI`,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 }
    }),
    
    // I. Đọc hiểu
    new Paragraph({ children: [new TextRun({ text: `I. ĐỌC HIỂU (${docHieuPoints} điểm)`, bold: true })], spacing: { before: 200, after: 100 } }),
    new Paragraph({ text: `Đọc đoạn trích sau và trả lời các câu hỏi:`, spacing: { after: 100 } })
  );

  // Đọc hiểu text
  docHieuText.split('\n').forEach((line: string) => {
    children.push(new Paragraph({ children: [new TextRun({ text: line, italics: true })] }));
  });
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Đọc hiểu questions
  docHieuQuestions.forEach((q: any, idx: number) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Câu ${idx + 1} (${q.points || 1} điểm): `, bold: true }),
          new TextRun({ text: q.question || "" })
        ],
        spacing: { after: 100 }
      })
    );
  });

  // II. Viết
  children.push(
    new Paragraph({ children: [new TextRun({ text: `II. VIẾT (${vietPoints} điểm)`, bold: true })], spacing: { before: 400, after: 200 } })
  );

  vietQuestions.forEach((q: any) => {
    children.push(
      new Paragraph({ text: q.question || "", spacing: { after: 100 } })
    );
  });

  children.push(new Paragraph({ text: "", spacing: { after: 800 } }));
  children.push(new Paragraph({ text: "------------------ HẾT ------------------", alignment: AlignmentType.CENTER, spacing: { after: 800 } }));

  // --- Đáp án và Hướng dẫn chấm ---
  children.push(
    new Paragraph({ text: "", pageBreakBefore: true }),
    new Paragraph({
      text: `HƯỚNG DẪN CHẤM VÀ THANG ĐIỂM ĐỀ SỐ ${examNumber}`,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 }
    }),
    
    // I. Đọc hiểu
    new Paragraph({ children: [new TextRun({ text: `I. ĐỌC HIỂU (${docHieuPoints} điểm)`, bold: true })], spacing: { before: 200, after: 200 } })
  );

  docHieuQuestions.forEach((q: any, idx: number) => {
    children.push(
      new Paragraph({ children: [new TextRun({ text: `Câu ${idx + 1} (${q.points || 1} điểm):`, bold: true })] }),
      new Paragraph({ text: `- Nội dung đáp án: ${q.answer || ""}` }),
      new Paragraph({ text: `- Mức độ: ${q.level || "Nhận biết"}` }),
      new Paragraph({ text: "", spacing: { after: 100 } })
    );
  });

  // II. Viết
  children.push(
    new Paragraph({ children: [new TextRun({ text: `II. VIẾT (${vietPoints} điểm)`, bold: true })], spacing: { before: 200, after: 200 } })
  );

  vietQuestions.forEach((q: any, idx: number) => {
    children.push(
      new Paragraph({ children: [new TextRun({ text: `Câu ${idx + 1}:`, bold: true })] })
    );
    (q.answer || "").split('\n').forEach((line: string) => {
      children.push(new Paragraph({ text: line }));
    });
    children.push(
      new Paragraph({ text: `- Mức độ: ${q.level || "Vận dụng cao"}` }),
      new Paragraph({ text: "", spacing: { after: 100 } })
    );
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  return Packer.toBlob(doc);
};
