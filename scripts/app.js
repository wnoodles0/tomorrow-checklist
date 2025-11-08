// scripts/app.js

const CHECKLIST_STORAGE_KEY = 'tomorrowChecklistStatus';
const checklistContainer = document.getElementById('checklist-container');
let currentChecklist = [];

// 1. โหลดสถานะ done จาก Local Storage
function loadChecklistStatus() {
    const storedStatus = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    return storedStatus ? JSON.parse(storedStatus) : {};
}

// 2. บันทึกสถานะ done ลง Local Storage
function saveChecklistStatus(checklist) {
    const statusToStore = checklist.reduce((acc, item) => {
        acc[item.id] = item.done;
        return acc;
    }, {});
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(statusToStore));
}

// 3. สร้าง HTML สำหรับรายการเช็กลิสต์
function createChecklistItemHTML(item) {
    const li = document.createElement('li');
    li.className = `checklist-item ${item.done ? 'done' : ''}`;
    li.dataset.id = item.id;

    // ใช้ label ครอบ checkbox เพื่อให้คลิกได้ง่ายขึ้น (Mobile-friendly)
    const label = document.createElement('label');
    label.className = 'item-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.done;
    checkbox.dataset.id = item.id;

    const itemText = document.createElement('span');
    itemText.className = 'item-text';
    itemText.textContent = item.name;

    label.appendChild(checkbox);
    label.appendChild(itemText);
    li.appendChild(label);

    return li;
}

// 4. แสดงผลรายการเช็กลิสต์
function renderChecklist(checklist) {
    checklistContainer.innerHTML = ''; // ล้างรายการเดิม
    if (checklist.length === 0) {
        checklistContainer.innerHTML = '<li class="empty-message">ไม่พบรายการสินค้า</li>';
        return;
    }

    checklist.forEach(item => {
        const itemElement = createChecklistItemHTML(item);
        checklistContainer.appendChild(itemElement);
    });
}

// 5. จัดการการติ๊กเช็ก
function handleToggleComplete(event) {
    const checkbox = event.target;
    if (checkbox.type === 'checkbox') {
        const itemId = checkbox.dataset.id;
        const isDone = checkbox.checked;

        // อัปเดตสถานะใน currentChecklist
        const itemIndex = currentChecklist.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            currentChecklist[itemIndex].done = isDone;
            // อัปเดต class เพื่อเปลี่ยนสไตล์ (จางลง)
            const listItem = checkbox.closest('.checklist-item');
            if (listItem) {
                listItem.classList.toggle('done', isDone);
            }
            // บันทึกสถานะใหม่ลง Local Storage
            saveChecklistStatus(currentChecklist);
        }
    }
}

// 6. ฟังก์ชันรีเซ็ตเช็กลิสต์
function resetChecklist() {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตเช็กลิสต์ทั้งหมด? สถานะการติ๊กทั้งหมดจะถูกล้าง')) {
        return;
    }

    // ล้างสถานะ done ทั้งหมด
    currentChecklist = currentChecklist.map(item => ({
        ...item,
        done: false
    }));

    // บันทึกสถานะใหม่ (ว่างเปล่า)
    saveChecklistStatus(currentChecklist);

    // แสดงผลใหม่
    renderChecklist(currentChecklist);
    alert('รีเซ็ตเช็กลิสต์เรียบร้อยแล้วค่ะ!');
}

// 7. ฟังก์ชันคัดลอกรายการที่ยังไม่เสร็จ
function copyUncheckedItems() {
    const uncheckedItems = currentChecklist
        .filter(item => !item.done)
        .map(item => `- ${item.name}`)
        .join('\n');

    if (uncheckedItems.length === 0) {
        alert('ไม่มีรายการที่ยังไม่เสร็จให้คัดลอกค่ะ');
        return;
    }

    navigator.clipboard.writeText(uncheckedItems)
        .then(() => {
            alert('คัดลอกรายการที่ยังไม่เสร็จไปยังคลิปบอร์ดแล้วค่ะ!');
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            alert('ไม่สามารถคัดลอกได้ กรุณาลองใหม่ค่ะ');
        });
}

// 7. โหลดข้อมูลเริ่มต้น
async function loadInitialData() {
    try {
        // โหลดรายการสินค้าจาก data/items.json
        const response = await fetch('data/items.json');
        const initialItems = await response.json();

        // โหลดสถานะ done จาก Local Storage
        const statusMap = loadChecklistStatus();

        // ผสานข้อมูล: ใช้สถานะ done จาก Local Storage
        currentChecklist = initialItems.map(item => ({
            ...item,
            done: statusMap[item.id] || false // ถ้าไม่มีใน Local Storage ให้เป็น false
        }));

        // เรียงตาม order เสมอ (ตามแนวทาง "รายการแบบมีลำดับคงที่")
        currentChecklist.sort((a, b) => a.order - b.order);

        // แสดงผล
        renderChecklist(currentChecklist);

        // เพิ่ม Event Listener สำหรับการติ๊กเช็ก
        checklistContainer.addEventListener('change', handleToggleComplete);

    } catch (error) {
        console.error('Error loading initial data:', error);
        checklistContainer.innerHTML = '<li class="error-message">เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่</li>';
    }
}

// เริ่มต้นแอปพลิเคชัน
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();

    // ผูก Event Listener กับปุ่ม
    document.getElementById('copy-button').addEventListener('click', copyUncheckedItems);
    document.getElementById('reset-button').addEventListener('click', resetChecklist);
});
