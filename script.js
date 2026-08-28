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
const partGroups = partTables.map((table, index) => ({
  name: `parts-${index}`,
  sourceTable: table,
  sourcePage: table.closest('.page'),
  summary: table.closest('.page').querySelector('.summary-grid'),
  sourceTbody: table.querySelector('tbody'),
  totalFooter: table.querySelector('tfoot'),
  initialRows: table.querySelectorAll('tbody tr').length,
  pageCapacity: index === 1 ? 15 : table.querySelectorAll('tbody tr').length,
  continuationPages: []
}));

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
    inputs[1].value = `${materialNumber} ${description}`;
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

document.querySelector('#csv-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const rows = parseCsv(await file.text());
  const parts = rows.slice(1)
    .filter((row) => row.length >= 6 && row.some((cell) => cell !== ''))
    .map(([materialNumber, description, amount, unit, price, documentNumber]) => [
      materialNumber,
      description,
      Number.parseFloat(amount.replace(/,/g, '')) || 0,
      unit,
      Number.parseFloat(price.replace(/,/g, '')) || 0,
      documentNumber
    ]);

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

document.querySelector('#saved-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const savedData = JSON.parse(await file.text());
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
