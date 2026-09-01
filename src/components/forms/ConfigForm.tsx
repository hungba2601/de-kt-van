"use client";

import styles from "@/app/page.module.css";
import { curriculumData } from "@/lib/curriculumData";

interface ConfigFormProps {
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}

export default function ConfigForm({ config, setConfig }: ConfigFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleRatioChange = (level: string, value: string) => {
    setConfig((prev: any) => ({
      ...prev,
      ratio: {
        ...prev.ratio,
        [level]: parseInt(value) || 0
      }
    }));
  };

  const lessonsData = curriculumData[config.grade] || [];

  const handleLessonToggle = (lesson: string) => {
    setConfig((prev: any) => {
      const current = prev.selectedLessons || [];
      if (current.includes(lesson)) {
        return { ...prev, selectedLessons: current.filter((l: string) => l !== lesson) };
      } else {
        return { ...prev, selectedLessons: [...current, lesson] };
      }
    });
  };

  return (
    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Tên trường học</label>
        <input
          type="text"
          className={styles.input}
          name="schoolName"
          value={config.schoolName}
          onChange={handleChange}
          placeholder="VD: Trường THCS An Nhơn"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Môn học</label>
        <select className={styles.select} name="subject" value={config.subject} onChange={handleChange}>
          <option value="Ngữ Văn">Ngữ Văn</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Khối lớp</label>
        <select className={styles.select} name="grade" value={config.grade} onChange={handleChange}>
          <option value="6">Khối 6</option>
          <option value="7">Khối 7</option>
          <option value="8">Khối 8</option>
          <option value="9">Khối 9</option>
        </select>
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.label}>Hình thức kiểm tra</label>
        <input
          type="text"
          className={styles.input}
          value="100% Tự luận"
          disabled
          style={{ background: "var(--surface-100)", cursor: "not-allowed", color: "var(--text-700)" }}
        />
      </div>

      <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
        <label className={styles.label} style={{ color: "#1e40af", fontWeight: "bold" }}>Nội dung kiến thức</label>
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "1rem", 
          maxHeight: "250px", 
          overflowY: "auto", 
          padding: "1rem", 
          border: "1px solid var(--surface-300)", 
          borderRadius: "var(--border-radius-md)",
          background: "white"
        }}>
          {lessonsData.length === 0 ? (
            <div style={{ color: "var(--text-400)", fontStyle: "italic", textAlign: "center", padding: "2rem 0" }}>
              Không có dữ liệu cho khối lớp này.
            </div>
          ) : (
            lessonsData.map((group: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--primary-700)', borderBottom: '1px solid var(--surface-200)', paddingBottom: '0.25rem', whiteSpace: 'pre-wrap' }}>
                  {group.category}
                </div>
                {group.items.map((lesson: string, i: number) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "var(--text-700)", marginLeft: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={config.selectedLessons?.includes(lesson) || false}
                      onChange={() => handleLessonToggle(lesson)}
                      style={{ width: "1.2rem", height: "1.2rem", accentColor: "var(--primary-600)" }}
                    />
                    {lesson}
                  </label>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
        <label className={styles.label}>Tỉ lệ điểm chuẩn (%)</label>
        <div className={styles.ratioGroup}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-500)" }}>Nhận biết</span>
            <input
              type="number"
              className={`${styles.input} ${styles.ratioInput}`}
              value={config.ratio.nb}
              onChange={(e) => handleRatioChange('nb', e.target.value)}
            />
          </div>
          <span style={{ fontWeight: "bold", color: "var(--text-300)" }}>-</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-500)" }}>Thông hiểu</span>
            <input
              type="number"
              className={`${styles.input} ${styles.ratioInput}`}
              value={config.ratio.th}
              onChange={(e) => handleRatioChange('th', e.target.value)}
            />
          </div>
          <span style={{ fontWeight: "bold", color: "var(--text-300)" }}>-</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-500)" }}>Vận dụng</span>
            <input
              type="number"
              className={`${styles.input} ${styles.ratioInput}`}
              value={config.ratio.vd}
              onChange={(e) => handleRatioChange('vd', e.target.value)}
            />
          </div>
          <span style={{ fontWeight: "bold", color: "var(--text-300)" }}>-</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-500)" }}>Vận dụng cao</span>
            <input
              type="number"
              className={`${styles.input} ${styles.ratioInput}`}
              value={config.ratio.vdc}
              onChange={(e) => handleRatioChange('vdc', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
        <label className={styles.label}>Tỉ lệ kĩ năng (%)</label>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ color: "var(--text-700)", fontWeight: "500" }}>Đọc hiểu và THTV:</span>
          <input
            type="number"
            className={styles.input}
            style={{ width: "80px" }}
            value={config.skillRatio?.docHieu ?? 60}
            onChange={(e) => {
              const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
              setConfig((prev: any) => ({
                ...prev,
                skillRatio: {
                  docHieu: val,
                  viet: Math.max(0, 100 - val)
                }
              }));
            }}
          />
          <span style={{ color: "var(--text-700)", fontWeight: "500" }}>Viết:</span>
          <input
            type="number"
            className={styles.input}
            style={{ width: "80px" }}
            value={config.skillRatio?.viet ?? 40}
            onChange={(e) => {
              const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
              setConfig((prev: any) => ({
                ...prev,
                skillRatio: {
                  docHieu: Math.max(0, 100 - val),
                  viet: val
                }
              }));
            }}
          />
        </div>
      </div>

      <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
        <label className={styles.label} style={{ color: "#4338ca", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>Yêu cầu / Gợi ý thêm cho AI (Tùy chọn)</span>
          <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "var(--text-500)" }}>(AI sẽ ưu tiên tạo theo yêu cầu này)</span>
        </label>
        <textarea
          className={styles.input}
          name="customPrompt"
          rows={3}
          value={config.customPrompt || ""}
          onChange={(e) => setConfig((prev: any) => ({ ...prev, customPrompt: e.target.value }))}
          placeholder="Ví dụ: Ngữ liệu đọc hiểu là bài thơ 5 chữ hoặc thơ lục bát về tình cảm gia đình, tình mẫu tử; Câu hỏi tiếng Việt tập trung vào biện pháp tu từ so sánh và ẩn dụ; Đề viết về lòng biết ơn..."
          style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--border-radius-md)", border: "1px solid var(--border-300)", fontSize: "0.95rem", resize: "vertical", fontFamily: "inherit" }}
        />
        
        {/* Quick Suggestion Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-500)", alignSelf: "center" }}>Gợi ý nhanh:</span>
          {[
            "Thơ lục bát",
            "Thơ 5 chữ",
            "Thơ 4 chữ",
            "Thơ tự do",
            "Truyện ngắn",
            "Chủ đề: Tình mẹ / Gia đình",
            "Chủ đề: Quê hương đất nước",
            "Biện pháp tu từ: So sánh & Nhân hóa",
            "Nghị luận về lòng biết ơn"
          ].map((tag, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                const current = config.customPrompt || "";
                const separator = current.trim().length > 0 ? "; " : "";
                if (!current.includes(tag)) {
                  setConfig((prev: any) => ({ ...prev, customPrompt: current + separator + tag }));
                }
              }}
              style={{
                fontSize: "0.78rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "1rem",
                background: "#f0f4ff",
                color: "#3730a3",
                border: "1px solid #c7d2fe",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "#e0e7ff"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "#f0f4ff"; }}
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
