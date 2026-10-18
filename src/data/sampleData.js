// Sample data matching the PDF: ใบบันทึกการเปลี่ยนอะไหล่เครื่องจักร (Overhaul)

export const initialFormData = {
  header: {
    repairDocNo: "210000095862",
    docDate: "2026-08-28",
    workOrderNo: "310000084587",
    machineName: "เครื่องสลัดน้ำผัก",
    machineUsage: "เครื่องสลัดน้ำจากผัก",
    machineId: "SDY02P3",
    modelBrand: '"KRONEN" K50-7S',
    serialNo: "1051",
    plant: "3",
    costCenter: "503102",
    contactPhone: "",
    initialSymptoms: "ระบบLockฝาไม่ทำงาน ยกฝาเครื่องไม่หยุดทันที",
    targetDueDate: "2026-09-04",
  },
  inspection: {
    causeInspection: "ระบบ Control ไม่เรียบร้อย\nสายพาน Timeming ฉีกขาด",
    inspectorSignature: "วสันต์ นราแก้ว",
  },
  responsible: {
    supervisor: "ตันติกร",
    technician1: "วสันต์ นราแก้ว",
    technician2: "ณัฐพล ปิ่นแหลม",
    technician3: "",
  },
  duration: {
    startDate: "2026-08-28",
    endDate: "2026-09-03",
    totalDays: "7",
  },
  items: [
    { id: 1, name: "303090100090 Proximity Sw. OMRON E2E-X8MD 12-24 VDC", cleaning: false, qty: 1, unit: "PC", unitPrice: 899.42, amount: 899.42, refDoc: "D1SP26/128029" },
    { id: 2, name: "302020100094 Breaker CP30-BAMITSUBISHI", cleaning: false, qty: 1, unit: "PC", unitPrice: 1420.00, amount: 1420.00, refDoc: "D1SP26/128029" },
    { id: 3, name: "312010400040 Nut S/S หัวเปเปอร์ M4*10", cleaning: false, qty: 50, unit: "PC", unitPrice: 5.00, amount: 250.00, refDoc: "D1SP26/127990" },
    { id: 4, name: "302020100006 MCB ABB S241 S C16 5 KA 1P", cleaning: false, qty: 1, unit: "PC", unitPrice: 130.00, amount: 130.00, refDoc: "D1SP26/127990" },
    { id: 5, name: "302020100084 Circuit Breaker A9F74202 2P 2 Schneider", cleaning: false, qty: 1, unit: "PC", unitPrice: 837.90, amount: 837.90, refDoc: "D1SP26/127990" },
    { id: 6, name: "305060100011 หัว LAN RJ45", cleaning: false, qty: 10, unit: "PC", unitPrice: 8.00, amount: 80.00, refDoc: "D1SP26/127990" },
    { id: 7, name: "301180100001 Relay OMRON LY2N 220/240V 3A150V+Socket", cleaning: false, qty: 1, unit: "PC", unitPrice: 280.79, amount: 280.79, refDoc: "D1SP26/127990" },
    { id: 8, name: "302020100084 Circuit Breaker A9F74202 2P 2 Schneider", cleaning: false, qty: 1, unit: "PC", unitPrice: 837.90, amount: 837.90, refDoc: "D1SP26/127514" },
    { id: 9, name: "307100200004 Cable Ties 3 สีดำ", cleaning: false, qty: 300, unit: "PC", unitPrice: 0.16, amount: 48.00, refDoc: "D1SP26/127514" },
    { id: 10, name: "302020100009 MCB S243 S C10 5KA ABB", cleaning: false, qty: 1, unit: "PC", unitPrice: 918.00, amount: 918.00, refDoc: "D1SP26/127514" },
    { id: 11, name: "312090400023 หางปลาเปลือย T.LUG Y1.5-3S", cleaning: false, qty: 200, unit: "PC", unitPrice: 1.10, amount: 220.00, refDoc: "D1SP26/127131" },
    { id: 12, name: "316030400096 Oil Seal TC 50-80-10", cleaning: false, qty: 1, unit: "PC", unitPrice: 991.98, amount: 991.98, refDoc: "D1SP26/127131" },
    { id: 13, name: "312070400009 Screw หัวร่มแฉก M6*10 mm.SUS304", cleaning: false, qty: 20, unit: "PC", unitPrice: 1.17, amount: 34.40, refDoc: "D1SP26/127131" },
    { id: 14, name: "317120400628 สายพาน PU V-BELT PJ-1130-W20mm. Optibelt", cleaning: false, qty: 1, unit: "PC", unitPrice: 0.00, amount: 0.00, refDoc: "D1SP26/127131" },
    { id: 15, name: "312070400010 Screw หัวร่มแฉก M5*10 mm.SUS304", cleaning: false, qty: 20, unit: "PC", unitPrice: 1.00, amount: 20.00, refDoc: "D1SP26/127131" },
    { id: 16, name: "317010400021 Bearing 6208 2 RSH/C3", cleaning: false, qty: 1, unit: "PC", unitPrice: 253.00, amount: 253.00, refDoc: "D1SP26/127123" },
    { id: 17, name: "317010400476 Bearing 6007-2RS1/C3", cleaning: false, qty: 1, unit: "PC", unitPrice: 198.89, amount: 198.89, refDoc: "D1SP26/127123" },
    { id: 18, name: "301050100004 Inverter MITSUBISHI FR-S52E-0.75K", cleaning: false, qty: 1, unit: "SET", unitPrice: 5800.00, amount: 5800.00, refDoc: "D1SP26/127123" },
    { id: 19, name: "305010100031 Cable VCT Yazaki 2*2.5/2.5 Sq.mm", cleaning: false, qty: 10, unit: "PC", unitPrice: 90.97, amount: 909.70, refDoc: "D1SP26/127123" },
    { id: 20, name: "305080100006 Power Plug 2P+EPCE0132-6Vตัวผู้IP67/16A", cleaning: false, qty: 1, unit: "PC", unitPrice: 304.00, amount: 304.00, refDoc: "D1SP26/127123" },
    { id: 21, name: "301100100004 PowerSupply KEYENCE:MS2-H502.1AMP", cleaning: false, qty: 1, unit: "PC", unitPrice: 3150.00, amount: 3150.00, refDoc: "D1SP26/127123" },
    { id: 22, name: "304120100060 PushButtonXB4BW34B5 22mm RED LED24VAC/DC", cleaning: false, qty: 1, unit: "PC", unitPrice: 468.00, amount: 468.00, refDoc: "D1SP26/127116" },
    { id: 23, name: "301030100034 Panel GT2505-VTBD", cleaning: false, qty: 1, unit: "PC", unitPrice: 19000.00, amount: 19000.00, refDoc: "D1SP26/127116" },
    { id: 24, name: "304120100059 Push ButtonXB4BW33B522mmGreenLED24VAC/DC", cleaning: false, qty: 1, unit: "PC", unitPrice: 468.00, amount: 468.00, refDoc: "D1SP26/127116" },
    { id: 25, name: "ราง DIN ยึดอุปกรณ์", cleaning: false, qty: 1, unit: "M", unitPrice: 65.00, amount: 65.00, refDoc: "" },
    { id: 26, name: "รางวายดักส์(W25xH65)สีเทา BANDEX WD2565", cleaning: false, qty: 1, unit: "PC", unitPrice: 191.00, amount: 191.00, refDoc: "" },
    { id: 27, name: "สาย LanPatch 26AWGX4P Kuramo", cleaning: false, qty: 2, unit: "M", unitPrice: 209.44, amount: 418.88, refDoc: "" },
    { id: 28, name: "สายไฟYAZAKI/VCT-G 3*1.5/1.5SQ.MM", cleaning: false, qty: 1, unit: "M", unitPrice: 63.00, amount: 63.00, refDoc: "" },
    { id: 29, name: "เทอร์มินอลแบบใส่ราง BIG ONE TBR-10 15A", cleaning: false, qty: 20, unit: "PC", unitPrice: 7.95, amount: 159.00, refDoc: "" },
    { id: 30, name: "ฝาปิดท้ายเทอร์มินอล ''BIG ONE TBR1-3E", cleaning: false, qty: 1, unit: "PC", unitPrice: 4.95, amount: 4.95, refDoc: "" },
    { id: 31, name: "สต๊อปเปอร์รางปีกนก", cleaning: false, qty: 4, unit: "PC", unitPrice: 12.00, amount: 48.00, refDoc: "" },
    { id: 32, name: "หางปลาแฉกเปลือย 2.5-4s T.LUG", cleaning: false, qty: 20, unit: "PC", unitPrice: 2.00, amount: 60.00, refDoc: "" },
    { id: 33, name: "หางปลากลมเปลือย T.LUG / R2.5-4", cleaning: false, qty: 4, unit: "PC", unitPrice: 2.00, amount: 8.00, refDoc: "" },
    { id: 34, name: "หางปลากลมเปลือย T.LUG / R1.5-4", cleaning: false, qty: 2, unit: "PC", unitPrice: 4.00, amount: 4.00, refDoc: "" },
    { id: 35, name: "Relay G2R-1 24VDC", cleaning: false, qty: 2, unit: "PC", unitPrice: 118.00, amount: 236.00, refDoc: "" },
  ],
  summary: {
    status: "on_schedule", // "early" | "on_schedule" | "delayed"
    delayReason: "",
    handoverSign: "ตันติกร",
    handoverDate: "2026-09-03",
    customerStatus: "passed", // "passed" | "failed"
    customerFailReason: "",
    customerSign: "",
    customerDate: "",
    approverSign: "",
    approverDept: "",
    approverDate: "",
    officerSign: "",
    officerDate: "",
  }
};

export const getBlankFormData = () => {
  const today = new Date().toISOString().split("T")[0];
  return {
    header: {
      repairDocNo: "",
      docDate: today,
      workOrderNo: "",
      machineName: "",
      machineUsage: "",
      machineId: "",
      modelBrand: "",
      serialNo: "",
      plant: "",
      costCenter: "",
      contactPhone: "",
      initialSymptoms: "",
      targetDueDate: "",
    },
    inspection: {
      causeInspection: "",
      inspectorSignature: "",
    },
    responsible: {
      supervisor: "",
      technician1: "",
      technician2: "",
      technician3: "",
    },
    duration: {
      startDate: today,
      endDate: today,
      totalDays: "1",
    },
    items: [
      { id: 1, name: "", cleaning: false, qty: 1, unit: "PC", unitPrice: 0, amount: 0, refDoc: "" }
    ],
    summary: {
      status: "on_schedule",
      delayReason: "",
      handoverSign: "",
      handoverDate: "",
      customerStatus: "passed",
      customerFailReason: "",
      customerSign: "",
      customerDate: "",
      approverSign: "",
      approverDept: "",
      approverDate: "",
      officerSign: "",
      officerDate: "",
    }
  };
};

export const formatThaiDate = (dateStr) => {
  if (!dateStr) return "";
  // Check if already in DD/MM/YYYY format
  if (dateStr.includes("/")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const formatCurrency = (val, decimals = 3) => {
  const num = parseFloat(val);
  if (isNaN(num)) return "0.000";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};
