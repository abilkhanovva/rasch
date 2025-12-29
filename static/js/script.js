let studentsData = [];
let currentStudentIndex = 0;
let questionCount = 0;

// DOM elementlarini tanlab olish
const questionCountModal = document.getElementById('questionCountModal');
const questionCountInput = document.getElementById('questionCountInput');
const saveQuestionCountBtn = document.getElementById('saveQuestionCountBtn');
const formContainer = document.getElementById('formContainer');
const addStudentBtn = document.getElementById('addStudentBtn');
const prevStudentBtn = document.getElementById('prevStudentBtn');
const nextStudentBtn = document.getElementById('nextStudentBtn');
const finishBtn = document.getElementById('finishBtn');
const uploadExcelInput = document.getElementById('uploadExcel');
const fileStatus = document.getElementById('fileStatus');
const clearDataBtn = document.getElementById('clearDataBtn');
const resultContainer = document.getElementById('resultContainer');
const resultContent = document.getElementById('resultContent');

/**
 * Ilovani boshlang'ich holatga qaytarish
 */
function initApp() {
    localStorage.removeItem('questionCount');
    studentsData = [];
    currentStudentIndex = 0;
    
    if (resultContainer) resultContainer.style.display = 'none';
    if (formContainer) formContainer.innerHTML = '';

    questionCountModal.style.display = 'flex';
    questionCountInput.value = " "; 
    questionCountInput.focus();
    
    if (clearDataBtn) clearDataBtn.style.display = 'none';
}

/**
 * Savollar sonini tasdiqlash
 */
saveQuestionCountBtn.addEventListener('click', () => {
    const count = parseInt(questionCountInput.value);
    if (count > 0 && count <= 100) {
        questionCount = count;
        localStorage.setItem('questionCount', count);
        questionCountModal.style.display = 'none';
        addStudent(); 
    } else {
        alert("Iltimos, 1 dan 100 gacha son kiriting.");
        questionCountInput.focus();
    }
});

/**
 * Joriy o'quvchi ma'lumotlari to'ldirilganini tekshirish
 */
function validateCurrentStudent() {
    if (studentsData.length === 0) return true;

    const student = studentsData[currentStudentIndex];
    const nameInput = document.getElementById('studentNameInput');
    const table = document.querySelector('.answers-table');
    let isValid = true;

    if (!student.name || student.name.trim() === "") {
        if (nameInput) {
            nameInput.classList.add('shake-error', 'input-error');
            setTimeout(() => nameInput.classList.remove('shake-error'), 400);
        }
        isValid = false;
    }

    if (table) {
        const headers = table.querySelectorAll('thead th');
        student.answers.forEach((ans, index) => {
            const questionPos = index + 1;
            const headerCell = headers[questionPos];
            const cells = table.querySelectorAll(`td:nth-child(${questionPos + 1})`);

            if (ans === null) {
                isValid = false;
                if (headerCell) headerCell.classList.add('header-error');
                cells.forEach(cell => cell.classList.add('cell-error'));
            } else {
                if (headerCell) headerCell.classList.remove('header-error');
                cells.forEach(cell => cell.classList.remove('cell-error'));
            }
        });
    }
    return isValid;
}

/**
 * Ro'yxatga yangi o'quvchi qo'shish
 */
function addStudent() {
    if (studentsData.length > 0 && !validateCurrentStudent()) return;

    studentsData.push({
        name: '',
        answers: Array(questionCount).fill(null)
    });
    currentStudentIndex = studentsData.length - 1;
    displayCurrentStudent();
}

/**
 * Joriy o'quvchi formasini chizish
 */
function displayCurrentStudent() {
    if (questionCount === 0 || studentsData.length === 0) return;

    const student = studentsData[currentStudentIndex];
    
    let headerHtml = '<td>Ball / Savol</td>';
    for (let i = 1; i <= questionCount; i++) {
        headerHtml += `<th>${i}</th>`;
    }

    const generateRow = (score) => {
        let cells = `<th>${score}</th>`;
        for (let i = 0; i < questionCount; i++) {
            const isChecked = student.answers[i] === score ? 'checked' : '';
            cells += `
                <td>
                    <input type="radio" id="ans_${score}_${i}" name="q_${i}" 
                           value="${score}" ${isChecked} 
                           onchange="updateAnswer(${i}, ${score})">
                    <label for="ans_${score}_${i}"></label>
                </td>`;
        }
        return cells;
    };

    formContainer.innerHTML = `
        <div class="student-form animate-fade-in">
            <h2>👤 ${currentStudentIndex + 1}-o‘quvchi / ${studentsData.length}</h2>
            <div class="name-delete-group">
                <input type="text" id="studentNameInput" 
                       value="${student.name}" 
                       placeholder="O'quvchi ismini kiriting..." 
                       oninput="updateName(this.value)">
                <button class="btn delete-btn" type="button" onclick="deleteCurrentStudent()">❌ O‘chirish</button>
            </div>
            <div class="answers-section">
                <table class="answers-table">
                    <thead><tr>${headerHtml}</tr></thead>
                    <tbody>
                        <tr>${generateRow(1)}</tr>
                        <tr>${generateRow(0)}</tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    updateNavButtons();
}

// Global window funksiyalari (onchange va onclick uchun)
window.updateAnswer = function(questionIndex, value) {
    if (studentsData[currentStudentIndex]) {
        studentsData[currentStudentIndex].answers[questionIndex] = value;
        const table = document.querySelector('.answers-table');
        if (table) {
            const headers = table.querySelectorAll('thead th');
            if(headers[questionIndex + 1]) headers[questionIndex + 1].classList.remove('header-error');
            const cells = table.querySelectorAll(`td:nth-child(${questionIndex + 2})`);
            cells.forEach(c => c.classList.remove('cell-error'));
        }
    }
};

window.updateName = function(newName) {
    if (studentsData[currentStudentIndex]) {
        studentsData[currentStudentIndex].name = newName;
        const input = document.getElementById('studentNameInput');
        if (input && newName.trim() !== "") input.classList.remove('input-error');
    }
};

window.deleteCurrentStudent = function() {
    if (studentsData.length > 1) {
        if (confirm("Haqiqatdan ham o'chirmoqchimisiz?")) {
            studentsData.splice(currentStudentIndex, 1);
            currentStudentIndex = Math.max(0, currentStudentIndex - 1);
            displayCurrentStudent();
        }
    } else {
        alert("Kamida bitta o'quvchi bo'lishi shart!");
    }
};

/**
 * Oldingi/Keyingi tugmalarini boshqarish
 */
function updateNavButtons() {
    prevStudentBtn.disabled = (currentStudentIndex === 0);
    nextStudentBtn.disabled = (currentStudentIndex === studentsData.length - 1);
}

prevStudentBtn.onclick = () => {
    if (currentStudentIndex > 0) {
        currentStudentIndex--;
        displayCurrentStudent();
    }
};

nextStudentBtn.onclick = () => {
    if (validateCurrentStudent()) {
        currentStudentIndex++;
        displayCurrentStudent();
    }
};

addStudentBtn.onclick = addStudent;

/**
 * Excel faylni yuklash va o'qish
 */
uploadExcelInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileStatus.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, {header: 1});

            if (json.length > 0) {
                const excelColCount = json[0].length - 1; 

                if (excelColCount !== questionCount) {
                    if (confirm(`Yuklangan faylda ${excelColCount} ta savol bor. Tizimni bunga moslaymizmi?`)) {
                        questionCount = excelColCount;
                        localStorage.setItem('questionCount', questionCount);
                    } else {
                        return;
                    }
                }

                studentsData = json.slice(1).filter(row => row.length > 0).map(row => ({
                    name: row[0] ? String(row[0]).trim() : "Noma'lum",
                    answers: Array.from({length: questionCount}, (_, i) => {
                        let v = parseInt(row[i + 1]);
                        return (v === 0 || v === 1) ? v : null;
                    })
                }));

                currentStudentIndex = 0;
                displayCurrentStudent();
                if (clearDataBtn) clearDataBtn.style.display = 'inline-flex';
            }
        } catch (err) {
            alert("Excel o'qishda xato!");
        }
    };
    reader.readAsArrayBuffer(file);
};

/**
 * YAKUNLASH VA NATIJANI CHIQARISH
 */
finishBtn.onclick = async () => {
    if (!validateCurrentStudent()) {
        alert("Iltimos, barcha maydonlarni to'ldiring!");
        return;
    }
    
    finishBtn.disabled = true;
    const originalText = finishBtn.innerHTML;
    finishBtn.innerHTML = '⌛ Hisoblanmoqda...';

    try {
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ students: studentsData })
        });

        if (!response.ok) throw new Error("Serverdan javob olishda xatolik!");

        const results = await response.json(); // app.py dan kelgan list
        
        // Natijalar oynasini ko'rsatish
        if (resultContainer && resultContent) {
            resultContainer.style.display = 'block';
            
            let html = `
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse: collapse; margin-top:15px; background: white;">
                        <thead>
                            <tr style="background:#27ae60; color: white;">
                                <th style="border:1px solid #ddd; padding:10px;">O'quvchi</th>
                                <th style="border:1px solid #ddd; padding:10px;">To'g'ri javob</th>
                                <th style="border:1px solid #ddd; padding:10px;">Vaznli ball</th>
                                <th style="border:1px solid #ddd; padding:10px;">Theta (Θ)</th>
                                <th style="border:1px solid #ddd; padding:10px;">Yakuniy ball</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            results.forEach(row => {
                html += `
                    <tr>
                        <td style="border:1px solid #ddd; padding:10px; font-weight:bold;">${row.name}</td>
                        <td style="border:1px solid #ddd; padding:10px; text-align:center;">${row.raw_score}</td>
                        <td style="border:1px solid #ddd; padding:10px; text-align:center;">${row.weighted_score}</td>
                        <td style="border:1px solid #ddd; padding:10px; text-align:center;">${row.theta}</td>
                        <td style="border:1px solid #ddd; padding:10px; text-align:center; font-weight:bold; color:#2c3e50;">${row.score}</td>
                    </tr>`;
            });
            
            html += `</tbody></table></div>`;
            
            // Natijalar jadvalining oxiriga qo'shiladigan qism
            html += `</tbody></table>
                <div style="margin-top: 20px; text-align: right;">
                    <button onclick="downloadExcelFile()" class="btn success" style="padding: 10px 20px; cursor: pointer;">
                        📥 Natijalarni Excelda yuklab olish
                    </button>
                </div>`;
            resultContent.innerHTML = html;
            resultContainer.scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (err) {
        console.error("Xatolik:", err);
        alert("Xatolik yuz berdi: " + err.message);
    } finally {
        finishBtn.disabled = false;
        finishBtn.innerHTML = originalText;
    }
};

/**
 * Serverdan Excel faylni yuklab olish funksiyasi
 */
window.downloadExcelFile = async function() {
    // Agar o'quvchilar ma'lumoti bo'lmasa, yuklab olib bo'lmaydi
    if (studentsData.length === 0) {
        alert("Yuklab olish uchun ma'lumot mavjud emas!");
        return;
    }

    try {
        const response = await fetch('/download_excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ students: studentsData })
        });

        if (!response.ok) throw new Error("Faylni shakllantirishda xatolik yuz berdi.");

        // Faylni blob formatida qabul qilish
        const blob = await response.blob();
        
        // Brauzerda vaqtinchalik havola yaratish
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Rasch_Model_Natijalari.xlsx"; // Yuklanadigan fayl nomi
        document.body.appendChild(a);
        a.click();
        
        // Havolani tozalash
        window.URL.revokeObjectURL(url);
        a.remove();
        
    } catch (err) {
        console.error("Excel yuklashda xato:", err);
        alert("Excel faylni yuklab olishda xatolik: " + err.message);
    }
};

if (clearDataBtn) {
    clearDataBtn.onclick = () => {
        if (confirm("Barcha ma'lumotlar o'chirib yuborilsinmi?")) {
            initApp();
        }
    };
}

// Sahifa yuklanganda ilovani boshlash
document.addEventListener('DOMContentLoaded', initApp);