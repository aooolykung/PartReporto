import React, { useState } from 'react';
import {
  IconPlus,
  IconTrash,
  IconCopy,
  IconRefresh,
  IconCheck,
  IconUpload
} from './Icons';

const UNIT_PRESETS = ["PC", "SET", "M", "ตัว", "ชุด", "ม้วน", "ชิ้น", "เส้น", "อัน"];

export default function FormEditor({ formData, setFormData, onReset, onOpenImportModal }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Handle header field updates
  const handleHeaderChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      header: {
        ...prev.header,
        [field]: value
      }
    }));
  };

  // Handle inspection updates
  const handleInspectionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      inspection: {
        ...prev.inspection,
        [field]: value
      }
    }));
  };

  // Handle responsible updates
  const handleResponsibleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      responsible: {
        ...prev.responsible,
        [field]: value
      }
    }));
  };

  // Handle duration updates
  const handleDurationChange = (field, value) => {
    setFormData(prev => {
      const newDuration = { ...prev.duration, [field]: value };
      
      // Auto calculate total days if startDate or endDate changes
      if (field === 'startDate' || field === 'endDate') {
        const start = new Date(newDuration.startDate);
        const end = new Date(newDuration.endDate);
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          newDuration.totalDays = diffDays.toString();
        }
      }

      return {
        ...prev,
        duration: newDuration
      };
    });
  };

  // Handle summary updates
  const handleSummaryChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      summary: {
        ...prev.summary,
        [field]: value
      }
    }));
  };

  // Handle item change
  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const currentItem = { ...newItems[index] };

      if (field === 'cleaning') {
        currentItem.cleaning = Boolean(value);
      } else if (field === 'qty') {
        const qtyNum = parseFloat(value) || 0;
        currentItem.qty = value;
        currentItem.amount = Math.round(qtyNum * (parseFloat(currentItem.unitPrice) || 0) * 1000) / 1000;
      } else if (field === 'unitPrice') {
        const priceNum = parseFloat(value) || 0;
        currentItem.unitPrice = value;
        currentItem.amount = Math.round((parseFloat(currentItem.qty) || 0) * priceNum * 1000) / 1000;
      } else if (field === 'amount') {
        currentItem.amount = parseFloat(value) || 0;
      } else {
        currentItem[field] = value;
      }

      newItems[index] = currentItem;
      return { ...prev, items: newItems };
    });
  };

  // Add new row
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: prev.items.length + 1,
          name: "",
          cleaning: false,
          qty: 1,
          unit: "PC",
          unitPrice: 0,
          amount: 0,
          refDoc: ""
        }
      ]
    }));
  };

  // Duplicate item
  const handleDuplicateItem = (index) => {
    setFormData(prev => {
      const target = prev.items[index];
      const newItems = [...prev.items];
      newItems.splice(index + 1, 0, {
        ...target,
        id: newItems.length + 1
      });
      return { ...prev, items: newItems };
    });
  };

  // Remove item
  const handleRemoveItem = (index) => {
    setFormData(prev => {
      if (prev.items.length <= 1) {
        return {
          ...prev,
          items: [{ id: 1, name: "", cleaning: false, qty: 1, unit: "PC", unitPrice: 0, amount: 0, refDoc: "" }]
        };
      }
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
  };

  // Fill up to 50 items (standard 3-page template)
  const handleFill50Items = () => {
    setFormData(prev => {
      const currentLength = prev.items.length;
      if (currentLength >= 50) return prev;
      const extraItems = [];
      for (let i = currentLength + 1; i <= 50; i++) {
        extraItems.push({
          id: i,
          name: "",
          cleaning: false,
          qty: "",
          unit: "",
          unitPrice: "",
          amount: 0,
          refDoc: ""
        });
      }
      return {
        ...prev,
        items: [...prev.items, ...extraItems]
      };
    });
  };

  // Remove empty items
  const handleRemoveEmptyItems = () => {
    setFormData(prev => {
      const filtered = prev.items.filter(it => it.name && it.name.trim() !== "");
      if (filtered.length === 0) {
        return {
          ...prev,
          items: [{ id: 1, name: "", cleaning: false, qty: 1, unit: "PC", unitPrice: 0, amount: 0, refDoc: "" }]
        };
      }
      return { ...prev, items: filtered };
    });
  };

  // Calculate grand total
  const totalAmount = formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const activeItemsCount = formData.items.filter(it => it.name && it.name.trim() !== "").length;

  return (
    <div className="form-editor-container">
      {/* SECTION 1: ข้อมูลลูกค้าและเครื่องจักร */}
      <div className="editor-card">
        <div className="card-header">
          <div className="card-title-badge">หมวดที่ 1</div>
          <h2 className="card-title">ข้อมูลลูกค้าและเครื่องจักร (Customer & Machine)</h2>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">ใบแจ้งซ่อม เลขที่</label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น 210000095862"
              value={formData.header.repairDocNo}
              onChange={(e) => handleHeaderChange('repairDocNo', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">วันที่เอกสาร</label>
            <input
              type="date"
              className="form-input"
              value={formData.header.docDate}
              onChange={(e) => handleHeaderChange('docDate', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ใบสั่งงาน เลขที่</label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น 310000084587"
              value={formData.header.workOrderNo}
              onChange={(e) => handleHeaderChange('workOrderNo', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ชื่อเครื่องจักร</label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น เครื่องสลัดน้ำผัก"
              value={formData.header.machineName}
              onChange={(e) => handleHeaderChange('machineName', e.target.value)}
            />
          </div>

          <div className="form-group span-2">
            <label className="form-label">ลักษณะการใช้งาน</label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น เครื่องสลัดน้ำจากผัก"
              value={formData.header.machineUsage}
              onChange={(e) => handleHeaderChange('machineUsage', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ID เครื่อง</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="เช่น SDY02P3"
              value={formData.header.machineId}
              onChange={(e) => handleHeaderChange('machineId', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">รุ่น / ยี่ห้อ</label>
            <input
              type="text"
              className="form-input"
              placeholder='เช่น "KRONEN" K50-7S'
              value={formData.header.modelBrand}
              onChange={(e) => handleHeaderChange('modelBrand', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Serial No</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="เช่น 1051"
              value={formData.header.serialNo}
              onChange={(e) => handleHeaderChange('serialNo', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">PLANT</label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น 3"
              value={formData.header.plant}
              onChange={(e) => handleHeaderChange('plant', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cost Center</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="เช่น 503102"
              value={formData.header.costCenter}
              onChange={(e) => handleHeaderChange('costCenter', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ผู้ติดต่อ / เบอร์โทร</label>
            <input
              type="text"
              className="form-input"
              placeholder="ชื่อผู้ติดต่อ หรือ เบอร์โทร"
              value={formData.header.contactPhone}
              onChange={(e) => handleHeaderChange('contactPhone', e.target.value)}
            />
          </div>

          <div className="form-group span-2">
            <label className="form-label">อาการเสียเบื้องต้น</label>
            <input
              type="text"
              className="form-input text-danger-soft"
              placeholder="เช่น ระบบLockฝาไม่ทำงาน ยกฝาเครื่องไม่หยุดทันที"
              value={formData.header.initialSymptoms}
              onChange={(e) => handleHeaderChange('initialSymptoms', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">กำหนดแล้วเสร็จ</label>
            <input
              type="date"
              className="form-input"
              value={formData.header.targetDueDate}
              onChange={(e) => handleHeaderChange('targetDueDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: ตรวจเช็คสาเหตุ + ผู้รับผิดชอบ + ระยะเวลา */}
      <div className="editor-card">
        <div className="card-header">
          <div className="card-title-badge">หมวดที่ 2</div>
          <h2 className="card-title">การตรวจเช็คสาเหตุ & ทีมงาน & ระยะเวลาทำงาน</h2>
        </div>

        <div className="three-columns-grid">
          {/* Col 1: สาเหตุ */}
          <div className="sub-card">
            <div className="sub-card-header">
              <span className="sub-title">1. ตรวจเช็คสาเหตุ</span>
            </div>
            <div className="sub-card-body">
              <label className="form-label">รายละเอียดสาเหตุที่พบ</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="ระบุสาเหตุข้อบกพร่อง เช่น&#10;ระบบ Control ไม่เรียบร้อย&#10;สายพาน Timeming ฉีกขาด"
                value={formData.inspection.causeInspection}
                onChange={(e) => handleInspectionChange('causeInspection', e.target.value)}
              />
              <div className="mt-3">
                <label className="form-label">ลงชื่อผู้ตรวจเช็ค</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น วสันต์ นราแก้ว"
                  value={formData.inspection.inspectorSignature}
                  onChange={(e) => handleInspectionChange('inspectorSignature', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Col 2: ผู้รับผิดชอบ / ช่าง */}
          <div className="sub-card">
            <div className="sub-card-header">
              <span className="sub-title">2. ผู้รับผิดชอบ / ช่างผู้ปฏิบัติงาน</span>
            </div>
            <div className="sub-card-body space-y-2">
              <div>
                <label className="form-label">หัวหน้างาน (Supervisor)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น ตันติกร"
                  value={formData.responsible.supervisor}
                  onChange={(e) => handleResponsibleChange('supervisor', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">1. ช่างผู้ปฏิบัติงานคนที่ 1</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น วสันต์ นราแก้ว"
                  value={formData.responsible.technician1}
                  onChange={(e) => handleResponsibleChange('technician1', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">2. ช่างผู้ปฏิบัติงานคนที่ 2</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น ณัฐพล ปิ่นแหลม"
                  value={formData.responsible.technician2}
                  onChange={(e) => handleResponsibleChange('technician2', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">3. ช่างผู้ปฏิบัติงานคนที่ 3</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ระบุชื่อช่างคนที่ 3 (ถ้ามี)"
                  value={formData.responsible.technician3}
                  onChange={(e) => handleResponsibleChange('technician3', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Col 3: ระยะเวลาการทำงาน */}
          <div className="sub-card">
            <div className="sub-card-header">
              <span className="sub-title">3. ระยะเวลาการทำงาน</span>
            </div>
            <div className="sub-card-body space-y-2">
              <div>
                <label className="form-label">วันที่เริ่ม</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.duration.startDate}
                  onChange={(e) => handleDurationChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">วันที่แล้วเสร็จ</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.duration.endDate}
                  onChange={(e) => handleDurationChange('endDate', e.target.value)}
                />
              </div>
              <div className="duration-calc-box">
                <span className="calc-label">รวมระยะเวลา</span>
                <div className="duration-input-wrapper">
                  <input
                    type="number"
                    className="form-input duration-number-input font-bold"
                    min="1"
                    value={formData.duration.totalDays}
                    onChange={(e) => handleDurationChange('totalDays', e.target.value)}
                  />
                  <span className="duration-unit">วัน</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: ตารางรายการอะไหล่ */}
      <div className="editor-card">
        <div className="card-header card-header-split">
          <div>
            <div className="card-title-badge">หมวดที่ 3</div>
            <h2 className="card-title">รายการอะไหล่ที่เปลี่ยน (Overhaul Spare Parts)</h2>
            <p className="card-subtitle">
              มีข้อมูลทั้งสิ้น {formData.items.length} แถว (ใช้งานจริง {activeItemsCount} รายการ)
            </p>
          </div>

          <div className="items-action-bar">
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-highlight-upload"
              onClick={onOpenImportModal}
              title="อัปโหลดรายการอะไหล่จากไฟล์ Excel (.xlsx, .xls) หรือ CSV"
            >
              <IconUpload size={15} />
              <span>อัปโหลดไฟล์อะไหล่ (Excel/CSV)</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleFill50Items}
              title="เติมแถวให้ครบ 50 รายการ เพื่อให้เต็มตามขนาดฟอร์ม 3 หน้า"
            >
              <span>เติมให้ครบ 50 แถว</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleRemoveEmptyItems}
              title="ลบแถวที่ว่างและไม่มีรายการออก"
            >
              <span>ลบแถวว่าง</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAddItem}
            >
              <IconPlus size={15} />
              <span>เพิ่มรายการ (+ Row)</span>
            </button>
          </div>
        </div>

        {/* Search filter for long item list */}
        {formData.items.length > 10 && (
          <div className="items-search-bar">
            <input
              type="text"
              className="form-input search-input"
              placeholder="🔍 ค้นหารายการอะไหล่ / รหัส / เลขที่เอกสารอ้างอิง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Table Editor */}
        <div className="table-responsive">
          <table className="editor-table">
            <colgroup>
              <col style={{ width: '42px' }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: '65px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '135px' }} />
              <col style={{ width: '70px' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="text-center">#</th>
                <th>รายการ / รุ่น / ยี่ห้อ</th>
                <th className="text-center" title="ติ๊กเมื่อมีการล้างทำความสะอาดอะไหล่">Cleaning</th>
                <th className="text-right">จำนวน</th>
                <th>หน่วย</th>
                <th className="text-right">ราคา / หน่วย</th>
                <th className="text-right">จำนวนเงิน</th>
                <th>เลขที่เอกสารอ้างอิง</th>
                <th className="text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => {
                // If search term is present, filter rows
                if (searchTerm.trim() !== '') {
                  const match = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.refDoc || '').toLowerCase().includes(searchTerm.toLowerCase());
                  if (!match) return null;
                }

                return (
                  <tr key={item.id || index} className={!item.name ? "row-empty" : ""}>
                    <td className="text-center text-muted font-mono">{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        className="table-input"
                        placeholder="รหัสและชื่ออะไหล่"
                        value={item.name || ""}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={Boolean(item.cleaning)}
                        onChange={(e) => handleItemChange(index, 'cleaning', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="table-input text-right font-mono"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={item.qty ?? ""}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        list={`unit-list-${index}`}
                        className="table-input"
                        placeholder="PC"
                        value={item.unit || ""}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      />
                      <datalist id={`unit-list-${index}`}>
                        {UNIT_PRESETS.map(u => <option key={u} value={u} />)}
                      </datalist>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="table-input text-right font-mono"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={item.unitPrice ?? ""}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="table-input text-right font-mono font-semibold bg-readonly"
                        step="any"
                        placeholder="0.000"
                        value={item.amount ?? ""}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="table-input font-mono"
                        placeholder="D1SP26/..."
                        value={item.refDoc || ""}
                        onChange={(e) => handleItemChange(index, 'refDoc', e.target.value)}
                      />
                    </td>
                    <td className="text-center">
                      <div className="row-action-btns">
                        <button
                          type="button"
                          className="btn-icon text-muted hover-primary"
                          onClick={() => handleDuplicateItem(index)}
                          title="คัดลอกแถวนี้"
                        >
                          <IconCopy size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger hover-danger"
                          onClick={() => handleRemoveItem(index)}
                          title="ลบแถวนี้"
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add row bar & Summary total box */}
        <div className="table-footer-summary">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddItem}
          >
            <IconPlus size={15} />
            <span>เพิ่มแถวใหม่</span>
          </button>

          <div className="grand-total-callout">
            <span className="total-title">รวมจำนวนเงินทั้งสิ้น (บาท):</span>
            <span className="total-number">
              ฿{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: สรุปผลการ Overhaul & การส่งมอบงาน & ผู้อนุมัติ */}
      <div className="editor-card">
        <div className="card-header">
          <div className="card-title-badge">หมวดที่ 4</div>
          <h2 className="card-title">สรุปผลการ Overhaul, การส่งมอบ & การอนุมัติ (Signatures)</h2>
        </div>

        <div className="three-columns-grid">
          {/* สรุปผล Overhaul */}
          <div className="sub-card">
            <div className="sub-card-header">
              <span className="sub-title">1. สรุปผลการ Overhaul</span>
            </div>
            <div className="sub-card-body space-y-3">
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="overhaul_status"
                    checked={formData.summary.status === 'early'}
                    onChange={() => handleSummaryChange('status', 'early')}
                  />
                  <span>เสร็จก่อนแผนงาน</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="overhaul_status"
                    checked={formData.summary.status === 'on_schedule'}
                    onChange={() => handleSummaryChange('status', 'on_schedule')}
                  />
                  <span>อยู่ในแผนงาน</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="overhaul_status"
                    checked={formData.summary.status === 'delayed'}
                    onChange={() => handleSummaryChange('status', 'delayed')}
                  />
                  <span className="text-warning-dark">เสร็จล่าช้าแผนงาน</span>
                </label>
              </div>

              <div>
                <label className="form-label">สาเหตุ (กรณีล่าช้า หรือหมายเหตุเพิ่มเติม)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ระบุสาเหตุ..."
                  value={formData.summary.delayReason || ""}
                  onChange={(e) => handleSummaryChange('delayReason', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ส่งมอบงาน + ผู้อนุมัติ */}
          <div className="sub-card">
            <div className="sub-card-header">
              <span className="sub-title">2. การส่งมอบงาน & ผู้อนุมัติ</span>
            </div>
            <div className="sub-card-body space-y-3">
              <div className="border-bottom-soft pb-2">
                <span className="text-sm font-semibold text-primary">ส่งมอบงาน</span>
                <div className="mt-1">
                  <label className="form-label">ลงชื่อหัวหน้างาน / เจ้าหน้าที่ส่งมอบ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น ตันติกร"
                    value={formData.summary.handoverSign || ""}
                    onChange={(e) => handleSummaryChange('handoverSign', e.target.value)}
                  />
                </div>
                <div className="mt-1">
                  <label className="form-label">วันที่ส่งมอบ</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.summary.handoverDate || ""}
                    onChange={(e) => handleSummaryChange('handoverDate', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold text-primary">ผู้อนุมัติ</span>
                <div className="mt-1">
                  <label className="form-label">ลงชื่อผู้อนุมัติ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ลงชื่อผู้อนุมัติ"
                    value={formData.summary.approverSign || ""}
                    onChange={(e) => handleSummaryChange('approverSign', e.target.value)}
                  />
                </div>
                <div className="mt-1">
                  <label className="form-label">แผนก / ฝ่าย</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น ซ่อมบำรุง / ผลิต"
                    value={formData.summary.approverDept || ""}
                    onChange={(e) => handleSummaryChange('approverDept', e.target.value)}
                  />
                </div>
                <div className="mt-1">
                  <label className="form-label">วันที่อนุมัติ</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.summary.approverDate || ""}
                    onChange={(e) => handleSummaryChange('approverDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนลูกค้า (ตรวจ/รับส่งมอบ) */}
          <div className="sub-card">
            <div className="sub-card-header">
              <span className="sub-title">3. ส่วนลูกค้า (ตรวจ/รับส่งมอบ)</span>
            </div>
            <div className="sub-card-body space-y-3">
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="customer_status"
                    checked={formData.summary.customerStatus === 'passed'}
                    onChange={() => handleSummaryChange('customerStatus', 'passed')}
                  />
                  <span className="text-success-dark font-medium">ผ่าน</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="customer_status"
                    checked={formData.summary.customerStatus === 'failed'}
                    onChange={() => handleSummaryChange('customerStatus', 'failed')}
                  />
                  <span className="text-danger font-medium">ไม่ผ่าน</span>
                </label>
              </div>

              {formData.summary.customerStatus === 'failed' && (
                <div>
                  <label className="form-label text-danger">เนื่องจากสาเหตุ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ระบุข้อบกพร่องที่ไม่ผ่าน..."
                    value={formData.summary.customerFailReason || ""}
                    onChange={(e) => handleSummaryChange('customerFailReason', e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="form-label">ลงชื่อเจ้าหน้าที่ / แผนกลูกค้า</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ลงชื่อผู้ตรวจรับ"
                  value={formData.summary.customerSign || ""}
                  onChange={(e) => handleSummaryChange('customerSign', e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">วันที่ตรวจรับ</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.summary.customerDate || ""}
                  onChange={(e) => handleSummaryChange('customerDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
