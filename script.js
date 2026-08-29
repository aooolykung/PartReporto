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
    pageCapacity: hasSummary ? 20 : (isFirstPage ? 10 : 30),
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
    inputs[5].value = price;
    inputs[6].value = amount * price;
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

document.querySelector('#export-pdf').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const originalText = button.textContent;

  if (!window.html2canvas || !window.jspdf?.jsPDF) {
    showCsvStatus('โหลดระบบสร้าง PDF ไม่สำเร็จ กำลังเปิดหน้าต่างพิมพ์แทน', 'warning');
    window.print();
    return;
  }

  button.disabled = true;
  button.textContent = 'กำลังสร้าง PDF...';
  showCsvStatus('กำลังสร้างไฟล์ PDF กรุณารอสักครู่', 'warning');

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
    const pages = [...document.querySelectorAll('.page')];

    for (let index = 0; index < pages.length; index += 1) {
      const canvas = await window.html2canvas(pages[index], {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (clonedDocument) => {
          clonedDocument.querySelectorAll('.page').forEach((page) => {
            page.style.boxShadow = 'none';
          });
        }
      });

      if (index > 0) {
        pdf.addPage('letter', 'landscape');
      }
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 11, 8.5, undefined, 'FAST');
    }

    const machineId = document.querySelector('[name="machine_id"]')?.value.trim() || 'ไม่ระบุ';
    const repairNotice = document.querySelector('[name="repair_notice_no"]')?.value.trim() || 'ไม่ระบุ';
    const safeFilePart = (value) => value.replace(/[<>:"/\\|?*]/g, '-');
    const fileName = safeFilePart(`ใบบันทึกการเปลี่ยนอะไหล่ ${machineId} ${repairNotice}.pdf`);
    pdf.save(fileName);
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
  document.querySelectorAll('input[name], textarea[name]').forEach((input) => {
    const savedField = savedData.fields?.find((field) => field.name === input.name);
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
