"use client";

import styles from "@/app/page.module.css";

interface SpecGridProps {
  config: any;
  data: any[];
  setData: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function SpecGrid({ config, data, setData }: SpecGridProps) {
  const handleTextChange = (rowIndex: number, level: string, value: string) => {
    const newData = [...data];
    newData[rowIndex][level].text = value;
    setData(newData);
  };

  const toggleGroupWriting = (rowIndex: number) => {
    const newData = [...data];
    newData[rowIndex].isGrouped = !newData[rowIndex].isGrouped;
    setData(newData);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>Bảng Đặc Tả Đề Kiểm Tra</h2>
        <button 
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => {
            localStorage.setItem("savedSpec", JSON.stringify(data));
            alert("Đã lưu bảng đặc tả thành công!");
          }}
          style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
        >
          Lưu Đặc Tả
        </button>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: "10%" }}>Kĩ năng</th>
              <th rowSpan={2} style={{ width: "15%" }}>Nội dung / Đơn vị kiến thức</th>
              <th rowSpan={2} style={{ width: "45%" }}>Mức độ đánh giá</th>
              <th colSpan={4} style={{ width: "30%", textAlign: "center" }}>Số câu hỏi theo mức độ nhận thức</th>
            </tr>
            <tr>
              <th style={{ textAlign: "center" }}>Nhận biết</th>
              <th style={{ textAlign: "center" }}>Thông hiểu</th>
              <th style={{ textAlign: "center" }}>Vận dụng</th>
              <th style={{ textAlign: "center" }}>Vận dụng cao</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text-500)" }}>
                  Chưa có dữ liệu. Vui lòng quay lại bước trước để AI phân tích.
                </td>
              </tr>
            ) : (
              (function() {
                const skillRowSpans: Record<number, number> = {};
                let currentSkill = "";
                let currentStartIndex = -1;
                
                data.forEach((row, index) => {
                  if (row.skill !== currentSkill) {
                    currentSkill = row.skill;
                    currentStartIndex = index;
                    skillRowSpans[currentStartIndex] = 1;
                  } else {
                    skillRowSpans[currentStartIndex]++;
                    skillRowSpans[index] = 0;
                  }
                });

                return data.map((row, index) => {
                  const isWriting = row.skill.toLowerCase().includes("viết");
                  
                  return (
                    <tr key={index}>
                      {skillRowSpans[index] > 0 && (
                        <td rowSpan={skillRowSpans[index]} style={{ fontWeight: "500", verticalAlign: "middle", textAlign: "center" }}>
                          {row.skill}
                        </td>
                      )}
                      <td style={{ whiteSpace: "pre-wrap" }}>
                        {row.content}
                        {isWriting && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <label className={styles.checkbox}>
                              <input 
                                type="checkbox" 
                                checked={row.isGrouped} 
                                onChange={() => toggleGroupWriting(index)} 
                              />
                              <span style={{ fontSize: "0.75rem", fontWeight: "normal" }}>Gộp chung mức độ (1*)</span>
                            </label>
                          </div>
                        )}
                      </td>
                    
                    <td style={{ padding: "0.5rem" }}>
                      {row.isGrouped ? (
                        <textarea
                          className={styles.textarea}
                          value={row.groupedText || ""}
                          onChange={(e) => {
                            const newData = [...data];
                            newData[index].groupedText = e.target.value;
                            setData(newData);
                          }}
                          placeholder="Nhập tiêu chí đánh giá chung cho kĩ năng Viết..."
                          style={{ minHeight: "150px" }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <textarea
                            className={styles.textarea}
                            value={row.nb.text}
                            onChange={(e) => handleTextChange(index, "nb", e.target.value)}
                            placeholder="- Nhận biết được..."
                            style={{ minHeight: '60px' }}
                          />
                          <textarea
                            className={styles.textarea}
                            value={row.th.text}
                            onChange={(e) => handleTextChange(index, "th", e.target.value)}
                            placeholder="- Hiểu được..."
                            style={{ minHeight: '60px' }}
                          />
                          <textarea
                            className={styles.textarea}
                            value={row.vd.text}
                            onChange={(e) => handleTextChange(index, "vd", e.target.value)}
                            placeholder="- Vận dụng để..."
                            style={{ minHeight: '60px' }}
                          />
                          <textarea
                            className={styles.textarea}
                            value={row.vdc.text}
                            onChange={(e) => handleTextChange(index, "vdc", e.target.value)}
                            placeholder="- Đánh giá, sáng tạo..."
                            style={{ minHeight: '60px' }}
                          />
                        </div>
                      )}
                    </td>
                    
                    {row.isGrouped ? (
                      <td colSpan={4} style={{ textAlign: "center", verticalAlign: "middle", fontWeight: "bold" }}>
                        1*
                      </td>
                    ) : (
                      <>
                        <td style={{ textAlign: "center", verticalAlign: "middle", fontWeight: "bold" }}>
                          {row.nb.count > 0 ? `${row.nb.count} TL` : ''}
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle", fontWeight: "bold" }}>
                          {row.th.count > 0 ? `${row.th.count} TL` : ''}
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle", fontWeight: "bold" }}>
                          {row.vd.count > 0 ? `${row.vd.count} TL` : ''}
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle", fontWeight: "bold" }}>
                          {row.vdc.count > 0 ? `${row.vdc.count} TL` : ''}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            })()
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
