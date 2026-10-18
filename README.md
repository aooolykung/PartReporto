# ระบบใบบันทึกการเปลี่ยนอะไหล่เครื่องจักร (Overhaul)

เว็บแอปพลิเคชันสำหรับกรอกข้อมูล ตรวจสอบ และสั่งพิมพ์เอกสาร **"ใบบันทึกการเปลี่ยนอะไหล่เครื่องจักร (Overhaul)"** ตามแบบฟอร์มมาตรฐานกระดาษ A4 แนวนอน (Landscape) พร้อมระบบแบ่งหน้าอัตโนมัติ (Dynamic Pagination) และระบบนำเข้าไฟล์ Excel/CSV

🌐 **Live Demo (GitHub Pages):** `https://aooolykung.github.io/PartReporto/`

---

## ✨ ฟีเจอร์หลัก (Key Features)

1. **ถอดแบบเอกสารทางการ 1:1 (A4 Landscape Print Layout)**:
   - ข้อมูลลูกค้าและเครื่องจักร (Customer & Machine Info)
   - ผลตรวจเช็คสาเหตุ ช่างผู้ปฏิบัติงาน และระยะเวลาทำงาน
   - ตารางรายการอะไหล่พร้อมคำนวณราคารวมอัตโนมัติ
   - สรุปผลการ Overhaul การส่งมอบงาน การตรวจรับของลูกค้า และผู้อนุมัติ
2. **ระบบแบ่งหน้าอัตโนมัติ (Dynamic Pagination Engine)**:
   - ปรับจำนวนหน้าเพิ่มหรือลดตามจำนวนรายการอะไหล่จริง (1 หน้า, 2 หน้า, 3 หน้า, 4+ หน้า)
   - มีตัวเลือกล็อกแม่แบบมาตรฐาน 3 หน้า 50 แถว
3. **ระบบอัปโหลดไฟล์อะไหล่ (Excel & CSV Import)**:
   - รองรับไฟล์ `.xlsx`, `.xls`, `.csv` และคัดลอกข้อความมาวาง (Paste)
   - ตรวจจับคอลัมน์ `docNo`, `Materialnum`, `Material_Des`, `amount`, `unit`, `price` อัตโนมัติ
   - เลือกว่าราคาในไฟล์คือราคารวม (Total) หรือราคาต่อหน่วย (Unit Price)
4. **ความกว้างคอลัมน์คงที่ (Locked Column Widths)**:
   - บังคับความกว้างคอลัมน์ตายตัว ไม่ยืดขยายผิดสัดส่วนเมื่อพิมพ์ข้อความยาว
   - มีระบบตัดคำอัตโนมัติ (Word Break)
5. **การจัดการข้อมูลและการพิมพ์**:
   - บันทึกร่างอัตโนมัติลงใน LocalStorage
   - ส่งออก/นำเข้าไฟล์สำรอง JSON
   - ปุ่ม **"พิมพ์ / ส่งออก PDF"** จัดหน้าสำหรับเครื่องพิมพ์และ PDF A4 แนวนอนโดยเฉพาะ

---

## 🛠️ การติดตั้งและรันในเครื่อง (Local Development)

```bash
# ติดตั้ง dependencies
npm install

# รัน Development Server
npm run dev
# หรือ
npm start

# สั่ง Build สำหรับ Production
npm run build
```

---

## 🚀 การ Deploy ขึ้น GitHub Pages

โปรเจกต์นี้ตั้งค่า GitHub Actions ไว้ใน `.github/workflows/deploy.yml` เรียบร้อยแล้ว:
1. Push โค้ดขึ้น branch `main`
2. ไปที่ **Settings** > **Pages** บน GitHub
3. เลือก Source เป็น **GitHub Actions**
