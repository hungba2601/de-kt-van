"use client";

import React, { useState } from 'react';
import { Bot, Download, RefreshCcw, User, Users } from 'lucide-react';
import { generateReviewQuestions } from '@/lib/actions';

interface ReviewQuestionsProps {
  config: any;
  matrixData: any[];
  aiSettings: { apiKey: string, model: string };
  questions: any;
  setQuestions: (questions: any) => void;
  sgkWorks?: string[];
  onApiError?: (error: any, retryAction: () => void) => void;
}

export default function ReviewQuestions({ 
  config, 
  matrixData,
  aiSettings,
  questions,
  setQuestions,
  sgkWorks = [],
  onApiError
}: ReviewQuestionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [useSgkForWriting, setUseSgkForWriting] = useState(true);
  const [customPrompt, setCustomPrompt] = useState(config?.customPrompt || "");
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    const runAction = async () => {
      setIsGenerating(true);
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
        const result = await generateReviewQuestions(config, matrixData, currentSettings, sgkWorks, useSgkForWriting, customPrompt);
        if (!result.success || !result.data) {
          throw new Error(result.error || "Không thể tạo câu hỏi ôn tập.");
        }
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setQuestions(result.data), 300); // Small delay to show 100%
      } catch (error: any) {
        clearInterval(interval);
        setProgress(0);
        if (onApiError) {
          onApiError(error, runAction);
        } else {
          console.error("Lỗi khi sinh câu hỏi ôn tập:", error);
          alert("Có lỗi xảy ra khi tạo câu hỏi: " + (error.message || error.toString()));
        }
      } finally {
        setIsGenerating(false);
      }
    };
    runAction();
  };

  const handleExportTeacher = async () => {
    try {
      const { exportReviewForTeacherToDocx } = await import("@/lib/exportReview");
      const blob = await exportReviewForTeacherToDocx(config, questions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CauHoiOnTap_GiaoVien_${config.subject}_${config.grade}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Lỗi khi xuất file giáo viên:", error);
      alert("Có lỗi xảy ra khi xuất file: " + (error.message || error.toString()));
    }
  };

  const handleExportStudent = async () => {
    try {
      const { exportReviewForStudentToDocx } = await import("@/lib/exportReview");
      const blob = await exportReviewForStudentToDocx(config, questions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CauHoiOnTap_HocSinh_${config.subject}_${config.grade}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Lỗi khi xuất file học sinh:", error);
      alert("Có lỗi xảy ra khi xuất file: " + (error.message || error.toString()));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--surface-50)', padding: '1.5rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-800)', margin: 0 }}>Cấu hình Câu hỏi Ôn tập</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-700)', fontWeight: 500, fontSize: '0.95rem' }}>
            <input 
              type="checkbox" 
              checked={useSgkForWriting}
              onChange={(e) => setUseSgkForWriting(e.target.checked)}
              style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-600)' }}
            />
            Sử dụng tác phẩm SGK cho phần Viết
          </label>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#4338ca', fontSize: '0.95rem' }}>
            Yêu cầu riêng biệt cho AI tạo Câu hỏi Ôn tập (Tùy chọn):
          </label>
          <textarea
            rows={2}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ví dụ: Tạo ngữ liệu thơ 5 chữ hoặc thơ lục bát về tình yêu quê hương; Các câu hỏi tiếng Việt tập trung vào điệp từ, ẩn dụ; Đề viết phân tích hình ảnh người lính..."
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

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              padding: '0.875rem 2rem',
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-md)',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            {isGenerating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCcw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  Đang tạo câu hỏi (AI)... {Math.floor(progress)}%
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'white', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            ) : (
              <>
                <Bot size={24} />
                {questions ? "Tạo Lại Câu Hỏi Ôn Tập" : "Tạo Câu Hỏi Ôn Tập (AI)"}
              </>
            )}
          </button>
        </div>
      </div>

      {questions && (
        <div style={{ background: 'white', borderRadius: 'var(--border-radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-100)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-100)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-700)' }}>Ngân Hàng Câu Hỏi Ôn Tập</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleExportTeacher}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#059669' }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#10b981' }}
              >
                <Users size={18} />
                Xuất Bản Giáo Viên
              </button>
              
              <button
                onClick={handleExportStudent}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#7c3aed' }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#8b5cf6' }}
              >
                <User size={18} />
                Xuất Bản Học Sinh
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {questions.docHieu && questions.docHieu.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-800)', marginBottom: '1rem' }}>
                  I. ĐỌC HIỂU ({questions.docHieu.reduce((acc: number, textGroup: any) => acc + (textGroup.questions?.length || 0), 0)} câu)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {questions.docHieu.map((textGroup: any, textIdx: number) => {
                    if (!textGroup.questions || textGroup.questions.length === 0) return null;
                    return (
                      <div key={textIdx} style={{ padding: '1.5rem', background: 'var(--surface-50)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-100)' }}>
                        <div style={{ padding: '1rem', background: 'white', borderRadius: 'var(--border-radius-md)', marginBottom: '1.5rem', fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-600)', borderLeft: '3px solid var(--primary-300)', whiteSpace: 'pre-wrap' }}>
                          {textGroup.text}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {textGroup.questions.map((q: any, i: number) => (
                            <div key={i} style={{ padding: '1rem', background: 'white', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-50)' }}>
                              <p style={{ fontWeight: 600, color: 'var(--text-800)', marginBottom: '0.5rem' }}>Câu {i + 1}: <span style={{ fontWeight: 400 }}>{q.question}</span></p>
                              <p style={{ fontSize: '0.875rem', color: 'var(--primary-600)', fontWeight: 500, marginBottom: '0.25rem' }}>Mức độ: {q.level}</p>
                              <p style={{ fontSize: '0.95rem', color: 'var(--text-600)' }}>Đáp án: {q.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {questions.viet && questions.viet.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-800)', marginBottom: '1rem', marginTop: '1rem' }}>II. VIẾT ({questions.viet.length} đề)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {questions.viet.map((q: any, i: number) => (
                    <div key={i} style={{ padding: '1rem', background: 'var(--surface-50)', borderRadius: 'var(--border-radius-md)' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-800)', marginBottom: '0.5rem' }}>Đề {i + 1}: <span style={{ fontWeight: 400 }}>{q.question.replace(/^Đề (bài )?(ôn tập )?\d+:\s*/i, '')}</span></p>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-600)', whiteSpace: 'pre-wrap' }}>Hướng dẫn: {q.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
