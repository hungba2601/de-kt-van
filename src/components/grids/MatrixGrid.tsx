"use client";

import styles from "@/app/page.module.css";

interface MatrixGridProps {
  config: any;
  data: any[];
  setData: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function MatrixGrid({ config, data, setData }: MatrixGridProps) {
  // Helper to calculate total percentage
  const calculateTotalPoints = () => {
    let total = 0;
    data.forEach(row => {
      total += (row.nb.points || 0) + (row.th.points || 0) + (row.vd.points || 0) + (row.vdc.points || 0);
    });
    return total;
  };

  const parseCount = (val: any) => {
    if (typeof val === 'string' && val.includes("*")) return 0;
    if (val === "*") return 0; // backward compatibility
    const num = parseInt(val);
    return isNaN(num) ? 0 : num;
  };

  const calculateTotalQuestions = () => {
    return data.reduce((acc, row) => {
      const hasStar = [row.nb.count, row.th.count, row.vd.count, row.vdc.count].some(val => typeof val === 'string' && val.includes('*'));
      return acc + (hasStar ? 1 : (parseCount(row.nb.count) + parseCount(row.th.count) + parseCount(row.vd.count) + parseCount(row.vdc.count)));
    }, 0);
  };

  const handleCellChange = (rowIndex: number, level: string, field: string, value: string) => {
    const newData = [...data];
    if (field === "count") {
      newData[rowIndex][level][field] = value;
      if (newData[rowIndex].skill !== "Viết") {
        newData[rowIndex][level].points = parseCount(value); // 1 point per question
      }
    } else {
      newData[rowIndex][level][field] = parseFloat(value) || 0;
    }
    setData(newData);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>Bảng Ma Trận Đề Kiểm Tra</h2>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              localStorage.setItem("savedMatrix", JSON.stringify(data));
              alert("Đã lưu ma trận thành công!");
            }}
            style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
          >
            Lưu Ma Trận
          </button>
          <div style={{ background: "var(--primary-50)", padding: "0.5rem 1rem", borderRadius: "var(--border-radius-md)", color: "var(--primary-700)", fontWeight: "500" }}>
            Tổng điểm: {calculateTotalPoints().toFixed(1)} / 10.0
          </div>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: "15%" }}>Kĩ năng</th>
              <th rowSpan={2} style={{ width: "35%" }}>Nội dung</th>
              <th colSpan={4}>Mức độ nhận thức</th>
              <th rowSpan={2} style={{ width: "5%" }}>Tổng số câu</th>
              <th rowSpan={2} style={{ width: "5%" }}>Tổng % điểm</th>
            </tr>
            <tr>
              <th style={{ width: "10%" }}>Nhận biết</th>
              <th style={{ width: "10%" }}>Thông hiểu</th>
              <th style={{ width: "10%" }}>Vận dụng</th>
              <th style={{ width: "10%" }}>Vận dụng cao</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-400)" }}>
                  Chưa có dữ liệu. Vui lòng thiết lập ở mục Cấu Hình và tạo ma trận.
                </td>
              </tr>
            ) : (
              (() => {
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
                  const hasStar = [row.nb.count, row.th.count, row.vd.count, row.vdc.count].some(val => typeof val === 'string' && val.includes('*'));
                  const totalRowQuestions = hasStar ? 1 : (parseCount(row.nb.count) + parseCount(row.th.count) + parseCount(row.vd.count) + parseCount(row.vdc.count));
                  const totalRowPoints = (row.nb.points || 0) + (row.th.points || 0) + (row.vd.points || 0) + (row.vdc.points || 0);
                  
                  return (
                    <tr key={index}>
                      {skillRowSpans[index] > 0 && (
                        <td rowSpan={skillRowSpans[index]} style={{ fontWeight: "bold", textAlign: "center", verticalAlign: "middle" }}>
                          {row.skill}
                        </td>
                      )}
                      <td style={{ padding: "0.5rem", verticalAlign: "top" }}>
                        <textarea
                          className={styles.textarea}
                          value={row.content || ""}
                          onChange={(e) => {
                            const newData = [...data];
                            newData[index].content = e.target.value;
                            setData(newData);
                          }}
                          style={{ minHeight: "100px", width: "100%", whiteSpace: "pre-wrap" }}
                        />
                      </td>
                    
                    {/* Nhận biết */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <input 
                          type="text" 
                          className={styles.input} 
                          style={{ padding: "0.25rem 0.5rem", width: "100%", textAlign: "center" }}
                          placeholder="Số câu"
                          value={row.nb.count || ""}
                          onChange={(e) => handleCellChange(index, "nb", "count", e.target.value)}
                        />
                      </div>
                    </td>
                    
                    {/* Thông hiểu */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <input 
                          type="text" 
                          className={styles.input} 
                          style={{ padding: "0.25rem 0.5rem", width: "100%", textAlign: "center" }}
                          placeholder="Số câu"
                          value={row.th.count || ""}
                          onChange={(e) => handleCellChange(index, "th", "count", e.target.value)}
                        />
                      </div>
                    </td>
                    
                    {/* Vận dụng */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <input 
                          type="text" 
                          className={styles.input} 
                          style={{ padding: "0.25rem 0.5rem", width: "100%", textAlign: "center" }}
                          placeholder="Số câu"
                          value={row.vd.count || ""}
                          onChange={(e) => handleCellChange(index, "vd", "count", e.target.value)}
                        />
                      </div>
                    </td>
                    
                    {/* Vận dụng cao */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <input 
                          type="text" 
                          className={styles.input} 
                          style={{ padding: "0.25rem 0.5rem", width: "100%", textAlign: "center" }}
                          placeholder="Số câu"
                          value={row.vdc.count || ""}
                          onChange={(e) => handleCellChange(index, "vdc", "count", e.target.value)}
                        />
                      </div>
                    </td>
                    
                    <td style={{ textAlign: "center", verticalAlign: "middle", fontWeight: "600", fontSize: "1.125rem" }}>
                      {totalRowQuestions}
                    </td>
                    <td style={{ textAlign: "center", verticalAlign: "middle", fontWeight: "600", fontSize: "1.125rem", color: "var(--primary-600)" }}>
                      {(totalRowPoints / 10 * 100).toFixed(0)}%
                    </td>
                  </tr>
                );
              })
            })()
          )}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: "bold" }}>
                <td colSpan={2} style={{ textAlign: "center", verticalAlign: "middle" }}>Tổng cộng:</td>
                <td style={{ textAlign: "center", padding: "0.5rem" }}>
                  {data.reduce((acc, row) => acc + parseCount(row.nb.count), 0)} TL <br/>
                  <span style={{ fontSize: "0.875rem", fontWeight: "normal" }}>({data.reduce((acc, row) => acc + (row.nb.points || 0), 0)}đ - {(data.reduce((acc, row) => acc + (row.nb.points || 0), 0) / 10 * 100).toFixed(0)}%)</span>
                </td>
                <td style={{ textAlign: "center", padding: "0.5rem" }}>
                  {data.reduce((acc, row) => acc + parseCount(row.th.count), 0)} TL <br/>
                  <span style={{ fontSize: "0.875rem", fontWeight: "normal" }}>({data.reduce((acc, row) => acc + (row.th.points || 0), 0)}đ - {(data.reduce((acc, row) => acc + (row.th.points || 0), 0) / 10 * 100).toFixed(0)}%)</span>
                </td>
                <td style={{ textAlign: "center", padding: "0.5rem" }}>
                  {data.reduce((acc, row) => acc + parseCount(row.vd.count), 0)} TL <br/>
                  <span style={{ fontSize: "0.875rem", fontWeight: "normal" }}>({data.reduce((acc, row) => acc + (row.vd.points || 0), 0)}đ - {(data.reduce((acc, row) => acc + (row.vd.points || 0), 0) / 10 * 100).toFixed(0)}%)</span>
                </td>
                <td style={{ textAlign: "center", padding: "0.5rem" }}>
                  {data.reduce((acc, row) => acc + parseCount(row.vdc.count) + (row.skill === "Viết" ? 1 : 0), 0)} TL <br/>
                  <span style={{ fontSize: "0.875rem", fontWeight: "normal" }}>({data.reduce((acc, row) => acc + (row.vdc.points || 0), 0)}đ - {(data.reduce((acc, row) => acc + (row.vdc.points || 0), 0) / 10 * 100).toFixed(0)}%)</span>
                </td>
                <td style={{ textAlign: "center", verticalAlign: "middle" }}>{calculateTotalQuestions()} TL</td>
                <td style={{ textAlign: "center", verticalAlign: "middle" }}>{(calculateTotalPoints() / 10 * 100).toFixed(0)}%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
