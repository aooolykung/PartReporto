import React, { useRef } from 'react';
import {
  IconPrinter,
  IconEye,
  IconEdit,
  IconColumns,
  IconSave,
  IconRefresh,
  IconDownload,
  IconUpload,
  IconWrench,
  IconCheck
} from './Icons';

export default function HeaderNav({
  viewMode,
  setViewMode,
  onPrint,
  onLoadSample,
  onReset,
  onSave,
  onExportJSON,
  onImportJSON,
  onOpenImportModal,
  lastSaved,
  itemCount,
  totalAmount
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
    }
  };

  return (
    <header className="app-header no-print">
      <div className="header-container">
        {/* Brand & Title */}
        <div className="brand-group">
          <div className="brand-icon-wrapper">
            <IconWrench size={22} className="brand-icon" />
          </div>
          <div>
            <div className="brand-badge">MAINTENANCE & OVERHAUL SYSTEM</div>
            <h1 className="brand-title">ใบบันทึกการเปลี่ยนอะไหล่เครื่องจักร</h1>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="mode-switcher-pill">
          <button
            type="button"
            className={`mode-btn ${viewMode === 'form' ? 'active' : ''}`}
            onClick={() => setViewMode('form')}
            title="กรอกข้อมูลลงฟอร์ม"
          >
            <IconEdit size={16} />
            <span>กรอกข้อมูล</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
            title="ดูตัวอย่างเอกสาร 3 หน้าสำหรับพิมพ์"
          >
            <IconEye size={16} />
            <span>พรีวิวเอกสารพิมพ์ (A4)</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="แสดงฟอร์มคู่ขนานกับพรีวิวเอกสาร"
          >
            <IconColumns size={16} />
            <span>ดูคู่ขนาน (Split)</span>
          </button>
        </div>

        {/* Actions & Utilities */}
        <div className="header-actions">
          {/* Quick Stats */}
          <div className="quick-stats-badge" title="จำนวนอะไหล่ และ ยอดรวม">
            <span className="stat-items">{itemCount} รายการ</span>
            <span className="stat-divider">•</span>
            <span className="stat-sum">
              ฿{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Action buttons */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onLoadSample}
            title="โหลดข้อมูลตัวอย่างจากไฟล์ PDF เดิม"
          >
            <IconRefresh size={15} />
            <span className="hide-mobile">ข้อมูลตัวอย่าง (PDF)</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenImportModal}
            title="อัปโหลดรายการอะไหล่จากไฟล์ Excel (.xlsx, .xls) หรือ CSV"
          >
            <IconUpload size={15} />
            <span>อัปโหลดอะไหล่</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onSave}
            title="บันทึกข้อมูลลงเครื่อง (LocalStorage)"
          >
            <IconSave size={15} />
            <span>บันทึก</span>
            {lastSaved && <span className="save-indicator">•</span>}
          </button>

          <div className="dropdown-wrapper">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onExportJSON}
              title="ส่งออกไฟล์ข้อมูลสำรอง JSON"
            >
              <IconDownload size={15} />
              <span className="hide-mobile">ส่งออก JSON</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            title="นำเข้าไฟล์ JSON ที่เคยบันทึกไว้"
          >
            <IconUpload size={15} />
            <span className="hide-mobile">นำเข้า</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            className="btn btn-primary"
            onClick={onPrint}
            title="พิมพ์เอกสารออกเครื่องพิมพ์ หรือ บันทึกเป็น PDF แนวนอน (A4 Landscape)"
          >
            <IconPrinter size={16} />
            <span>พิมพ์ / ส่งออก PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
}
