import React, { useState } from 'react';
import { formatThaiDate, formatCurrency } from '../data/sampleData';

// Shared colgroup for exact 100% column widths in parts tables
const PartsColGroup = () => (
  <colgroup>
    <col style={{ width: '4.5%' }} />  {/* ลำดับ */}
    <col style={{ width: '44%' }} />   {/* รายการ / รุ่น / ยี่ห้อ */}
    <col style={{ width: '6%' }} />    {/* Cleaning */}
    <col style={{ width: '6.5%' }} />  {/* จำนวน */}
    <col style={{ width: '6%' }} />    {/* หน่วย */}
    <col style={{ width: '10.5%' }} /> {/* ราคา / หน่วย */}
    <col style={{ width: '10.5%' }} /> {/* จำนวนเงิน */}
    <col style={{ width: '12%' }} />   {/* เลขที่เอกสารอ้างอิง */}
  </colgroup>
);

// Shared colgroup for customer info grid
const MetaColGroup = () => (
  <colgroup>
    <col style={{ width: '16%' }} />
    <col style={{ width: '18%' }} />
    <col style={{ width: '12%' }} />
    <col style={{ width: '20%' }} />
    <col style={{ width: '16%' }} />
    <col style={{ width: '18%' }} />
  </colgroup>
);

// Shared colgroup for 3-columns inspection/techs/duration
const ThreeColGroup = () => (
  <colgroup>
    <col style={{ width: '38%' }} />
    <col style={{ width: '34%' }} />
    <col style={{ width: '28%' }} />
  </colgroup>
);

// Shared colgroup for signoff
const SignColGroup = () => (
  <colgroup>
    <col style={{ width: '30%' }} />
    <col style={{ width: '35%' }} />
    <col style={{ width: '35%' }} />
  </colgroup>
);

export default function DocumentPreview({ formData }) {
  const { header, inspection, responsible, duration, items, summary } = formData;
  const [paginationMode, setPaginationMode] = useState('auto'); // 'auto' | 'fixed3'

  // Calculate grand total
  const grandTotal = items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);

  // Find the last row with actual data
  let lastFilledIndex = -1;
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i]?.name && items[i].name.trim() !== '') {
      lastFilledIndex = i;
      break;
    }
  }
  const effectiveCount = lastFilledIndex >= 0 ? (lastFilledIndex + 1) : Math.min(items.length, 1);

  // Determine total pages based on pagination mode
  let totalPages = 1;
  if (paginationMode === 'fixed3') {
    totalPages = 3;
  } else if (effectiveCount <= 6) {
    totalPages = 1;
  } else if (effectiveCount <= 20) {
    totalPages = 2;
  } else {
    // Page 1 holds 10 items
    // Last page holds 10 items
    // Middle pages hold 30 items each
    const middleItems = effectiveCount - 20;
    const numMiddlePages = Math.ceil(middleItems / 30);
    totalPages = 2 + numMiddlePages;
  }

  // Helper to slice rows for exact page allocation
  const getPageRows = (startIndex, count) => {
    const rows = [];
    for (let i = 0; i < count; i++) {
      const actualIndex = startIndex + i;
      const item = items[actualIndex];
      rows.push({
        num: actualIndex + 1,
        name: item?.name || "",
        cleaning: Boolean(item?.cleaning),
        qty: item?.qty !== undefined && item?.qty !== "" ? item.qty : "",
        unit: item?.unit || "",
        unitPrice: item?.unitPrice !== undefined && item?.unitPrice !== "" && item?.unitPrice !== 0
          ? formatCurrency(item.unitPrice, 3)
          : (item?.unitPrice === 0 ? "0.000" : ""),
        amount: item?.amount !== undefined && item?.amount !== "" && item?.amount !== 0
          ? formatCurrency(item.amount, 3)
          : (item?.amount === 0 ? "0.000" : ""),
        refDoc: item?.refDoc || ""
      });
    }
    return rows;
  };

  // Render the Sign-off / Bottom box section
  const renderSignOffSection = () => (
    <table className="doc-unified-table sign-doc-table mt-1">
      <SignColGroup />
      <thead>
        <tr>
          <th>สรุปผลการ Overhaul</th>
          <th>ส่งมอบงาน</th>
          <th>ส่วนลูกค้า (ตรวจ/รับส่งมอบเครื่องจักร)</th>
        </tr>
      </thead>
      <tbody>
        {/* Row 1: Overhaul status & Handover & Customer check */}
        <tr>
          {/* สรุปผล Overhaul */}
          <td className="v-top p-2">
            <div className="checkbox-line">
              <span className={`square-box ${summary.status === 'early' ? 'checked' : ''}`}></span>
              <span>เสร็จก่อนแผนงาน</span>
            </div>
            <div className="checkbox-line">
              <span className={`square-box ${summary.status === 'on_schedule' ? 'checked' : ''}`}></span>
              <span>อยู่ในแผนงาน</span>
            </div>
            <div className="checkbox-line">
              <span className={`square-box ${summary.status === 'delayed' ? 'checked' : ''}`}></span>
              <span>เสร็จล่าช้าแผนงาน</span>
            </div>
          </td>

          {/* ส่งมอบงาน */}
          <td className="v-top p-2">
            <div className="sign-line-row">
              <span className="sign-lbl">ลงชื่อ :</span>
              <span className="sign-val-underline">{summary.handoverSign || ""}</span>
              <span className="sign-role">หัวหน้างาน / เจ้าหน้าที่</span>
            </div>
            <div className="sign-line-row mt-2">
              <span className="sign-lbl">วันที่ :</span>
              <span className="sign-val-underline">{formatThaiDate(summary.handoverDate)}</span>
            </div>
          </td>

          {/* ส่วนลูกค้า */}
          <td className="v-top p-2">
            <div className="checkbox-line">
              <span className={`square-box ${summary.customerStatus === 'passed' ? 'checked' : ''}`}></span>
              <span>ผ่าน</span>
            </div>
            <div className="checkbox-line">
              <span className={`square-box ${summary.customerStatus === 'failed' ? 'checked' : ''}`}></span>
              <span>ไม่ผ่าน เนื่องจาก :</span>
              <span className="underline-text">{summary.customerFailReason || ""}</span>
            </div>
          </td>
        </tr>

        {/* Subheader: ผู้อนุมัติ */}
        <tr className="approver-header-row">
          <td className="border-top-0"></td>
          <td colSpan={2} className="text-center font-bold approver-title-cell">
            ผู้อนุมัติ
          </td>
        </tr>

        {/* Row 2: สาเหตุ & ผู้อนุมัติ & เจ้าหน้าที่/แผนก */}
        <tr>
          {/* สาเหตุ */}
          <td className="v-top p-2">
            <div className="sign-line-row">
              <span className="sign-lbl font-bold">สาเหตุ :</span>
              <span className="sign-val-underline">{summary.delayReason || ""}</span>
            </div>
          </td>

          {/* ผู้อนุมัติ */}
          <td className="v-top p-2">
            <div className="sign-line-row">
              <span className="sign-lbl">ลงชื่อ :</span>
              <span className="sign-val-underline">{summary.approverSign || ""}</span>
              <span className="sign-role">แผนก / ฝ่าย {summary.approverDept || ""}</span>
            </div>
            <div className="sign-line-row mt-2">
              <span className="sign-lbl">วันที่ :</span>
              <span className="sign-val-underline">{formatThaiDate(summary.approverDate)}</span>
            </div>
          </td>

          {/* เจ้าหน้าที่ / แผนก */}
          <td className="v-top p-2">
            <div className="sign-line-row">
              <span className="sign-lbl">ลงชื่อ :</span>
              <span className="sign-val-underline">{summary.customerSign || ""}</span>
              <span className="sign-role">เจ้าหน้าที่ / แผนก</span>
            </div>
            <div className="sign-line-row mt-2">
              <span className="sign-lbl">วันที่ :</span>
              <span className="sign-val-underline">{formatThaiDate(summary.customerDate)}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <div className="doc-preview-wrapper">
      {/* Pagination control toolbar (screen only) */}
      <div className="preview-toolbar no-print">
        <div className="toolbar-info">
          <span className="badge-page-count">
            เอกสารทั้งหมด {totalPages} หน้า (ข้อมูลจริง {effectiveCount} รายการ)
          </span>
        </div>
        <div className="toolbar-controls">
          <label className="text-xs font-semibold text-slate-600 mr-1">การจัดหน้า:</label>
          <select
            className="form-input form-input-sm pagination-select"
            value={paginationMode}
            onChange={(e) => setPaginationMode(e.target.value)}
          >
            <option value="auto">⚡ ปรับจำนวนหน้าอัตโนมัติตามแถวอะไหล่ ({totalPages} หน้า)</option>
            <option value="fixed3">📋 ล็อก 3 หน้าตามแบบฟอร์มเดิม (50 แถว)</option>
          </select>
        </div>
      </div>

      {/* ================= CASE 1: SINGLE PAGE (totalPages === 1) ================= */}
      {totalPages === 1 && (
        <div className="a4-sheet" id="print-page-1">
          <div className="sheet-content">
            <div className="doc-main-title">
              ใบบันทึกการเปลี่ยนอะไหล่เครื่องจักร (Overhaul)
            </div>

            {/* Section: ข้อมูลลูกค้า */}
            <table className="doc-unified-table meta-grid-table mb-1">
              <MetaColGroup />
              <thead>
                <tr>
                  <th colSpan={6} className="doc-box-title">ข้อมูลลูกค้า</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="meta-label">ใบแจ้งซ่อม เลขที่</td>
                  <td className="meta-val font-mono">{header.repairDocNo}</td>
                  <td className="meta-label">วันที่</td>
                  <td className="meta-val">{formatThaiDate(header.docDate)}</td>
                  <td className="meta-label">ใบสั่งงาน เลขที่</td>
                  <td className="meta-val font-mono">{header.workOrderNo}</td>
                </tr>
                <tr>
                  <td className="meta-label">ชื่อเครื่องจักร</td>
                  <td className="meta-val font-semibold">{header.machineName}</td>
                  <td className="meta-label">ลักษณะการใช้งาน</td>
                  <td className="meta-val" colSpan={3}>{header.machineUsage}</td>
                </tr>
                <tr>
                  <td className="meta-label">ID เครื่อง</td>
                  <td className="meta-val font-mono font-semibold">{header.machineId}</td>
                  <td className="meta-label">รุ่น / ยี่ห้อ</td>
                  <td className="meta-val">{header.modelBrand}</td>
                  <td className="meta-label">Serial No</td>
                  <td className="meta-val font-mono">{header.serialNo}</td>
                </tr>
                <tr>
                  <td className="meta-label">PLANT</td>
                  <td className="meta-val">{header.plant}</td>
                  <td className="meta-label">Cost Center</td>
                  <td className="meta-val font-mono">{header.costCenter}</td>
                  <td className="meta-label">ผู้ติดต่อ / เบอร์โทร</td>
                  <td className="meta-val">{header.contactPhone}</td>
                </tr>
                <tr>
                  <td className="meta-label">อาการเสียเบื้องต้น:</td>
                  <td className="meta-val" colSpan={3}>{header.initialSymptoms}</td>
                  <td className="meta-label">กำหนดแล้วเสร็จ</td>
                  <td className="meta-val">{formatThaiDate(header.targetDueDate)}</td>
                </tr>
              </tbody>
            </table>

            {/* Section: 3 Columns */}
            <table className="doc-unified-table three-col-table mb-1">
              <ThreeColGroup />
              <thead>
                <tr>
                  <th>ตรวจเช็คสาเหตุ</th>
                  <th>ผู้รับผิดชอบ / ช่างผู้ปฏิบัติงาน</th>
                  <th>ระยะเวลาการทำงาน</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="col-cell v-top">
                    <div className="cause-content">{inspection.causeInspection || ""}</div>
                    <div className="cause-sign-row">
                      <span>ลงชื่อผู้ตรวจเช็ค</span>
                      <span className="sign-underlined">{inspection.inspectorSignature || ""}</span>
                    </div>
                  </td>
                  <td className="col-cell v-top">
                    <div className="team-row">
                      <span className="team-role">หัวหน้างาน</span>
                      <span className="team-name">{responsible.supervisor || ""}</span>
                    </div>
                    <div className="team-row">
                      <span className="team-num">1.</span>
                      <span className="team-name">{responsible.technician1 || ""}</span>
                    </div>
                    <div className="team-row">
                      <span className="team-num">2.</span>
                      <span className="team-name">{responsible.technician2 || ""}</span>
                    </div>
                    <div className="team-row">
                      <span className="team-num">3.</span>
                      <span className="team-name">{responsible.technician3 || ""}</span>
                    </div>
                  </td>
                  <td className="col-cell v-top p-0">
                    <table className="duration-inner-grid">
                      <colgroup>
                        <col style={{ width: '45%' }} />
                        <col style={{ width: '55%' }} />
                      </colgroup>
                      <tbody>
                        <tr>
                          <td className="dur-label">วันที่เริ่ม</td>
                          <td className="dur-val">{formatThaiDate(duration.startDate)}</td>
                        </tr>
                        <tr>
                          <td className="dur-label">วันที่แล้วเสร็จ</td>
                          <td className="dur-val">{formatThaiDate(duration.endDate)}</td>
                        </tr>
                        <tr>
                          <td className="dur-label font-bold">รวม</td>
                          <td className="dur-val font-bold">
                            {duration.totalDays ? `${duration.totalDays} วัน` : ""}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Single page parts table (6 rows) */}
            <div className="parts-table-wrapper">
              <table className="doc-unified-table parts-doc-table">
                <PartsColGroup />
                <thead>
                  <tr>
                    <th>ลำดับ</th>
                    <th>รายการ / รุ่น / ยี่ห้อ</th>
                    <th>Cleaning</th>
                    <th>จำนวน</th>
                    <th>หน่วย</th>
                    <th>ราคา / หน่วย</th>
                    <th>จำนวนเงิน</th>
                    <th>เลขที่เอกสารอ้างอิง</th>
                  </tr>
                </thead>
                <tbody>
                  {getPageRows(0, Math.max(effectiveCount, 6)).map((r) => (
                    <tr key={r.num} className="parts-row-single">
                      <td className="text-center font-mono">{r.num}</td>
                      <td className="text-left font-content">{r.name}</td>
                      <td className="text-center">{r.name && (r.cleaning ? "✓" : "")}</td>
                      <td className="text-center font-mono">{r.qty}</td>
                      <td className="text-center">{r.unit}</td>
                      <td className="text-right font-mono">{r.unitPrice}</td>
                      <td className="text-right font-mono font-semibold">{r.amount}</td>
                      <td className="text-center font-mono text-xs">{r.refDoc}</td>
                    </tr>
                  ))}
                  <tr className="total-summary-row">
                    <td colSpan={6} className="text-right font-bold pr-3">
                      รวมทั้งหมด (บาท)
                    </td>
                    <td className="text-right font-bold font-mono">
                      {formatCurrency(grandTotal, 3)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sign-off section */}
            {renderSignOffSection()}

            {/* Footer */}
            <div className="doc-page-footer">
              <span>หน้า 1 / 1</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= CASE 2: MULTI-PAGE (totalPages > 1) ================= */}
      {totalPages > 1 && (
        <>
          {/* ================= PAGE 1 ================= */}
          <div className="a4-sheet" id="print-page-1">
            <div className="sheet-content">
              <div className="doc-main-title">
                ใบบันทึกการเปลี่ยนอะไหล่เครื่องจักร (Overhaul)
              </div>

              {/* Section: ข้อมูลลูกค้า */}
              <table className="doc-unified-table meta-grid-table mb-1">
                <MetaColGroup />
                <thead>
                  <tr>
                    <th colSpan={6} className="doc-box-title">ข้อมูลลูกค้า</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="meta-label">ใบแจ้งซ่อม เลขที่</td>
                    <td className="meta-val font-mono">{header.repairDocNo}</td>
                    <td className="meta-label">วันที่</td>
                    <td className="meta-val">{formatThaiDate(header.docDate)}</td>
                    <td className="meta-label">ใบสั่งงาน เลขที่</td>
                    <td className="meta-val font-mono">{header.workOrderNo}</td>
                  </tr>
                  <tr>
                    <td className="meta-label">ชื่อเครื่องจักร</td>
                    <td className="meta-val font-semibold">{header.machineName}</td>
                    <td className="meta-label">ลักษณะการใช้งาน</td>
                    <td className="meta-val" colSpan={3}>{header.machineUsage}</td>
                  </tr>
                  <tr>
                    <td className="meta-label">ID เครื่อง</td>
                    <td className="meta-val font-mono font-semibold">{header.machineId}</td>
                    <td className="meta-label">รุ่น / ยี่ห้อ</td>
                    <td className="meta-val">{header.modelBrand}</td>
                    <td className="meta-label">Serial No</td>
                    <td className="meta-val font-mono">{header.serialNo}</td>
                  </tr>
                  <tr>
                    <td className="meta-label">PLANT</td>
                    <td className="meta-val">{header.plant}</td>
                    <td className="meta-label">Cost Center</td>
                    <td className="meta-val font-mono">{header.costCenter}</td>
                    <td className="meta-label">ผู้ติดต่อ / เบอร์โทร</td>
                    <td className="meta-val">{header.contactPhone}</td>
                  </tr>
                  <tr>
                    <td className="meta-label">อาการเสียเบื้องต้น:</td>
                    <td className="meta-val" colSpan={3}>{header.initialSymptoms}</td>
                    <td className="meta-label">กำหนดแล้วเสร็จ</td>
                    <td className="meta-val">{formatThaiDate(header.targetDueDate)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Section: 3 Columns */}
              <table className="doc-unified-table three-col-table mb-1">
                <ThreeColGroup />
                <thead>
                  <tr>
                    <th>ตรวจเช็คสาเหตุ</th>
                    <th>ผู้รับผิดชอบ / ช่างผู้ปฏิบัติงาน</th>
                    <th>ระยะเวลาการทำงาน</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="col-cell v-top">
                      <div className="cause-content">{inspection.causeInspection || ""}</div>
                      <div className="cause-sign-row">
                        <span>ลงชื่อผู้ตรวจเช็ค</span>
                        <span className="sign-underlined">{inspection.inspectorSignature || ""}</span>
                      </div>
                    </td>
                    <td className="col-cell v-top">
                      <div className="team-row">
                        <span className="team-role">หัวหน้างาน</span>
                        <span className="team-name">{responsible.supervisor || ""}</span>
                      </div>
                      <div className="team-row">
                        <span className="team-num">1.</span>
                        <span className="team-name">{responsible.technician1 || ""}</span>
                      </div>
                      <div className="team-row">
                        <span className="team-num">2.</span>
                        <span className="team-name">{responsible.technician2 || ""}</span>
                      </div>
                      <div className="team-row">
                        <span className="team-num">3.</span>
                        <span className="team-name">{responsible.technician3 || ""}</span>
                      </div>
                    </td>
                    <td className="col-cell v-top p-0">
                      <table className="duration-inner-grid">
                        <colgroup>
                          <col style={{ width: '45%' }} />
                          <col style={{ width: '55%' }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td className="dur-label">วันที่เริ่ม</td>
                            <td className="dur-val">{formatThaiDate(duration.startDate)}</td>
                          </tr>
                          <tr>
                            <td className="dur-label">วันที่แล้วเสร็จ</td>
                            <td className="dur-val">{formatThaiDate(duration.endDate)}</td>
                          </tr>
                          <tr>
                            <td className="dur-label font-bold">รวม</td>
                            <td className="dur-val font-bold">
                              {duration.totalDays ? `${duration.totalDays} วัน` : ""}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Page 1 Parts Table (Items 1 - 10) */}
              <div className="parts-table-wrapper">
                <table className="doc-unified-table parts-doc-table">
                  <PartsColGroup />
                  <thead>
                    <tr>
                      <th>ลำดับ</th>
                      <th>รายการ / รุ่น / ยี่ห้อ</th>
                      <th>Cleaning</th>
                      <th>จำนวน</th>
                      <th>หน่วย</th>
                      <th>ราคา / หน่วย</th>
                      <th>จำนวนเงิน</th>
                      <th>เลขที่เอกสารอ้างอิง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPageRows(0, 10).map((r) => (
                      <tr key={r.num} className="parts-row-p1">
                        <td className="text-center font-mono">{r.num}</td>
                        <td className="text-left font-content">{r.name}</td>
                        <td className="text-center">{r.name && (r.cleaning ? "✓" : "")}</td>
                        <td className="text-center font-mono">{r.qty}</td>
                        <td className="text-center">{r.unit}</td>
                        <td className="text-right font-mono">{r.unitPrice}</td>
                        <td className="text-right font-mono font-semibold">{r.amount}</td>
                        <td className="text-center font-mono text-xs">{r.refDoc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Page 1 Footer */}
              <div className="doc-page-footer">
                <span>หน้า 1 / {totalPages}</span>
              </div>
            </div>
          </div>

          {/* ================= MIDDLE PAGES (Page 2 to totalPages - 1) ================= */}
          {totalPages > 2 && Array.from({ length: totalPages - 2 }).map((_, midIdx) => {
            const pageNum = midIdx + 2;
            const startRowIndex = 10 + midIdx * 30;
            const pageRows = getPageRows(startRowIndex, 30);

            return (
              <div className="a4-sheet" key={`mid-page-${pageNum}`} id={`print-page-${pageNum}`}>
                <div className="sheet-content">
                  <div className="doc-main-title">
                    ใบบันทึกการเปลี่ยนอะไหล่เครื่องจักร (Overhaul)
                  </div>

                  {/* Middle Page Parts Table (30 items) */}
                  <div className="parts-table-wrapper">
                    <table className="doc-unified-table parts-doc-table">
                      <PartsColGroup />
                      <thead>
                        <tr>
                          <th>ลำดับ</th>
                          <th>รายการ / รุ่น / ยี่ห้อ</th>
                          <th>Cleaning</th>
                          <th>จำนวน</th>
                          <th>หน่วย</th>
                          <th>ราคา / หน่วย</th>
                          <th>จำนวนเงิน</th>
                          <th>เลขที่เอกสารอ้างอิง</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((r) => (
                          <tr key={r.num} className="parts-row-p2">
                            <td className="text-center font-mono">{r.num}</td>
                            <td className="text-left font-content">{r.name}</td>
                            <td className="text-center">{r.name && (r.cleaning ? "✓" : "")}</td>
                            <td className="text-center font-mono">{r.qty}</td>
                            <td className="text-center">{r.unit}</td>
                            <td className="text-right font-mono">{r.unitPrice}</td>
                            <td className="text-right font-mono font-semibold">{r.amount}</td>
                            <td className="text-center font-mono text-xs">{r.refDoc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="doc-page-footer">
                    <span>หน้า {pageNum} / {totalPages}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ================= LAST PAGE (Page totalPages) ================= */}
          {(() => {
            const lastPageNum = totalPages;
            const startRowIndex = 10 + (totalPages - 2) * 30;
            const lastPageRows = getPageRows(startRowIndex, 10);

            return (
              <div className="a4-sheet" id={`print-page-${lastPageNum}`}>
                <div className="sheet-content">
                  <div className="doc-main-title">
                    ใบบันทึกการเปลี่ยนอะไหล่เครื่องจักร (Overhaul)
                  </div>

                  {/* Notice top left */}
                  <div className="notice-sub-header">
                    **ตรวจสอบเครื่องจักรและทดสอบก่อนส่งมอบ
                  </div>

                  {/* Last Page Parts Table (10 items + Total) */}
                  <div className="parts-table-wrapper">
                    <table className="doc-unified-table parts-doc-table">
                      <PartsColGroup />
                      <thead>
                        <tr>
                          <th>ลำดับ</th>
                          <th>รายการ / รุ่น / ยี่ห้อ</th>
                          <th>Cleaning</th>
                          <th>จำนวน</th>
                          <th>หน่วย</th>
                          <th>ราคา / หน่วย</th>
                          <th>จำนวนเงิน</th>
                          <th>เลขที่เอกสารอ้างอิง</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastPageRows.map((r) => (
                          <tr key={r.num} className="parts-row-p3">
                            <td className="text-center font-mono">{r.num}</td>
                            <td className="text-left font-content">{r.name}</td>
                            <td className="text-center">{r.name && (r.cleaning ? "✓" : "")}</td>
                            <td className="text-center font-mono">{r.qty}</td>
                            <td className="text-center">{r.unit}</td>
                            <td className="text-right font-mono">{r.unitPrice}</td>
                            <td className="text-right font-mono font-semibold">{r.amount}</td>
                            <td className="text-center font-mono text-xs">{r.refDoc}</td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="total-summary-row">
                          <td colSpan={6} className="text-right font-bold pr-3">
                            รวมทั้งหมด (บาท)
                          </td>
                          <td className="text-right font-bold font-mono">
                            {formatCurrency(grandTotal, 3)}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Sign-off section */}
                  {renderSignOffSection()}

                  {/* Footer */}
                  <div className="doc-page-footer">
                    <span>หน้า {lastPageNum} / {totalPages}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
