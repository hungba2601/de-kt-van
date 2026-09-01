import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel, PageOrientation } from "docx";

export const exportToDocx = async (config: any, matrixData: any[], specData: any[]) => {
  
    const parseCount = (val: any) => {
      if (typeof val === 'string' && val.includes("*")) return 0;
      if (val === "*") return 0;
      const num = parseInt(val);
      return isNaN(num) ? 0 : num;
    };

  const createMatrixTable = () => {
    // Header Row 1
    const headerRow1 = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Kĩ năng", alignment: AlignmentType.CENTER })], rowSpan: 2, verticalAlign: "center" }),
        new TableCell({ children: [new Paragraph({ text: "Nội dung / Đơn vị kiến thức", alignment: AlignmentType.CENTER })], rowSpan: 2, verticalAlign: "center" }),
        new TableCell({ children: [new Paragraph({ text: "Mức độ nhận thức", alignment: AlignmentType.CENTER })], columnSpan: 4 }),
        new TableCell({ children: [new Paragraph({ text: "Tổng số câu", alignment: AlignmentType.CENTER })], rowSpan: 2, verticalAlign: "center" }),
        new TableCell({ children: [new Paragraph({ text: "% Điểm", alignment: AlignmentType.CENTER })], rowSpan: 2, verticalAlign: "center" }),
      ],
    });

    // Header Row 2
    const headerRow2 = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Nhận biết", alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: "Thông hiểu", alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: "Vận dụng", alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: "Vận dụng cao", alignment: AlignmentType.CENTER })] }),
      ],
    });

    const skillRowSpans: Record<number, number> = {};
    let currentSkill = "";
    let currentStartIndex = -1;
    
    matrixData.forEach((row, index) => {
      if (row.skill !== currentSkill) {
        currentSkill = row.skill;
        currentStartIndex = index;
        skillRowSpans[currentStartIndex] = 1;
      } else {
        skillRowSpans[currentStartIndex]++;
        skillRowSpans[index] = 0;
      }
    });


    const dataRows = matrixData.map((row, index) => {
      const hasStar = [row.nb.count, row.th.count, row.vd.count, row.vdc.count].some(val => typeof val === 'string' && val.includes('*'));
      const totalRowQuestions = hasStar ? 1 : (parseCount(row.nb.count) + parseCount(row.th.count) + parseCount(row.vd.count) + parseCount(row.vdc.count));
      const totalRowPoints = (row.nb.points || 0) + (row.th.points || 0) + (row.vd.points || 0) + (row.vdc.points || 0);
      
      const children = [];
      if (skillRowSpans[index] > 0) {
        children.push(new TableCell({ children: [new Paragraph({ text: row.skill, alignment: AlignmentType.CENTER })], rowSpan: skillRowSpans[index], verticalAlign: "center" }));
      }
      
      const formatCell = (count: any, points: any) => {
        if (row.skill === "Viết") {
          return count ? `${count}` : "";
        }
        return parseCount(count) > 0 ? `${count}` : "";
      };

      children.push(
        new TableCell({ children: row.content.split('\n').map((line: any) => new Paragraph(line)) }),
        new TableCell({ children: [new Paragraph({ text: formatCell(row.nb.count, row.nb.points), alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: formatCell(row.th.count, row.th.points), alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: formatCell(row.vd.count, row.vd.points), alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: formatCell(row.vdc.count, row.vdc.points), alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: `${totalRowQuestions}`, alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: `${(totalRowPoints / 10 * 100).toFixed(0)}%`, alignment: AlignmentType.CENTER })] })
      );

      return new TableRow({ children });
    });

    const totalNbCount = matrixData.reduce((acc, row) => acc + parseCount(row.nb.count), 0);
    const totalNbPoints = matrixData.reduce((acc, row) => acc + (row.nb.points || 0), 0);
    const totalThCount = matrixData.reduce((acc, row) => acc + parseCount(row.th.count), 0);
    const totalThPoints = matrixData.reduce((acc, row) => acc + (row.th.points || 0), 0);
    const totalVdCount = matrixData.reduce((acc, row) => acc + parseCount(row.vd.count), 0);
    const totalVdPoints = matrixData.reduce((acc, row) => acc + (row.vd.points || 0), 0);
    const totalVdcCount = matrixData.reduce((acc, row) => acc + parseCount(row.vdc.count), 0);
    const totalVdcPoints = matrixData.reduce((acc, row) => acc + (row.vdc.points || 0), 0);
    
    const totalQuestions = matrixData.reduce((acc, row) => {
      const hasStar = [row.nb.count, row.th.count, row.vd.count, row.vdc.count].some(val => typeof val === 'string' && val.includes('*'));
      return acc + (hasStar ? 1 : (parseCount(row.nb.count) + parseCount(row.th.count) + parseCount(row.vd.count) + parseCount(row.vdc.count)));
    }, 0);
    const totalPoints = totalNbPoints + totalThPoints + totalVdPoints + totalVdcPoints;

    const footerRow = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Tổng cộng", alignment: AlignmentType.CENTER })], columnSpan: 2, verticalAlign: "center" }),
        new TableCell({ children: [
          new Paragraph({ text: `${totalNbCount} TL`, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `(${totalNbPoints}đ - ${(totalNbPoints / 10 * 100).toFixed(0)}%)`, alignment: AlignmentType.CENTER })
        ]}),
        new TableCell({ children: [
          new Paragraph({ text: `${totalThCount} TL`, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `(${totalThPoints}đ - ${(totalThPoints / 10 * 100).toFixed(0)}%)`, alignment: AlignmentType.CENTER })
        ]}),
        new TableCell({ children: [
          new Paragraph({ text: `${totalVdCount} TL`, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `(${totalVdPoints}đ - ${(totalVdPoints / 10 * 100).toFixed(0)}%)`, alignment: AlignmentType.CENTER })
        ]}),
        new TableCell({ children: [
          new Paragraph({ text: `${totalVdcCount} TL`, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `(${totalVdcPoints}đ - ${(totalVdcPoints / 10 * 100).toFixed(0)}%)`, alignment: AlignmentType.CENTER })
        ]}),
        new TableCell({ children: [new Paragraph({ text: `${totalQuestions} TL`, alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
        new TableCell({ children: [new Paragraph({ text: `${(totalPoints / 10 * 100).toFixed(0)}%`, alignment: AlignmentType.CENTER })], verticalAlign: "center" })
      ]
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow1, headerRow2, ...dataRows, footerRow],
    });
  };

  const createSpecTable = () => {
    const headerRow1 = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Kĩ năng", alignment: AlignmentType.CENTER })], rowSpan: 2, verticalAlign: "center" }),
        new TableCell({ children: [new Paragraph({ text: "Nội dung / Đơn vị kiến thức", alignment: AlignmentType.CENTER })], rowSpan: 2, verticalAlign: "center" }),
        new TableCell({ children: [new Paragraph({ text: "Mức độ đánh giá", alignment: AlignmentType.CENTER })], rowSpan: 2, verticalAlign: "center" }),
        new TableCell({ children: [new Paragraph({ text: "Số câu hỏi theo mức độ nhận thức", alignment: AlignmentType.CENTER })], columnSpan: 4 }),
      ],
    });

    const headerRow2 = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Nhận biết", alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: "Thông hiểu", alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: "Vận dụng", alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: "Vận dụng cao", alignment: AlignmentType.CENTER })] }),
      ],
    });

    const skillRowSpans: Record<number, number> = {};
    let currentSkill = "";
    let currentStartIndex = -1;
    
    specData.forEach((row, index) => {
      if (row.skill !== currentSkill) {
        currentSkill = row.skill;
        currentStartIndex = index;
        skillRowSpans[currentStartIndex] = 1;
      } else {
        skillRowSpans[currentStartIndex]++;
        skillRowSpans[index] = 0;
      }
    });

    const dataRows = specData.map((row, index) => {
      const children = [];
      if (skillRowSpans[index] > 0) {
        children.push(new TableCell({ children: [new Paragraph({ text: row.skill, alignment: AlignmentType.CENTER })], rowSpan: skillRowSpans[index], verticalAlign: "center" }));
      }
      
      if (row.isGrouped) {
        children.push(
          new TableCell({ children: (row.content || "").split('\n').map((line: any) => new Paragraph(line)) }),
          new TableCell({ children: (row.groupedText || "").split('\n').map((line: any) => new Paragraph(line)) }),
          new TableCell({ children: [new Paragraph({ text: "1TL*", alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: "1TL*", alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: "1TL*", alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: "1TL*", alignment: AlignmentType.CENTER })] })
        );
      } else {
        const createCriteriaParagraphs = (prefix: string, text: string) => {
          if (!text) return [];
          const lines = text.split('\n');
          return lines.map((line: string, idx: number) => 
            new Paragraph({ text: idx === 0 ? `${prefix}${line}` : line })
          );
        };

        const criteriaParagraphs = [
          ...createCriteriaParagraphs("Nhận biết: ", row.nb.text),
          ...createCriteriaParagraphs("Thông hiểu: ", row.th.text),
          ...createCriteriaParagraphs("Vận dụng: ", row.vd.text),
          ...createCriteriaParagraphs("Vận dụng cao: ", row.vdc.text),
        ];

        const getCountText = (count: any) => {
            if (row.skill === "Viết") return "";
            return count > 0 ? `${count} TL` : "";
        };

        children.push(
          new TableCell({ children: (row.content || "").split('\n').map((line: any) => new Paragraph(line)) }),
          new TableCell({ children: criteriaParagraphs.length > 0 ? criteriaParagraphs : [new Paragraph({ text: "" })] }),
          new TableCell({ children: [new Paragraph({ text: getCountText(row.nb.count), alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: getCountText(row.th.count), alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: getCountText(row.vd.count), alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: row.skill === "Viết" ? "1TL*" : getCountText(row.vdc.count), alignment: AlignmentType.CENTER })] })
        );
      }
      
      return new TableRow({ children });
    });

    const totalNbCount = specData.reduce((acc, row) => acc + parseCount(row.nb.count), 0);
    const totalThCount = specData.reduce((acc, row) => acc + parseCount(row.th.count), 0);
    const totalVdCount = specData.reduce((acc, row) => acc + parseCount(row.vd.count), 0);
    const totalVdcCount = specData.reduce((acc, row) => acc + parseCount(row.vdc.count) + (row.isGrouped ? 1 : 0), 0);

    const totalNbPoints = specData.reduce((acc, row) => acc + (row.nb.points || 0), 0);
    const totalThPoints = specData.reduce((acc, row) => acc + (row.th.points || 0), 0);
    const totalVdPoints = specData.reduce((acc, row) => acc + (row.vd.points || 0), 0);
    const totalVdcPoints = specData.reduce((acc, row) => acc + (row.vdc.points || 0), 0);

    const footerRow1 = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tổng", bold: true })] })], columnSpan: 3 }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalNbCount} TL`, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalThCount} TL`, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalVdCount} TL`, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalVdcCount} TL`, bold: true })] })] }),
      ]
    });

    const footerRow2 = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tỉ lệ %", bold: true })] })], columnSpan: 3 }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${(totalNbPoints / 10 * 100).toFixed(0)}%`, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${(totalThPoints / 10 * 100).toFixed(0)}%`, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${(totalVdPoints / 10 * 100).toFixed(0)}%`, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${(totalVdcPoints / 10 * 100).toFixed(0)}%`, bold: true })] })] }),
      ]
    });

    const footerRow3 = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tỉ lệ chung", bold: true })] })], columnSpan: 3 }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${((totalNbPoints + totalThPoints) / 10 * 100).toFixed(0)}%`, bold: true })] })], columnSpan: 2 }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${((totalVdPoints + totalVdcPoints) / 10 * 100).toFixed(0)}%`, bold: true })] })], columnSpan: 2 }),
      ]
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow1, headerRow2, ...dataRows, footerRow1, footerRow2, footerRow3],
    });
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            }
          }
        },
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `SỞ GIÁO DỤC VÀ ĐÀO TẠO` })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `TRƯỜNG: ${config.schoolName || '................'}`, bold: true })] })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } }
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `BẢN ĐẶC TẢ & MA TRẬN ĐỀ KIỂM TRA`, bold: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `MÔN: ${config.subject?.toUpperCase() || 'VĂN'} - LỚP: ${config.grade || '...'}`, bold: true })] })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } }
                  })
                ]
              })
            ]
          }),
          new Paragraph({ text: "" }), // Empty line
          new Paragraph({
            text: `1. MA TRẬN ĐỀ KIỂM TRA`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({ text: "" }), // Empty line
          createMatrixTable(),
          new Paragraph({ text: "" }), // Empty line
          new Paragraph({ text: "" }), // Empty line
          new Paragraph({
            text: `2. BẢNG ĐẶC TẢ ĐỀ KIỂM TRA`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({ text: "" }), // Empty line
          createSpecTable(),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
};
