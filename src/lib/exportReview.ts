import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export const exportReviewForTeacherToDocx = async (config: any, questionsData: any) => {
  const children: any[] = [];

  // --- Header ---
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `SỞ GIÁO DỤC VÀ ĐÀO TẠO` })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `TRƯỜNG: ${config.schoolName || '................'}`, bold: true })] }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NGÂN HÀNG CÂU HỎI ÔN TẬP MÔN ${config.subject.toUpperCase()}`, bold: true, size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `LỚP: ${config.grade}`, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(BẢN DÀNH CHO GIÁO VIÊN)`, bold: true, italics: true })] }),
    new Paragraph({ text: "", spacing: { after: 400 } })
  );

  // I. Đọc hiểu
  if (questionsData.docHieu && questionsData.docHieu.length > 0) {
    const totalQuestions = questionsData.docHieu.reduce((acc: number, textGroup: any) => acc + (textGroup.questions?.length || 0), 0);
    children.push(
      new Paragraph({ children: [new TextRun({ text: `I. ĐỌC HIỂU (${totalQuestions} câu)`, bold: true })], spacing: { before: 200, after: 200 } })
    );

    questionsData.docHieu.forEach((textGroup: any) => {
      if (!textGroup.questions || textGroup.questions.length === 0) return;
      
      // Reading text
      textGroup.text.split('\n').forEach((line: string) => {
        children.push(new Paragraph({ children: [new TextRun({ text: line, italics: true })] }));
      });
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

      // Questions for this text
      textGroup.questions.forEach((q: any, idx: number) => {
        children.push(
          new Paragraph({ children: [new TextRun({ text: `Câu ${idx + 1}: `, bold: true }), new TextRun({ text: q.question })] }),
          new Paragraph({ children: [new TextRun({ text: `- Mức độ: ${q.level}`, italics: true })] }),
          new Paragraph({ text: `- Đáp án: ${q.answer}` }),
          new Paragraph({ text: "", spacing: { after: 150 } })
        );
      });
    });
  }

  // II. Viết
  if (questionsData.viet && questionsData.viet.length > 0) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: `II. VIẾT (${questionsData.viet.length} đề)`, bold: true })], spacing: { before: 300, after: 200 } })
    );

    questionsData.viet.forEach((q: any, idx: number) => {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `Đề ${idx + 1}: ${q.question.replace(/^Đề (bài )?(ôn tập )?\d+:\s*/i, '')}`, bold: true })] })
      );
      q.answer.split('\n').forEach((line: string) => {
        children.push(new Paragraph({ text: line }));
      });
      children.push(new Paragraph({ text: "", spacing: { after: 150 } }));
    });
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  return Packer.toBlob(doc);
};

export const exportReviewForStudentToDocx = async (config: any, questionsData: any) => {
  const children: any[] = [];

  // --- Header ---
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `SỞ GIÁO DỤC VÀ ĐÀO TẠO` })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `TRƯỜNG: ${config.schoolName || '................'}`, bold: true })] }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NGÂN HÀNG CÂU HỎI ÔN TẬP MÔN ${config.subject.toUpperCase()}`, bold: true, size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `LỚP: ${config.grade}`, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(BẢN DÀNH CHO HỌC SINH)`, bold: true, italics: true })] }),
    new Paragraph({ text: "", spacing: { after: 400 } })
  );

  // I. Đọc hiểu
  if (questionsData.docHieu && questionsData.docHieu.length > 0) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: `I. ĐỌC HIỂU`, bold: true })], spacing: { before: 200, after: 200 } })
    );

    questionsData.docHieu.forEach((textGroup: any) => {
      if (!textGroup.questions || textGroup.questions.length === 0) return;

      // Reading text
      textGroup.text.split('\n').forEach((line: string) => {
        children.push(new Paragraph({ children: [new TextRun({ text: line, italics: true })] }));
      });
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

      // Questions for this text
      textGroup.questions.forEach((q: any, idx: number) => {
        children.push(
          new Paragraph({ children: [new TextRun({ text: `Câu ${idx + 1}: `, bold: true }), new TextRun({ text: q.question })] }),
          new Paragraph({ text: "", spacing: { after: 150 } })
        );
      });
    });
  }

  // II. Viết
  if (questionsData.viet && questionsData.viet.length > 0) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: `II. VIẾT`, bold: true })], spacing: { before: 300, after: 200 } })
    );

    questionsData.viet.forEach((q: any, idx: number) => {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `Đề ${idx + 1}: ${q.question.replace(/^Đề (bài )?(ôn tập )?\d+:\s*/i, '')}`, bold: true })] }),
        new Paragraph({ text: "", spacing: { after: 150 } })
      );
    });
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  return Packer.toBlob(doc);
};
