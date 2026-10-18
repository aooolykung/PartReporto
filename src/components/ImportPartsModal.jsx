import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { IconUpload, IconFileText, IconCheck, IconTrash } from './Icons';

export default function ImportPartsModal({ isOpen, onClose, onImportItems }) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [priceInterpretation, setPriceInterpretation] = useState('total'); // 'total' | 'unit'
  const [importMode, setImportMode] = useState('replace'); // 'replace' | 'append'
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Process raw tabular data (array of objects or array of arrays)
  const processDataRows = (rawData, priceType = priceInterpretation) => {
    if (!rawData || rawData.length === 0) {
      setParsedRows([]);
      return;
    }

    const results = [];

    // Check if rawData is array of objects (from xlsx or parsed CSV with header)
    rawData.forEach((row, idx) => {
      // Find matching keys case-insensitively
      const getVal = (...keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null) return String(row[k]).trim();
          // Case insensitive check
          const foundKey = Object.keys(row).find(
            rk => rk.trim().toLowerCase() === k.trim().toLowerCase()
          );
          if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
            return String(row[foundKey]).trim();
          }
        }
        return '';
      };

      const docNo = getVal('docNo', 'refDoc', 'ref_doc', 'เอกสาร', 'เลขที่เอกสาร', 'เลขที่เอกสารอ้างอิง');
      const matNum = getVal('Materialnum', 'Material_num', 'partNo', 'code', 'รหัส', 'รหัสอะไหล่');
      const matDes = getVal('Material_Des', 'MaterialDes', 'Description', 'name', 'รายการ', 'ชื่ออะไหล่', 'รายการ / รุ่น / ยี่ห้อ');
      const qtyStr = getVal('amount', 'qty', 'quantity', 'จำนวน');
      const unit = getVal('unit', 'uom', 'หน่วย') || 'PC';
      const priceStr = getVal('price', 'unitPrice', 'totalPrice', 'ราคา', 'จำนวนเงิน');

      // Combine material number and description if separated
      let fullName = '';
      if (matNum && matDes) {
        fullName = `${matNum} ${matDes}`;
      } else if (matDes) {
        fullName = matDes;
      } else if (matNum) {
        fullName = matNum;
      }

      if (!fullName && !docNo && !priceStr && !qtyStr) {
        return; // Skip empty rows
      }

      const qty = parseFloat(qtyStr?.replace(/,/g, '')) || 0;
      const rawPrice = parseFloat(priceStr?.replace(/,/g, '')) || 0;

      let unitPrice = 0;
      let totalAmount = 0;

      if (priceType === 'total') {
        // Price in file represents Total Amount
        totalAmount = rawPrice;
        unitPrice = qty > 0 ? Math.round((totalAmount / qty) * 1000) / 1000 : 0;
      } else {
        // Price in file represents Unit Price
        unitPrice = rawPrice;
        totalAmount = Math.round(qty * unitPrice * 1000) / 1000;
      }

      results.push({
        id: idx + 1,
        name: fullName,
        cleaning: false,
        qty: qty || 1,
        unit: unit || 'PC',
        unitPrice: unitPrice,
        amount: totalAmount,
        refDoc: docNo
      });
    });

    setParsedRows(results);
    setErrorMsg(results.length === 0 ? 'ไม่พบข้อมูลที่ตรงกับรูปแบบที่รองรับ' : '');
  };

  // Parse CSV / TSV text
  const parseCSVText = (text, priceType = priceInterpretation) => {
    try {
      const lines = text.trim().split(/\r\n|\n|\r/);
      if (lines.length < 1) return;

      // Detect delimiter (, or \t or ;)
      const firstLine = lines[0];
      let delimiter = ',';
      if (firstLine.includes('\t')) delimiter = '\t';
      else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

      // Parse lines accounting for quoted CSV values
      const parseLine = (line) => {
        const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}]*))`, 'g');
        const matches = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          if (match.index === regex.lastIndex) regex.lastIndex++;
          let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
          matches.push(val?.trim() || '');
        }
        return matches;
      };

      const headerCells = parseLine(lines[0]);
      const dataRows = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cells = parseLine(lines[i]);
        const rowObj = {};
        headerCells.forEach((h, colIdx) => {
          rowObj[h] = cells[colIdx] || '';
        });
        dataRows.push(rowObj);
      }

      processDataRows(dataRows, priceType);
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการแปลงข้อมูล: ' + err.message);
    }
  };

  // Handle file upload (CSV or Excel)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        setPasteText(text);
        parseCSVText(text);
      };
      reader.readAsText(file, 'utf-8');
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          processDataRows(jsonData);
        } catch (err) {
          setErrorMsg('ไม่สามารถอ่านไฟล์ Excel ได้: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setErrorMsg('กรุณาเลือกไฟล์ .csv, .xlsx หรือ .xls');
    }
  };

  // Handle paste change
  const handlePasteChange = (e) => {
    const val = e.target.value;
    setPasteText(val);
    if (val.trim()) {
      parseCSVText(val);
    } else {
      setParsedRows([]);
    }
  };

  // Handle price interpretation toggle
  const handlePriceTypeChange = (newType) => {
    setPriceInterpretation(newType);
    if (parsedRows.length > 0) {
      // Re-process with new type
      if (pasteText) {
        parseCSVText(pasteText, newType);
      } else {
        setParsedRows(prev => prev.map(item => {
          let unitPrice = 0;
          let amount = 0;
          if (newType === 'total') {
            // treat amount as the total price
            amount = item.amount;
            unitPrice = item.qty > 0 ? Math.round((amount / item.qty) * 1000) / 1000 : 0;
          } else {
            // treat unitPrice as unit
            unitPrice = item.unitPrice || (item.qty > 0 ? item.amount / item.qty : item.amount);
            amount = Math.round(item.qty * unitPrice * 1000) / 1000;
          }
          return { ...item, unitPrice, amount };
        }));
      }
    }
  };

  // Confirm Import
  const handleConfirm = () => {
    if (parsedRows.length === 0) {
      alert('ยังไม่มีข้อมูลสำหรับนำเข้า');
      return;
    }
    onImportItems(parsedRows, importMode);
    onClose();
  };

  const grandTotal = parsedRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <IconUpload size={20} />
            </div>
            <div>
              <h3 className="modal-title">อัปโหลดไฟล์รายการอะไหล่ (Import Parts)</h3>
              <p className="modal-subtitle">
                รองรับไฟล์ Excel (.xlsx, .xls), ไฟล์ CSV หรือคัดลอกข้อความมาวางโดยตรง
              </p>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={onClose} title="ปิด">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Tab Switcher */}
          <div className="modal-tabs">
            <button
              type="button"
              className={`modal-tab ${activeTab === 'file' ? 'active' : ''}`}
              onClick={() => setActiveTab('file')}
            >
              📁 เลือกไฟล์ (CSV / Excel)
            </button>
            <button
              type="button"
              className={`modal-tab ${activeTab === 'paste' ? 'active' : ''}`}
              onClick={() => setActiveTab('paste')}
            >
              📋 คัดลอกและวางข้อความ (Paste CSV/Table)
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'file' && (
            <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv, .xlsx, .xls, .txt"
                style={{ display: 'none' }}
              />
              <div className="dropzone-content">
                <IconFileText size={36} className="text-primary mb-2" />
                <div className="dropzone-text">
                  {fileName ? (
                    <span className="font-semibold text-primary">{fileName}</span>
                  ) : (
                    <>
                      <span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวางที่นี่
                    </>
                  )}
                </div>
                <span className="dropzone-hint">
                  รองรับไฟล์ .csv, .xlsx, .xls (ระบบจะตรวจจับคอลัมน์ให้อัตโนมัติ)
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Paste Area */}
          {activeTab === 'paste' && (
            <div className="paste-area-wrapper">
              <textarea
                className="form-textarea paste-textarea font-mono"
                rows={6}
                placeholder="วางข้อมูล CSV ที่คัดลอกมา เช่น&#10;docNo,Materialnum,Material_Des,amount,unit,price&#10;D1SP26/128029,303090100090,Proximity Sw. OMRON,1,PC,899.42"
                value={pasteText}
                onChange={handlePasteChange}
              />
            </div>
          )}

          {errorMsg && (
            <div className="modal-error-banner">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Settings: Price Interpretation & Import Mode */}
          <div className="import-options-card">
            <div className="options-grid">
              <div>
                <label className="form-label font-bold text-primary">การตีความคอลัมน์ราคา (Price column):</label>
                <div className="radio-group mt-1">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="price_interp"
                      checked={priceInterpretation === 'total'}
                      onChange={() => handlePriceTypeChange('total')}
                    />
                    <span>
                      <strong>price คือราคารวม (Total Amount)</strong> - แนะนำสำหรับไฟล์ SAP/ERP (ราคาต่อหน่วย = price / amount)
                    </span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="price_interp"
                      checked={priceInterpretation === 'unit'}
                      onChange={() => handlePriceTypeChange('unit')}
                    />
                    <span>
                      <strong>price คือราคาต่อหน่วย (Unit Price)</strong> (ราคารวม = amount × price)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label font-bold text-primary">รูปแบบการนำเข้า:</label>
                <div className="radio-group mt-1">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="import_mode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <span><strong>แทนที่รายการเดิมทั้งหมด</strong> (Replace all)</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="import_mode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                    />
                    <span><strong>ต่อท้ายรายการเดิม</strong> (Append to existing)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Data Preview Table */}
          {parsedRows.length > 0 && (
            <div className="preview-table-section">
              <div className="preview-table-header">
                <span className="font-semibold text-slate-700">
                  ตัวอย่างข้อมูลที่ตรวจพบ ({parsedRows.length} รายการ):
                </span>
                <span className="font-mono font-bold text-primary">
                  ยอดรวม ฿{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </span>
              </div>
              <div className="preview-table-scroll">
                <table className="modal-preview-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>รายการ / รุ่น / ยี่ห้อ</th>
                      <th style={{ width: '60px' }} className="text-right">จำนวน</th>
                      <th style={{ width: '60px' }}>หน่วย</th>
                      <th style={{ width: '100px' }} className="text-right">ราคา/หน่วย</th>
                      <th style={{ width: '110px' }} className="text-right">จำนวนเงิน</th>
                      <th style={{ width: '130px' }}>เลขที่เอกสาร</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, i) => (
                      <tr key={i}>
                        <td className="text-center font-mono text-muted">{i + 1}</td>
                        <td className="font-semibold">{row.name}</td>
                        <td className="text-right font-mono">{row.qty}</td>
                        <td className="text-center">{row.unit}</td>
                        <td className="text-right font-mono">
                          {row.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                        </td>
                        <td className="text-right font-mono font-bold text-primary">
                          {row.amount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                        </td>
                        <td className="font-mono text-xs">{row.refDoc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={parsedRows.length === 0}
            onClick={handleConfirm}
          >
            <IconCheck size={16} />
            <span>ยืนยันการนำเข้า ({parsedRows.length} รายการ)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
