import React, { useState, useEffect } from 'react';
import HeaderNav from './components/HeaderNav';
import FormEditor from './components/FormEditor';
import DocumentPreview from './components/DocumentPreview';
import ImportPartsModal from './components/ImportPartsModal';
import { initialFormData, getBlankFormData } from './data/sampleData';

const LOCAL_STORAGE_KEY = 'OVERHAUL_REPORT_FORM_DATA';

export default function App() {
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load saved data:", e);
    }
    // Default to the user's PDF sample data so they immediately see their template working!
    return initialFormData;
  });

  const [viewMode, setViewMode] = useState('split'); // 'form' | 'preview' | 'split'
  const [toastMessage, setToastMessage] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Show temporary toast message
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auto-save debounce or manual save
  const handleSave = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
      setLastSaved(new Date().toLocaleTimeString('th-TH'));
      showToast('บันทึกข้อมูลสำเร็จเรียบร้อยแล้ว');
    } catch (e) {
      alert('ไม่สามารถบันทึกข้อมูลได้: ' + e.message);
    }
  };

  // Load sample data
  const handleLoadSample = () => {
    if (window.confirm('คุณต้องการโหลดข้อมูลตัวอย่างตามเอกสาร PDF (3 หน้า 35 รายการ) หรือไม่? ข้อมูลที่แก้ไขอยู่จะถูกแทนที่')) {
      setFormData(initialFormData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialFormData));
      showToast('โหลดข้อมูลตัวอย่างจาก PDF เรียบร้อยแล้ว');
    }
  };

  // Reset to blank form
  const handleReset = () => {
    if (window.confirm('คุณต้องการล้างข้อมูลเพื่อเริ่มกรอกฟอร์มใหม่ทั้งหมดหรือไม่?')) {
      const blank = getBlankFormData();
      setFormData(blank);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(blank));
      showToast('ล้างข้อมูลเรียบร้อยแล้ว');
    }
  };

  // Export JSON file
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const docNo = formData.header.repairDocNo || 'overhaul-data';
    a.download = `ใบบันทึกOverhaul_${docNo}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์สำรอง JSON เรียบร้อย');
  };

  // Import JSON file
  const handleImportJSON = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.header && parsed.items) {
          setFormData(parsed);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
          showToast('นำเข้าข้อมูลจากไฟล์ JSON สำเร็จ');
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้องสำหรับระบบนี้');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Handle imported parts from CSV/Excel
  const handleImportParts = (importedItems, mode) => {
    setFormData(prev => {
      let updatedItems = [];
      if (mode === 'replace') {
        updatedItems = importedItems.map((item, idx) => ({
          ...item,
          id: idx + 1
        }));
      } else {
        // Append mode: filter out trailing empty rows first
        const existingNonEmpty = prev.items.filter(it => it.name && it.name.trim() !== '');
        const newBatch = importedItems.map((item, idx) => ({
          ...item,
          id: existingNonEmpty.length + idx + 1
        }));
        updatedItems = [...existingNonEmpty, ...newBatch];
      }

      const nextFormData = {
        ...prev,
        items: updatedItems
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextFormData));
      return nextFormData;
    });

    showToast(`นำเข้ารายการอะไหล่สำเร็จ (${importedItems.length} รายการ)`);
  };

  // Trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const totalAmount = formData.items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
  const itemCount = formData.items.filter(it => it.name && it.name.trim() !== '').length;

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification no-print">
          <span className="toast-check">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <HeaderNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        onPrint={handlePrint}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
        onSave={handleSave}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        lastSaved={lastSaved}
        itemCount={itemCount}
        totalAmount={totalAmount}
      />

      {/* Main Content Area */}
      <main className={`main-workspace view-${viewMode}`}>
        {/* Form Editor Pane */}
        {(viewMode === 'form' || viewMode === 'split') && (
          <div className="editor-pane no-print">
            <div className="pane-header">
              <span className="pane-title">📝 แบบฟอร์มกรอกข้อมูล (Data Entry)</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-danger"
                onClick={handleReset}
                title="ล้างข้อมูลในฟอร์ม"
              >
                ล้างข้อมูล
              </button>
            </div>
            <FormEditor
              formData={formData}
              setFormData={setFormData}
              onReset={handleReset}
              onOpenImportModal={() => setIsImportModalOpen(true)}
            />
          </div>
        )}

        {/* Document Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="preview-pane">
            <div className="pane-header no-print">
              <span className="pane-title">📄 ตัวอย่างเอกสาร 3 หน้าสำหรับพิมพ์ (A4 แนวนอน)</span>
              <div className="pane-header-actions">
                <span className="text-xs text-muted">
                  * หากต้องการพิมพ์ ให้กดปุ่ม "พิมพ์ / ส่งออก PDF" ด้านบน
                </span>
              </div>
            </div>
            <div className="preview-scroll-area">
              <DocumentPreview formData={formData} />
            </div>
          </div>
        )}
      </main>

      {/* Import Parts Modal */}
      <ImportPartsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportItems={handleImportParts}
      />
    </div>
  );
}
