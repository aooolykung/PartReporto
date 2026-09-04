flatpickr('input[name$="_date"]', {
  dateFormat: 'd/m/Y',
  onChange: updateDateDependentFields
});

const startDateInput = document.querySelector('input[name="start_date"]');
const finishDateInput = document.querySelector('input[name="finish_date"]');
const dueDateInput = document.querySelector('input[name="due_date"]');
const totalDaysInput = document.querySelector('input[name="total_days"]');

function parseDate(value) {
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) {
    return null;
  }
  return Date.UTC(year, month - 1, day);
}

function updateTotalDays() {
  const startDate = parseDate(startDateInput?.value || '');
  const finishDate = parseDate(finishDateInput?.value || '');

  if (!totalDaysInput) {
    return;
  }

  if (startDate === null || finishDate === null || finishDate < startDate) {
    totalDaysInput.value = '';
    return;
  }

  totalDaysInput.value = Math.floor((finishDate - startDate) / 86400000) + 1;
}

function updateResultStatus() {
  const finishDate = parseDate(finishDateInput?.value || '');
  const dueDate = parseDate(dueDateInput?.value || '');
  const earlyCheckbox = document.querySelector('input[name="result"][value="early"]');
  const onTimeCheckbox = document.querySelector('input[name="result"][value="on_time"]');
  const lateCheckbox = document.querySelector('input[name="result"][value="late"]');

  if (!earlyCheckbox || !onTimeCheckbox || !lateCheckbox) {
    return;
  }

  earlyCheckbox.checked = false;
  onTimeCheckbox.checked = false;
  lateCheckbox.checked = false;

  if (finishDate === null || dueDate === null) {
    return;
  }

  if (finishDate <= dueDate) {
    earlyCheckbox.checked = true;
    onTimeCheckbox.checked = true;
  } else {
    lateCheckbox.checked = true;
  }
}

function updateDateDependentFields() {
  updateTotalDays();
  updateResultStatus();
}

updateTotalDays();
updateResultStatus();

const partTables = [...document.querySelectorAll('.parts-table')];
const partGroups = partTables.map((table, index) => {
  const hasSummary = Boolean(table.closest('.page')?.querySelector('.summary-grid'));
  const sourcePage = table.closest('.page');
  const isFirstPage = sourcePage.classList.contains('page-one');
  return {
    name: `parts-${index}`,
    sourceTable: table,
    sourcePage: sourcePage,
    summary: sourcePage.querySelector('.summary-grid'),
    sourceTbody: table.querySelector('tbody'),
    totalFooter: table.querySelector('tfoot'),
    initialRows: table.querySelectorAll('tbody tr').length,
    pageCapacity: hasSummary ? 10 : (isFirstPage ? 10 : 30),
    continuationPages: []
  };
});

partGroups.forEach((group) => {
  group.sourceTable.dataset.partsGroup = group.name;
  group.sourceTbody.dataset.partsGroup = group.name;
  group.sourceTbody.querySelectorAll('tr').forEach((row) => {
    row.dataset.partsGroup = group.name;
  });
});

function rowHasContent(row) {
  return [...row.querySelectorAll('input')]
    .slice(1)
    .some((input) => input.value.trim() !== '');
}

function createBlankRow(sourceTable, groupName) {
  const row = sourceTable.querySelector('tbody tr').cloneNode(true);
  row.dataset.partsGroup = groupName;
  row.querySelectorAll('input').forEach((input) => {
    input.value = '';
    input.removeAttribute('readonly');
  });
  row.querySelector('input').readOnly = true;
  return row;
}

function createContinuationPage(group) {
  const page = document.createElement('section');
  page.className = 'page page-continuation';
  page.dataset.partsGroup = group.name;

  const partsSection = document.createElement('section');
  partsSection.className = 'parts-section';

  const table = group.sourceTable.cloneNode(false);
  table.dataset.partsGroup = group.name;
  table.append(group.sourceTable.querySelector('thead').cloneNode(true));

  const tbody = document.createElement('tbody');
  tbody.dataset.partsGroup = group.name;
  table.append(tbody);
  partsSection.append(table);
  page.append(partsSection);

  const footer = document.createElement('footer');
  footer.className = 'page-footer';
  footer.innerHTML = '<span>ใบบันทึกการเปลี่ยนอะไหล่เครื่องจักร</span><strong></strong>';
  page.append(footer);

  const lastPage = group.continuationPages.at(-1) || group.sourcePage;
  lastPage.after(page);
  group.continuationPages.push(page);
  return tbody;
}

function renumberAllRows() {
  let sequence = 1;

  partGroups.forEach((group) => {
    const rows = [
      ...group.sourceTbody.querySelectorAll('tr'),
      ...group.continuationPages.flatMap((page) => [...page.querySelectorAll('tbody tr')])
    ];

    rows.forEach((row) => {
      row.querySelectorAll('input').forEach((input, inputIndex) => {
        const label = input.getAttribute('aria-label');
        if (label) {
          input.setAttribute('aria-label', label.replace(/\d+$/, sequence));
        }
        if (inputIndex === 0) {
          input.value = sequence;
          input.readOnly = true;
        }
      });
      sequence += 1;
    });
  });
}

function rebalanceGroup(group) {
  const activeElement = document.activeElement;
  const activeSelection = activeElement?.tagName === 'INPUT'
    ? { start: activeElement.selectionStart, end: activeElement.selectionEnd }
    : null;
  const rows = [
    ...group.sourceTbody.querySelectorAll('tr'),
    ...group.continuationPages.flatMap((page) => [...page.querySelectorAll('tbody tr')])
  ];
  const pageCapacity = group.pageCapacity;
  const requiredPages = Math.max(
    0,
    Math.ceil(Math.max(0, rows.length - pageCapacity) / pageCapacity)
  );

  while (group.continuationPages.length < requiredPages) {
    createContinuationPage(group);
  }

  const bodies = [
    group.sourceTbody,
    ...group.continuationPages.map((page) => page.querySelector('tbody'))
  ];
  bodies.forEach((tbody) => { tbody.replaceChildren(); });

  rows.forEach((row, index) => {
    const bodyIndex = index < pageCapacity
      ? 0
      : Math.ceil((index - pageCapacity + 1) / pageCapacity);
    bodies[bodyIndex].append(row);
  });

  const totalPages = Math.max(1, requiredPages + 1);
  const pageTargets = Array.from({ length: totalPages }, (_, index) => {
    const isLastPage = index === totalPages - 1;
    const remainingRows = rows.length - (index * pageCapacity);
    // Only pad pages if there's a summary grid (summary pages need exact row counts)
    if (group.summary && rows.length <= pageCapacity) {
      return pageCapacity;
    }
    return Math.max(0, Math.min(pageCapacity, remainingRows));
  });

  bodies.forEach((tbody, index) => {
    const targetCount = pageTargets[index] ?? 0;
    const currentCount = tbody.querySelectorAll('tr').length;
    for (let offset = currentCount; offset < targetCount; offset += 1) {
      tbody.append(createBlankRow(group.sourceTable, group.name));
    }
  });

  while (group.continuationPages.length > requiredPages) {
    const page = group.continuationPages.pop();
    if (group.totalFooter && page.contains(group.totalFooter)) {
      group.sourceTable.append(group.totalFooter);
    }
    if (group.summary && page.contains(group.summary)) {
      group.sourcePage.querySelector('.page-footer').before(group.summary);
    }
    page.remove();
  }

  if (group.summary) {
    const lastTable = (group.continuationPages.at(-1) || group.sourcePage)
      .querySelector('.parts-table');
    lastTable.append(group.totalFooter);
    const lastPage = group.continuationPages.at(-1) || group.sourcePage;
    lastPage.querySelector('.page-footer').before(group.summary);
  }

  renumberAllRows();
  updateTotals();
  updatePageNumbers();

  if (activeElement?.isConnected && activeElement.tagName === 'INPUT') {
    activeElement.focus();
    if (activeSelection) {
      activeElement.setSelectionRange(activeSelection.start, activeSelection.end);
    }
  }
}

function updatePageNumbers() {
  const pages = [...document.querySelectorAll('.page')];
  pages.forEach((page, index) => {
    const pageNumber = page.querySelector('.page-footer strong');
    if (pageNumber) {
      pageNumber.textContent = `หน้า ${index + 1} / ${pages.length}`;
    }
  });
}

function updateTotals() {
  const allRows = partGroups.flatMap((group) => [
    ...group.sourceTbody.querySelectorAll('tr'),
    ...group.continuationPages.flatMap((page) => [...page.querySelectorAll('tbody tr')])
  ]);
  const total = allRows.reduce((sum, row) => {
    const amountInput = row.querySelectorAll('input')[6];
    const amount = Number.parseFloat(amountInput?.value.replace(/,/g, '') || '0');
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
  const totalInput = partGroups.find((group) => group.summary)?.totalFooter.querySelector('input');
  if (totalInput) {
    totalInput.value = total.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

function populateImportedParts(parts) {
  const rows = partGroups.flatMap((group) => [
    ...group.sourceTbody.querySelectorAll('tr'),
    ...group.continuationPages.flatMap((page) => [...page.querySelectorAll('tbody tr')])
  ]);

  parts.forEach(([materialNumber, description, amount, unit, price, documentNumber], index) => {
    const row = rows[index];
    if (!row) {
      return;
    }

    const inputs = row.querySelectorAll('input');
    inputs[1].value = combinePartDescription(materialNumber, description);
    inputs[3].value = amount;
    inputs[4].value = unit;
    inputs[5].value = amount > 0 ? price / amount : '';
    inputs[6].value = price;
    inputs[7].value = documentNumber;
    row.dataset.hasContent = 'true';
  });
}

function getCurrentPartRows() {
  return partGroups.flatMap((group) => [
    ...group.sourceTbody.querySelectorAll('tr'),
    ...group.continuationPages.flatMap((page) => [...page.querySelectorAll('tbody tr')])
  ]).map((row) => [...row.querySelectorAll('input')].map((input) => input.value));
}

function ensurePartRows(count) {
  const group = partGroups[1];
  while (getCurrentPartRows().length < count) {
    group.sourceTbody.append(createBlankRow(group.sourceTable, group.name));
  }
}

function populateSavedParts(parts) {
  ensurePartRows(parts.length);
  const rows = partGroups.flatMap((group) => [
    ...group.sourceTbody.querySelectorAll('tr'),
    ...group.continuationPages.flatMap((page) => [...page.querySelectorAll('tbody tr')])
  ]);

  parts.forEach((values, index) => {
    const row = rows[index];
    if (!row) {
      return;
    }
    row.querySelectorAll('input').forEach((input, inputIndex) => {
      input.value = values[inputIndex] || '';
    });
    if (values.slice(1).some((value) => value !== '')) {
      row.dataset.hasContent = 'true';
    }
  });
}

function normalizeCsvCell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ก-ฮ]/g, '')
    .trim();
}

function showCsvStatus(message, type = 'warning') {
  const status = document.querySelector('#csv-status');
  if (!status) {
    return;
  }

  status.textContent = message;
  status.className = `csv-status ${type}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }
      row.push(value.trim());
      if (row.some((cell) => cell !== '')) {
        rows.push(row);
      }
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }

  return rows;
}

function matchCsvColumnIndex(headers, aliases) {
  const normalizedHeaders = headers.map((header) => normalizeCsvCell(header));

  for (let index = 0; index < normalizedHeaders.length; index += 1) {
    const normalizedHeader = normalizedHeaders[index];
    if (aliases.some((alias) => normalizedHeader === normalizeCsvCell(alias))) {
      return index;
    }
  }

  return null;
}

function parseCsvNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const parsed = Number.parseFloat(String(value).replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCsvRowPart(row, columnMap) {
  const materialNumber = row[columnMap.materialNumber] ?? row[columnMap.description] ?? '';
  const description = row[columnMap.description] ?? row[columnMap.materialNumber] ?? '';
  const amount = row[columnMap.amount] ?? '0';
  const unit = row[columnMap.unit] ?? '';
  const price = row[columnMap.price] ?? '0';
  const documentNumber = row[columnMap.documentNumber] ?? '';

  return [
    String(materialNumber).trim(),
    String(description).trim(),
    parseCsvNumber(amount),
    String(unit).trim(),
    parseCsvNumber(price),
    String(documentNumber).trim()
  ];
}

function combinePartDescription(materialNumber, description) {
  const materialText = String(materialNumber || '').trim();
  const descriptionText = String(description || '').trim();

  if (!materialText) {
    return descriptionText;
  }
  if (!descriptionText) {
    return materialText;
  }

  const normalizeForComparison = (value) => value
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedMaterial = normalizeForComparison(materialText);
  const normalizedDescription = normalizeForComparison(descriptionText);

  if (normalizedMaterial === normalizedDescription) {
    return descriptionText;
  }
  if (normalizedDescription.includes(normalizedMaterial)) {
    return descriptionText;
  }
  if (normalizedMaterial.includes(normalizedDescription)) {
    return materialText;
  }

  return `${materialText} ${descriptionText}`;
}

function resetPartsTable() {
  partGroups.slice(1).forEach((group) => {
    group.continuationPages.forEach((page) => {
      if (group.totalFooter && page.contains(group.totalFooter)) {
        group.sourceTable.append(group.totalFooter);
      }
      if (group.summary && page.contains(group.summary)) {
        group.sourcePage.querySelector('.page-footer').before(group.summary);
      }
      page.remove();
    });
    group.continuationPages = [];
  });
  partGroups.forEach((group) => {
    [...group.sourceTbody.querySelectorAll('tr')].forEach((row) => {
      row.querySelectorAll('input').forEach((input) => {
        input.value = '';
        input.removeAttribute('readonly');
      });
      row.dataset.hasContent = '';
    });
  });
}

const csvFileInput = document.querySelector('#csv-file');
const savedFileInput = document.querySelector('#saved-file');

// Clear the remembered path before opening the picker. Without this, choosing
// the same file again does not fire a change event in most browsers.
[csvFileInput, savedFileInput].forEach((fileInput) => {
  fileInput?.addEventListener('click', () => {
    fileInput.value = '';
  });
});

csvFileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  let csvText;
  try {
    csvText = await file.text();
  } catch (error) {
    showCsvStatus(`ไม่สามารถอ่านไฟล์ CSV ได้: ${error.message}`, 'warning');
    event.target.value = '';
    return;
  }

  const rows = parseCsv(csvText);
  if (!rows.length) {
    showCsvStatus('ไฟล์ CSV ไม่มีข้อมูลที่สามารถนำเข้าได้', 'warning');
    event.target.value = '';
    return;
  }

  const headerAliases = {
    materialNumber: ['materialnumber', 'materialnum', 'materialno', 'materialid', 'itemcode', 'itemno', 'รหัสวัสดุ', 'เลขวัสดุ', 'material'],
    description: ['description', 'material_des', 'materialdes', 'material desc', 'itemdescription', 'itemname', 'รายละเอียด', 'รายการ', 'ชื่อวัสดุ', 'descriptionth'],
    amount: ['amount', 'qty', 'quantity', 'จำนวน', 'qty1'],
    unit: ['unit', 'units', 'หน่วย'],
    price: ['price', 'unitprice', 'priceperunit', 'ราคาต่อหน่วย', 'ราคา', 'unitcost'],
    documentNumber: ['documentnumber', 'docnumber', 'documentno', 'docno', 'เลขที่เอกสาร', 'เอกสารอ้างอิง', 'reference', 'refdoc']
  };

  const headerRow = rows[0];
  const columnMap = Object.fromEntries(
    Object.entries(headerAliases).map(([key, aliases]) => [key, matchCsvColumnIndex(headerRow, aliases)])
  );

  const materialNumberMissing = columnMap.materialNumber === null && columnMap.description === null;
  const missingRequiredColumns = Object.entries(columnMap)
    .filter(([key, index]) => ['description', 'amount', 'unit', 'price'].includes(key) && index === null)
    .map(([key]) => key);

  if (materialNumberMissing) {
    missingRequiredColumns.push('materialNumber');
  }

  const hasNamedColumns = Object.values(columnMap).some((index) => index !== null);

  const parts = rows.slice(1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ''))
    .map((row) => {
      if (hasNamedColumns) {
        const mappedRow = getCsvRowPart(row, columnMap);
        return mappedRow;
      }

      const fallback = row.slice(0, 6);
      if (fallback.length < 6) {
        return [fallback[0] || '', fallback[1] || '', 0, fallback[2] || '', 0, fallback[3] || ''];
      }

      return [
        fallback[0] || '',
        fallback[1] || '',
        parseCsvNumber(fallback[2]),
        fallback[3] || '',
        parseCsvNumber(fallback[4]),
        fallback[5] || ''
      ];
    });

  if (missingRequiredColumns.length > 0) {
    showCsvStatus(
      `คำเตือน: คอลัมน์ที่จำเป็นหายไป ${missingRequiredColumns.map((name) => {
        if (name === 'materialNumber') return 'materialNumber';
        if (name === 'description') return 'description';
        if (name === 'amount') return 'amount';
        if (name === 'unit') return 'unit';
        if (name === 'price') return 'price';
        return name;
      }).join(', ')} ระบบจะใช้ค่าเริ่มต้นแทนและอาจส่งผลต่อข้อมูลที่ import ได้`,
      'warning'
    );
  } else {
    showCsvStatus(`อัปโหลด CSV สำเร็จ: นำเข้าข้อมูล ${parts.length} รายการ`, 'success');
  }

  resetPartsTable();
  parts.forEach((part, index) => {
    const group = index < partGroups[0].pageCapacity ? partGroups[0] : partGroups[1];
    const rowsInGroup = group.sourceTbody.querySelectorAll('tr');
    if (index >= partGroups[0].pageCapacity && !rowsInGroup[index - partGroups[0].pageCapacity]) {
      group.sourceTbody.append(createBlankRow(group.sourceTable, group.name));
    }
  });
  populateImportedParts(parts);
  partGroups.forEach((group) => rebalanceGroup(group));
  event.target.value = '';
});

document.querySelector('#save-file').addEventListener('click', () => {
  const fields = [...document.querySelectorAll('input[name], textarea[name]')]
    .filter((input) => !input.closest('.parts-table'))
    .map((input) => ({
      name: input.name,
      value: input.value,
      checked: input.type === 'checkbox' ? input.checked : undefined
    }));
  const savedData = {
    version: 1,
    fields,
    parts: getCurrentPartRows()
  };
  const getFieldValue = (name) => document.querySelector(`[name="${name}"]`)?.value.trim() || 'ไม่ระบุ';
  const safeFilePart = (value) => value.replace(/[<>:"/\\|?*]/g, '-');
  const fileName = [
    'ใบบันทึกการเปลี่ยนอะไหล่',
    getFieldValue('machine_id'),
    getFieldValue('repair_notice_no'),
    getFieldValue('notice_date')
  ].map(safeFilePart).join(' ') + '.json';
  const blob = new Blob([JSON.stringify(savedData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
});

async function ensureThaiPdfFonts() {
  const fontUrls = {
    'NotoSansThai-Regular.ttf': 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSansThai/NotoSansThai-Regular.ttf',
    'NotoSansThai-Bold.ttf': 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSansThai/NotoSansThai-Bold.ttf'
  };
  const entries = await Promise.all(Object.entries(fontUrls).map(async ([name, url]) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`โหลดฟอนต์ไม่สำเร็จ (${response.status})`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return [name, btoa(binary)];
  }));
  entries.forEach(([name, base64]) => { window.pdfMake.vfs[name] = base64; });
  window.pdfMake.fonts = {
    THSarabun: {
      normal: 'NotoSansThai-Regular.ttf', bold: 'NotoSansThai-Bold.ttf',
      italics: 'NotoSansThai-Regular.ttf', bolditalics: 'NotoSansThai-Bold.ttf'
    },
    Roboto: {
      normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };
}

document.querySelector('#export-pdf').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const originalText = button.textContent;

  if (!window.pdfMake) {
    showCsvStatus('โหลด pdfmake ไม่สำเร็จ กำลังเปิดหน้าต่างพิมพ์แทน', 'warning');
    window.print();
    return;
  }

  button.disabled = true;
  button.textContent = 'กำลังสร้าง PDF...';
  showCsvStatus('กำลังสร้างไฟล์ PDF ด้วย pdfmake กรุณารอสักครู่', 'warning');

  try {
    await ensureThaiPdfFonts();
    const fieldValue = (name) => document.querySelector(`[name="${name}"]`)?.value.trim() || '';
    const fieldValues = (name) => [...document.querySelectorAll(`[name="${name}"]`)]
      .map((input) => input.value.trim())
      .filter(Boolean);
    const totalAmount = () => document.querySelector('[aria-label="รวมทั้งหมด"]')?.value.trim() || '';
    const checked = (name, value) => document.querySelector(`[name="${name}"][value="${value}"]`)?.checked ? 'X' : '';
    const sourceRows = [...document.querySelectorAll('.parts-table tbody tr')]
      .map((row) => [...row.querySelectorAll('input')].map((input) => input.value || ''));
    const blank = ['', '', '', '', '', '', '', ''];
    const enteredParts = sourceRows.filter((values) => values.slice(1).some((value) => String(value).trim() !== ''));
    const middlePageCount = Math.max(0, Math.ceil(Math.max(0, enteredParts.length - 20) / 30));
    const parts = Array.from({ length: 20 + middlePageCount * 30 }, (_, index) => enteredParts[index] || blank);
    const headers = ['ลำดับ', 'รายการ / รุ่น / ยี่ห้อ', 'Cleaning', 'จำนวน', 'หน่วย', 'ราคา / หน่วย', 'จำนวนเงิน', 'เลขที่เอกสารอ้างอิง'];
    const richText = (value) => String(value || '').split(/([\u0E00-\u0E7F]+)/).filter(Boolean).map((part) => ({
      text: part,
      font: /[\u0E00-\u0E7F]/.test(part) ? 'THSarabun' : 'Roboto'
    }));
    const text = (value, alignment = 'left', bold = false) => ({ text: richText(value), alignment, bold });
    const checkboxLine = (name, value, label) => ({
      columns: [
        {
          canvas: [
            { type: 'rect', x: 0, y: 1, w: 13, h: 13, lineWidth: 1 },
            ...(checked(name, value) ? [{ type: 'line', x1: 3, y1: 7, x2: 6, y2: 11, lineWidth: 1 }, { type: 'line', x1: 6, y1: 11, x2: 11, y2: 3, lineWidth: 1 }] : [])
          ],
          width: 17
        },
        text(label, 'left')
      ],
      columnGap: 5,
      margin: [0, 3, 0, 3]
    });
    const line = (label, value) => ({
      columns: [text(label, 'left', true), { text: richText(value || ' '), decoration: 'underline' }],
      columnGap: 4,
      margin: [0, 1, 0, 1]
    });
    const summaryLine = (label, value, suffix = '', lineWidth = 150) => ({
      columns: [
        { width: 42, ...text(label, 'left', true) },
        {
          width: lineWidth,
          stack: [
            { text: value ? richText(value) : ' ', 
              fontSize: 8,
              alignment: 'center', 
              margin: [0, 0, 0, 1] 
            },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: lineWidth, y2: 0, lineWidth: 0.7 }] }
          ]
        },
        ...(suffix ? [{ width: 92, ...text(suffix, 'left', true) }] : [])
      ],
      columnGap: 4,
      margin: [0, 10, 0, 3]
    });
    const workerLine = (label, value) => ({
      columns: [
      { width: 24, ...text(label, 'left', true) },
      { text: richText(value || ' '), decoration: 'underline' }
       ],
      columnGap: 6,
      margin: [0, 1, 0, 1]
    });
        const leaderLine = (label, value) => ({
      columns: [
      { width: 50, ...text(label, 'left', true) },
      { text: richText(value || ' '), decoration: 'underline' }
       ],
      columnGap: 6,
      margin: [0, 1, 0, 1]
    });
    const handoverLine = (label, value, suffix = '') => summaryLine(label, value, suffix, 150);
    const partsTable = (start, count, total = false) => {
      const body = [headers.map((header) => text(header, 'center', true))];
      parts.slice(start, start + count).forEach((values, offset) => body.push([
        text(start + offset + 1, 'center'), text(values[1]), text(values[2], 'center'), text(values[3], 'center'),
        text(values[4], 'center'), text(values[5], 'right'), text(values[6], 'right'), text(values[7])
      ]));
      if (total) {
        body.push([{ text: richText('รวมทั้งหมด (บาท)'), colSpan: 6, alignment: 'right', bold: true }, {}, {}, {}, {}, {}, text(totalAmount(), 'right'), '']);
      }
      return { table: { headerRows: 1, widths: [30, '*', 45, 43, 38, 53, 58, 98], body }, layout: 'grid', fontSize: 8 };
    };
    const info = { table: { widths: ['*', '*', '*'], body: [
      [{ text: richText('ข้อมูลลูกค้า'), colSpan: 3, alignment: 'center', bold: true }, {}, {}],
      [line('ใบแจ้งซ่อม เลขที่', fieldValue('repair_notice_no')), line('วันที่', fieldValue('notice_date')), line('ใบสั่งงาน เลขที่', fieldValue('work_order_no'))],
      [line('ชื่อเครื่องจักร', fieldValue('machine_name')), line('ลักษณะการใช้งาน', fieldValue('usage')), ''],
      [line('ID เครื่อง', fieldValue('machine_id')), line('รุ่น / ยี่ห้อ', fieldValue('model_brand')), line('Serial No', fieldValue('serial_no'))],
      [line('PLANT', fieldValue('plant')), line('Cost Center', fieldValue('cost_center')), line('ผู้ติดต่อ / เบอร์โทร', `${fieldValue('contact')} ${fieldValue('phone')}`)],
      [{ text: richText(`อาการเสียเบื้องต้น: ${fieldValue('initial_problem')}`), colSpan: 2 }, {}, line('กำหนดแล้วเสร็จ', fieldValue('due_date'))]
    ] }, layout: 'grid', margin: [0, 0, 0, 7] };
    const overhaul = { table: { widths: ['30%', '42%', '28%'], body: [
      [{ text: richText('ตรวจเช็คสาเหตุ'), alignment: 'center', bold: true }, { text: richText('ผู้รับผิดชอบ / ช่างผู้ปฏิบัติงาน'), alignment: 'center', bold: true }, { text: richText('ระยะเวลาการทำงาน'), alignment: 'center', bold: true }],
      [text(fieldValues('cause').join('\n'), 'left'), 
        { stack: [leaderLine('หัวหน้างาน', fieldValue('supervisor')),
          workerLine('1.', fieldValue('worker_1')), 
          workerLine('2.', fieldValue('worker_2')), 
          workerLine('3.', fieldValue('worker_3'))] }, 
          
          { stack: [line('วันที่เริ่ม', fieldValue('start_date')), 
            line('วันที่แล้วเสร็จ', fieldValue('finish_date')), 
            line('รวม', `   ${fieldValue('total_days')}   วัน`)] }],
      [line('ลงชื่อผู้ตรวจเช็ค', fieldValue('inspector_signature')), '', '']
    ] }, layout: 'grid', margin: [0, 0, 0, 7] };
    const summary = { table: { widths: ['30%', '35%', '35%'], heights: [15, 92, 15, 90], body: [
      [{ text: richText('สรุปผลการ Overhaul'), alignment: 'center', bold: true }, { text: richText('ส่งมอบงาน'), alignment: 'center', bold: true }, { text: richText('ส่วนลูกค้า (ตรวจ/รับส่งมอบเครื่องจักร)'), alignment: 'center', bold: true }],
      [{ stack: [checkboxLine('result', 'early', 'เสร็จก่อนแผนงาน'), checkboxLine('result', 'on_time', 'อยู่ในแผนงาน'), checkboxLine('result', 'late', 'เสร็จล่าช้าแผนงาน')] }, { stack: [summaryLine('ลงชื่อ :', fieldValue('handover_signature'), 'หัวหน้างาน / เจ้าหน้าที่'), summaryLine('วันที่ :', fieldValue('handover_date'))] }, { stack: [checkboxLine('acceptance', 'pass', 'ผ่าน'), checkboxLine('acceptance', 'fail', `ไม่ผ่าน เนื่องจาก : ${fieldValue('rejection_reason')}`)] }],
      ['', { text: richText('ผู้อนุมัติ'), alignment: 'center', bold: true }, { text: '' }],
      [{ stack: [summaryLine('สาเหตุ :', fieldValue('result_reason'), '',175), summaryLine('', fieldValue('result_reason_more'), '', 175), summaryLine('', fieldValue('result_reason_more'), '', 175)] }, { stack: [summaryLine('ลงชื่อ : ', fieldValue('approval_signature'), 'แผนก / ฝ่าย'), summaryLine('วันที่ :', fieldValue('approval_date'))] }, { stack: [summaryLine('ลงชื่อ :', fieldValue('customer_signature'), 'เจ้าหน้าที่ / แผนก'), summaryLine('วันที่ :', fieldValue('customer_date'))] }]
    ] }, layout: 'grid', fontSize: 8 };
    const page = (items) => [{ text: richText('ใบบันทึกการเปลี่ยนอะไหล่เครื่องจักร (Overhaul)'), style: 'header', alignment: 'center' }, ...items];
    const content = [...page([info, overhaul, partsTable(0, 10)])];
    let nextPart = 10;
    for (let pageIndex = 0; pageIndex < middlePageCount; pageIndex += 1) {
      content.push({ text: '', pageBreak: 'after' }, ...page([partsTable(nextPart, 30)]));
      nextPart += 30;
    }
    content.push(
      { text: '', pageBreak: 'after' },
      ...page([{ text: richText('**ตรวจสอบเครื่องจักรและทดสอบก่อนส่งมอบ'), margin: [0, 0, 0, 5] }, partsTable(nextPart, parts.length - nextPart, true), summary])
    );
    const docDefinition = {
      pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [18, 18, 18, 18], content,
      styles: { header: { fontSize: 16, bold: true, margin: [0, 0, 0, 7] } },
      defaultStyle: { font: 'THSarabun', fontSize: 8 },
      footer: (currentPage, pageCount) => ({ text: richText(`หน้า ${currentPage} / ${pageCount}`), alignment: 'right', margin: [0, 0, 18, 6], fontSize: 8 })
    };
    const machineId = fieldValue('machine_id') || 'ไม่ระบุ';
    const repairNotice = fieldValue('repair_notice_no') || 'ไม่ระบุ';
    const safeFilePart = (value) => value.replace(/[<>:"/\\|?*]/g, '-');
    window.pdfMake.createPdf(docDefinition).download(safeFilePart(`ใบบันทึกการเปลี่ยนอะไหล่ ${machineId} ${repairNotice}.pdf`));
    showCsvStatus('สร้างและดาวน์โหลดไฟล์ PDF สำเร็จ', 'success');
  } catch (error) {
    showCsvStatus(`สร้าง PDF ไม่สำเร็จ: ${error.message} กำลังเปิดหน้าต่างพิมพ์แทน`, 'warning');
    window.print();
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

savedFileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  let savedData;
  try {
    savedData = JSON.parse(await file.text());
  } catch (error) {
    showCsvStatus(`ไม่สามารถเปิดไฟล์บันทึกได้: ${error.message}`, 'warning');
    event.target.value = '';
    return;
  }

  resetPartsTable();
  const savedFieldsByName = (savedData.fields || []).reduce((fields, savedField) => {
    if (!fields.has(savedField.name)) {
      fields.set(savedField.name, []);
    }
    fields.get(savedField.name).push(savedField);
    return fields;
  }, new Map());
  const fieldIndexes = new Map();
  document.querySelectorAll('input[name], textarea[name]').forEach((input) => {
    const savedFields = savedFieldsByName.get(input.name) || [];
    const fieldIndex = fieldIndexes.get(input.name) || 0;
    const savedField = savedFields[fieldIndex];
    fieldIndexes.set(input.name, fieldIndex + 1);
    if (!savedField) {
      return;
    }
    input.value = savedField.value || '';
    if (input.type === 'checkbox') {
      input.checked = Boolean(savedField.checked);
    }
  });
  populateSavedParts(savedData.parts || []);
  partGroups.forEach((group) => rebalanceGroup(group));
  // A CSV selected before opening the saved form must be selectable again,
  // even when it is the exact same file.
  csvFileInput.value = '';
  showCsvStatus(`เปิดไฟล์บันทึกสำเร็จ: ${file.name}`, 'success');
  event.target.value = '';
});

const firstPageGroup = partGroups.find((group) => group.sourcePage.classList.contains('page-one'));
const finalPageGroup = partGroups.find((group) => group.summary);
while (firstPageGroup && firstPageGroup.sourceTbody.rows.length < 10) {
  firstPageGroup.sourceTbody.append(createBlankRow(firstPageGroup.sourceTable, firstPageGroup.name));
}
while (finalPageGroup && finalPageGroup.sourceTbody.rows.length > 10) {
  finalPageGroup.sourceTbody.lastElementChild.remove();
}

partGroups.forEach((group) => {
  rebalanceGroup(group);
});

document.addEventListener('input', (event) => {
  const input = event.target;
  const row = input.closest('.parts-table tbody tr');
  const table = input.closest('.parts-table');
  if (!row || !table || input.tagName !== 'INPUT') {
    return;
  }

  const group = partGroups.find(({ name }) => name === table.dataset.partsGroup);
  if (!group) {
    return;
  }

  let structureChanged = false;

  if (rowHasContent(row)) {
    row.dataset.hasContent = 'true';
  } else if (row.dataset.hasContent === 'true') {
    row.remove();
    structureChanged = true;
  }

  const groupRows = [
    ...group.sourceTbody.querySelectorAll('tr'),
    ...group.continuationPages.flatMap((page) => [...page.querySelectorAll('tbody tr')])
  ];
  const lastGroupRow = groupRows.at(-1);
  if (group !== partGroups[0] && row === lastGroupRow && rowHasContent(row)) {
    row.closest('tbody').append(createBlankRow(group.sourceTable, group.name));
    structureChanged = true;
  }

  if (structureChanged) {
    rebalanceGroup(group);
  }

  updateTotals();
});
