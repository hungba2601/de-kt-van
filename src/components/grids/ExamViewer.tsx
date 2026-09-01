import React, { useState } from 'react';
import { Bot, Download, RefreshCcw, Upload, FileText } from 'lucide-react';
import { generateExams, extractRawTextFromFile } from '@/lib/actions';

interface ExamViewerProps {
  config: any;
  matrixData: any[];
  exams: any[];
  setExams: (exams: any[]) => void;
  isGeneratingExam: boolean;
  setIsGeneratingExam: (isGenerating: boolean) => void;
  aiSettings: { apiKey: string, model: string };
  sgkWorks?: string[];
  onApiError?: (error: any, retryAction: () => void) => void;
}

export default function ExamViewer({ 
  config, 
  matrixData, 
  exams, 
  setExams, 
  isGeneratingExam, 
  setIsGeneratingExam,
  aiSettings,
  sgkWorks,
  onApiError
}: ExamViewerProps) {

  const [similarityRate, setSimilarityRate] = useState(100);
  const [questionBankText, setQuestionBankText] = useState("");
  const [questionBankFileName, setQuestionBankFileName] = useState("");
  const [customPrompt, setCustomPrompt] = useState(config?.customPrompt || "");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerateExams = async () => {
    const runAction = async () => {
      setIsGeneratingExam(true);
      setProgress(0);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5;
          return Math.min(95, prev + increment);
        });
      }, 500);

      try {
        const currentSettings = {
          apiKey: localStorage.getItem("geminiApiKey") || "",
          model: localStorage.getItem("geminiModel") || "gemini-2.5-flash"
        };
        const result = await generateExams(config, matrixData, currentSettings, sgkWorks, questionBankText, similarityRate, customPrompt);
        clearInterval(interval);
        
        if (!result.success || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
          setProgress(0);
          throw new Error(result.error || "Không thể tạo đề thi. Vui lòng kiểm tra lại API Key hoặc ấn Tạo lại.");
        }
        
        setProgress(100);
        setExams(result.data);
      } catch (error: any) {
        clearInterval(interval);
        setProgress(0);
        if (onApiError) {
          onApiError(error, runAction);
        } else {
          console.error("Lỗi khi sinh đề thi:", error);
          alert("Có lỗi xảy ra khi tạo đề thi: " + (error.message || error.toString()));
        }
      } finally {
        setIsGeneratingExam(false);
      }
    };
    runAction();
  };

  const handleExport = async (examIndex: number) => {
    try {
      const { exportExamToDocx } = await import("@/lib/exportExam");
      const blob = await exportExamToDocx(config, exams[examIndex], examIndex + 1);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `De_Thi_${examIndex + 1}_${config.subject}_${config.grade}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(`Lỗi khi xuất đề thi ${examIndex + 1}:`, error);
      alert(`Có lỗi xảy ra khi xuất đề thi ${examIndex + 1}: ` + (error.message || error.toString()));
    }
  };

  if (!matrixData || matrixData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface-50)', borderRadius: 'var(--border-radius-lg)' }}>
        <Bot size={64} style={{ color: 'var(--text-300)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-600)', marginBottom: '0.5rem' }}>Chưa có Ma Trận</h3>
        <p style={{ color: 'var(--text-400)' }}>Vui lòng tạo Ma trận & Đặc tả ở tab trước để có thể sinh đề thi.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--surface-50)', padding: '2rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-100)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-800)', margin: 0 }}>Cấu hình Nguồn Câu Hỏi</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500, color: 'var(--text-700)' }}>
              Tải lên Ngân hàng câu hỏi (Tùy chọn)
            </label>
            <div 
              onClick={() => document.getElementById('qbank-upload')?.click()}
              style={{
                border: '2px dashed var(--border-300)',
                borderRadius: 'var(--border-radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'white',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-400)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-300)'}
            >
              <input 
                id="qbank-upload" 
                type="file" 
                accept=".pdf,.docx,.doc" 
                style={{ display: 'none' }} 
                onChange={async (e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setIsUploading(true);
                    try {
                      const file = e.target.files[0];
                      const formData = new FormData();
                      formData.append("file", file);
                      const result = await extractRawTextFromFile(formData);
                      
                      if (result.success && result.text) {
                        setQuestionBankText(result.text);
                        setQuestionBankFileName("Đã tải lên: " + file.name);
                        alert("Đã tải lên & trích xuất nội dung " + file.name + " thành công!");
                      } else {
                        alert("Lỗi khi đọc nội dung file: " + (result.error || "Không có dữ liệu"));
                      }
                    } catch (error) {
                      console.error("Lỗi khi đọc file:", error);
                      alert("Lỗi khi đọc file");
                    }
                    setIsUploading(false);
                  }
                }}
              />
              {isUploading ? (
                <RefreshCcw className="spin" size={32} style={{ color: 'var(--primary-400)', margin: '0 auto 0.5rem' }} />
              ) : questionBankFileName ? (
                <FileText size={32} style={{ color: 'var(--primary-600)', margin: '0 auto 0.5rem' }} />
              ) : (
                <Upload size={32} style={{ color: 'var(--text-400)', margin: '0 auto 0.5rem' }} />
              )}
              
              <p style={{ margin: 0, fontSize: '0.95rem', color: questionBankFileName ? 'var(--primary-700)' : 'var(--text-500)', fontWeight: questionBankFileName ? 600 : 400 }}>
                {questionBankFileName ? questionBankFileName : "Tải lên Ngân hàng câu hỏi (Tùy chọn)"}
              </p>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500, color: 'var(--text-700)' }}>
              Tỉ lệ % giống Ngân hàng câu hỏi
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', padding: '1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-200)' }}>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="10"
                value={similarityRate} 
                onChange={(e) => setSimilarityRate(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--primary-600)' }}
              />
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-700)', minWidth: '4ch', textAlign: 'right' }}>
                {similarityRate}%
              </span>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-500)', lineHeight: 1.5 }}>
              Nếu 100%, đề thi lấy hoàn toàn từ ngân hàng tải lên.<br/>Nếu &lt; 100%, hệ thống sẽ trộn thêm câu hỏi từ bên ngoài (cùng mức độ).
            </p>
          </div>
        </div>

        {/* Custom prompt requirement */}
        <div style={{ borderTop: '1px solid var(--border-200)', paddingTop: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#4338ca', fontSize: '0.95rem' }}>
            Yêu cầu riêng biệt cho AI tạo Đề thi (Tùy chọn):
          </label>
          <textarea
            rows={2}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ví dụ: Ngữ liệu đọc hiểu là bài thơ 5 chữ / thơ lục bát về tình mẹ; Đề văn viết bài văn phân tích vẻ đẹp tình đồng chí; v.v..."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-300)',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-500)', alignSelf: 'center' }}>Gợi ý nhanh:</span>
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
                  const current = customPrompt || "";
                  const sep = current.trim().length > 0 ? "; " : "";
                  if (!current.includes(tag)) {
                    setCustomPrompt(current + sep + tag);
                  }
                }}
                style={{
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '1rem',
                  background: '#f0f4ff',
                  color: '#3730a3',
                  border: '1px solid #c7d2fe',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#e0e7ff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f0f4ff'; }}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleGenerateExams}
          disabled={isGeneratingExam || isUploading}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.125rem',
            background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            cursor: (isGeneratingExam || isUploading) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-md)',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
        >
          {isGeneratingExam ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCcw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                Đang sinh đề thi (AI)... {Math.floor(progress)}%
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'white', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          ) : (
            <>
              <Bot size={24} />
              {exams && exams.length > 0 ? "Tạo Lại Đề Thi" : "Tạo Đề Thi (AI)"}
            </>
          )}
        </button>
      </div>

      {exams && exams.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {exams.map((exam, index) => (
            <div key={index} style={{ background: 'white', borderRadius: 'var(--border-radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-100)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-100)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-700)' }}>Đề số {index + 1}</h2>
                <button
                  onClick={() => handleExport(index)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--success, #10b981)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#059669'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'var(--success, #10b981)'; }}
                >
                  <Download size={18} />
                  Xuất Word
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-800)', marginBottom: '0.75rem' }}>
                    I. ĐỌC HIỂU ({exam?.docHieu?.points ?? 6} điểm)
                  </h3>
                  <div style={{ padding: '1rem', background: 'var(--surface-50)', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-600)', borderLeft: '3px solid var(--primary-300)', whiteSpace: 'pre-wrap' }}>
                    {exam?.docHieu?.text || "Chưa có ngữ liệu"}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {exam?.docHieu?.questions && exam.docHieu.questions.map((q: any, i: number) => (
                      <div key={i} style={{ padding: '0.5rem', background: 'var(--surface-50)', borderRadius: 'var(--border-radius-sm)' }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-700)', margin: 0 }}>
                          Câu {i + 1} ({q.points || 1}đ): <span style={{ fontWeight: 400 }}>{q.question}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-800)', marginBottom: '0.75rem' }}>
                    II. VIẾT ({exam?.viet?.points ?? 4} điểm)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {exam?.viet?.questions && exam.viet.questions.map((q: any, i: number) => (
                      <div key={i} style={{ padding: '0.75rem', background: 'var(--surface-50)', borderRadius: 'var(--border-radius-sm)' }}>
                        <p style={{ color: 'var(--text-700)', whiteSpace: 'pre-wrap', margin: 0, fontWeight: 500 }}>{q.question}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <hr style={{ border: 'none', borderTop: '1px dashed var(--border-200)', margin: '1rem 0' }} />
                
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '1rem' }}>HƯỚNG DẪN CHẤM</h3>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-800)', marginBottom: '0.5rem' }}>I. ĐỌC HIỂU</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-200)' }}>
                      {exam?.docHieu?.questions && exam.docHieu.questions.map((q: any, i: number) => (
                        <div key={i} style={{ fontSize: '0.95rem' }}>
                          <p style={{ fontWeight: 600, color: 'var(--text-700)', marginBottom: '0.25rem' }}>Câu {i + 1} ({q.points || 1} điểm):</p>
                          <p style={{ color: 'var(--text-600)', margin: '0.25rem 0', whiteSpace: 'pre-wrap' }}>- Đáp án: {q.answer}</p>
                          <p style={{ color: 'var(--text-500)', fontStyle: 'italic', fontSize: '0.875rem', margin: 0 }}>- Mức độ: {q.level || 'Nhận biết'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-800)', marginBottom: '0.5rem' }}>II. VIẾT</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-200)' }}>
                      {exam?.viet?.questions && exam.viet.questions.map((q: any, i: number) => (
                        <div key={i} style={{ fontSize: '0.95rem' }}>
                          <p style={{ fontWeight: 600, color: 'var(--text-700)', marginBottom: '0.25rem' }}>Yêu cầu ({exam?.viet?.points ?? 4} điểm):</p>
                          <div style={{ color: 'var(--text-600)', margin: '0.25rem 0', whiteSpace: 'pre-wrap' }}>{q.answer}</div>
                          <p style={{ color: 'var(--text-500)', fontStyle: 'italic', fontSize: '0.875rem', margin: 0 }}>- Mức độ: {q.level || 'Vận dụng cao'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
