"use client";

import { useState, useEffect } from "react";
import styles from "@/app/page.module.css";
import { X } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, model: string) => void;
}

export default function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem("geminiApiKey") || "";
      const savedModel = localStorage.getItem("geminiModel") || "gemini-2.5-flash";
      setApiKey(savedKey);
      setModel(savedModel);
    }
  }, [isOpen]);

  const handleSave = () => {
    const cleanedKey = (apiKey || "").trim();
    if (/[^\x00-\x7F]/.test(cleanedKey)) {
      alert("Cảnh báo: API Key đang chứa ký tự tiếng Việt có dấu (do bộ gõ Unikey/EVKey gây ra). Vui lòng tắt bộ gõ tiếng Việt hoặc chuyển sang chế độ gõ tiếng Anh trước khi dán API Key!");
      return;
    }
    localStorage.setItem("geminiApiKey", cleanedKey);
    localStorage.setItem("geminiModel", model);
    onSave(cleanedKey, model);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", 
      alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "white", padding: "2rem", borderRadius: "1rem", 
        width: "90%", maxWidth: "500px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        position: "relative"
      }}>
        <button 
          onClick={onClose} 
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-500)" }}
        >
          <X size={24} />
        </button>
        
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1.5rem", color: "var(--text-900)" }}>
          Cài đặt AI
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Gemini API Key</label>
            <input 
              type="password" 
              className={styles.input} 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Nhập API Key của bạn..."
            />
            <p style={{ fontSize: "0.875rem", color: "var(--text-400)", marginTop: "0.5rem" }}>
              API Key sẽ chỉ được lưu trên trình duyệt của bạn (localStorage).
            </p>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Mô hình AI (Model)</label>
            <select 
              className={styles.select} 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyên dùng - Nhanh & Ổn định)</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
              <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
              <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Suy luận chuyên sâu)</option>
              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Tốc độ cao)</option>
            </select>
          </div>

          <button 
            className={`${styles.btn} ${styles.btnPrimary}`} 
            onClick={handleSave}
            style={{ marginTop: "1rem" }}
          >
            Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
}
