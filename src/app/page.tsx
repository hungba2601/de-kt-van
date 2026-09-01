"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Bot, Download, FileCheck, BookOpen, Settings } from "lucide-react";
import styles from "./page.module.css";
import { curriculumData, sgkWorksData } from "@/lib/curriculumData";
import ConfigForm from "@/components/forms/ConfigForm";
import MatrixGrid from "@/components/grids/MatrixGrid";
import SpecGrid from "@/components/grids/SpecGrid";
import { generateSpec } from "@/lib/actions";
import ExamViewer from "@/components/grids/ExamViewer";
import SettingsModal from "@/components/forms/SettingsModal";
import ReviewQuestions from "@/components/grids/ReviewQuestions";

const tabs = [
  { id: 1, label: "Tải file & Cấu hình", icon: <FileText size={20} /> },
  { id: 2, label: "Ma trận & Đặc tả", icon: <Bot size={20} /> },
  { id: 3, label: "Câu hỏi ôn tập", icon: <BookOpen size={20} /> },
  { id: 4, label: "Tạo Đề Thi", icon: <FileCheck size={20} /> },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState({ apiKey: "", model: "gemini-2.5-flash" });
  
  // Load settings on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("geminiApiKey") || "";
    const savedModel = localStorage.getItem("geminiModel") || "gemini-2.5-flash";
    setAiSettings({ apiKey: savedKey, model: savedModel });
  }, []);
  
  // State for form data
  const [config, setConfig] = useState({
    schoolName: "",
    subject: "Ngữ Văn",
    grade: "9",
    selectedLessons: [] as string[],
    ratio: { nb: 35, th: 35, vd: 20, vdc: 10 },
    skillRatio: { docHieu: 60, viet: 40 },
    customPrompt: ""
  });

  // State for AI generated data
  const [tableData, setTableData] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [reviewQuestions, setReviewQuestions] = useState<any>(null);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);

  // Error Handling & Retry
  const pendingActionRef = useRef<(() => void) | null>(null);

  const handleApiError = (error: any, retryAction: () => void) => {
    const errorMsg = error?.message || error?.toString() || "";
    if (errorMsg.includes("GEMINI_API_ERROR") || errorMsg.includes("API Key")) {
      pendingActionRef.current = retryAction;
      setIsSettingsOpen(true);
      alert(errorMsg.replace("GEMINI_API_ERROR: ", ""));
    } else {
      console.error(error);
      alert("Có lỗi xảy ra: " + errorMsg);
    }
  };

  const handleSaveSettings = (apiKey: string, model: string) => {
    setAiSettings({ apiKey, model });
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setTimeout(() => {
        action();
      }, 100);
    }
  };

  const handleGenerate = async () => {
    const runAction = async () => {
      setIsProcessing(true);
      try {
        const currentSettings = {
          apiKey: localStorage.getItem("geminiApiKey") || "",
          model: localStorage.getItem("geminiModel") || "gemini-2.5-flash"
        };
        const result = await generateSpec(config, currentSettings);
        if (!result.success || !result.data) {
          throw new Error(result.error || "Không thể tạo ma trận.");
        }
        setTableData(result.data.matrixData);
        setActiveTab(2);
      } catch (error: any) {
        handleApiError(error, runAction);
      } finally {
        setIsProcessing(false);
      }
    };
    runAction();
  };

  const handleExport = async () => {
    try {
      const { exportToDocx } = await import("@/lib/export");
      const blob = await exportToDocx(config, tableData, tableData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ma_Tran_Dac_Ta_${config.subject}_${config.grade}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Lỗi khi xuất file:", error);
      alert("Có lỗi xảy ra khi xuất file: " + (error.message || error.toString()) + "\n\nStack: " + (error.stack || ""));
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.header} style={{ position: "relative", width: "100%" }}>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          style={{ position: "absolute", top: "1rem", right: "2rem", background: "none", border: "none", cursor: "pointer", color: "#5b21b6", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}
        >
          <Settings size={28} />
          <span style={{ fontSize: "0.75rem", fontWeight: "500" }}>Cài đặt API</span>
        </button>
        <h1 className={`${styles.title} text-gradient`}>CÔNG CỤ TẠO MA TRẬN - ĐỀ KIỂM TRA MÔN VĂN</h1>
        <p className={styles.description}>
          Hệ thống tự động phân tích và tạo Ma trận & Đặc tả đề kiểm tra môn Văn (100% Tự luận)
        </p>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveSettings} 
      />

      <div className={`${styles.container} glass-panel`}>
        {/* Tabs */}
        <div className={styles.stepper} style={{ gap: "0" }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.step} ${
                activeTab === tab.id ? styles.stepActive : ""
              } ${activeTab > tab.id ? styles.stepCompleted : ""}`}
              style={{ cursor: "pointer", flex: 1, justifyContent: "center", borderRadius: tab.id === 1 ? "var(--border-radius-lg) 0 0 var(--border-radius-lg)" : "0 var(--border-radius-lg) var(--border-radius-lg) 0", borderRight: tab.id === 1 ? "1px solid var(--border-100)" : "none" }}
            >
              <div className={styles.stepIcon}>{tab.icon}</div>
              <span className={styles.stepLabel}>{tab.label}</span>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {activeTab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <ConfigForm config={config} setConfig={setConfig} />

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}
                >
                  {isProcessing ? "AI Đang xử lý..." : "Tạo Ma Trận & Đặc Tả"}
                  {!isProcessing && <Bot size={24} />}
                </button>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {tableData.length > 0 ? (
                <>
                  <MatrixGrid config={config} data={tableData} setData={setTableData} />
                  <SpecGrid config={config} data={tableData} setData={setTableData} />
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <button 
                      className={`${styles.btn} ${styles.btnPrimary}`} 
                      onClick={handleExport}
                      style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}
                    >
                      Xuất File Word (.docx)
                      <Download size={24} />
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.uploadArea} style={{ border: 'none', background: 'transparent' }}>
                  <Bot className={styles.uploadIcon} size={64} />
                  <h3 className={styles.uploadText}>Chưa có dữ liệu</h3>
                  <p className={styles.uploadSubtext}>
                    Vui lòng quay lại tab "Tải file & Cấu hình" và bấm "Tạo Ma Trận & Đặc Tả".
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {tableData.length > 0 ? (
                <ReviewQuestions 
                  config={config}
                  matrixData={tableData}
                  aiSettings={aiSettings}
                  questions={reviewQuestions}
                  setQuestions={setReviewQuestions}
                  sgkWorks={sgkWorksData[config.grade] || []}
                  onApiError={handleApiError}
                />
              ) : (
                <div className={styles.uploadArea} style={{ border: 'none', background: 'transparent' }}>
                  <Bot className={styles.uploadIcon} size={64} />
                  <h3 className={styles.uploadText}>Chưa có dữ liệu</h3>
                  <p className={styles.uploadSubtext}>
                    Vui lòng quay lại tab "Tải file & Cấu hình" và bấm "Tạo Ma Trận & Đặc Tả".
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <ExamViewer 
                config={config} 
                matrixData={tableData}
                exams={exams}
                setExams={setExams}
                isGeneratingExam={isGeneratingExam}
                setIsGeneratingExam={setIsGeneratingExam}
                aiSettings={aiSettings}
                sgkWorks={sgkWorksData[config.grade] || []}
                onApiError={handleApiError}
              />
            </div>
          )}
        </div>
      </div>
      
      <div style={{ textAlign: 'center', padding: '1.5rem', marginTop: '1rem', fontWeight: 700, color: '#065f46', letterSpacing: '0.05em', fontSize: '0.95rem' }}>
        Made by Nguyễn Thị Hồng Gấm
      </div>
    </main>
  );
}
