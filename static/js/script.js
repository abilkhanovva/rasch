/**
 * Rash Model Baholash - Dinamik savollar soni bilan optimallashgan JS
 */

let studentsData = [];
let currentStudentIndex = 0;
let questionCount = 0;

// Elementlarni tanlab olish
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

/**
 * 1. Ilovani ishga tushirish
 * Oyna miltillab o'chib ketmasligi uchun har doim modalni ko'rsatamiz
 */
function initApp() {
    // Eski saqlangan ma'lumotlarni tozalaymiz (yangi seans uchun)
    localStorage.removeItem('questionCount');
    studentsData = [];
    currentStudentIndex = 0;

    // Modal oynani ko'rsatish
    questionCountModal.style.display = 'flex';
    questionCountInput.value = ""; 
    questionCountInput.focus();
}

/**
 * 2. Savollar sonini tasdiqlash
 */
saveQuestionCountBtn.addEventListener('click', () => {
    const count = parseInt(questionCountInput.value);
    if (count > 0 && count <= 100) {
        questionCount = count;
        // Xotiraga saqlash (ixtiyoriy, lekin seans davomida kerak bo'lishi mumkin)
        localStorage.setItem('questionCount', count);
        
        // Modalni yopish va birinchi o'quvchini yaratish
        questionCountModal.style.display = 'none';
        addStudent();
    } else {
        alert("Iltimos, 1 dan 100 gacha son kiriting.");
        questionCountInput.focus();
    }
});

/**
 * 3. Validatsiya (Xatolarni ko'rsatish)
 */
function validateCurrentStudent() {
    if (studentsData.length === 0) return true;

    const student = studentsData[currentStudentIndex];
    const nameInput = document.getElementById('studentNameInput');
    const table = document.querySelector('.answers-table');
    let isValid = true;

    if (!student.name || student.name.trim() === "") {
        nameInput.classList.add('shake-error', 'input-error');
        setTimeout(() => nameInput.classList.remove('shake-error'), 400);
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
                headerCell.classList.add('header-error');
                cells.forEach(cell => cell.classList.add('cell-error'));
            } else {
                headerCell.classList.remove('header-error');
                cells.forEach(cell => cell.classList.remove('cell-error'));
            }
        });
    }
    return isValid;
}

/**
 * 4. O'quvchi qo'shish va ko'rsatish
 */
function addStudent() {
    if (studentsData.length > 0 && !validateCurrentStudent()) {
        return; // Validatsiyadan o'tmasa yangi qo'shmaydi
    }

    studentsData.push({
        name: '',
        answers: Array(questionCount).fill(null)
    });
    currentStudentIndex = studentsData.length - 1;
    displayCurrentStudent();
}

function displayCurrentStudent() {
    if (questionCount === 0 || studentsData.length === 0) return;

    const student = studentsData[currentStudentIndex];
    
    // Jadval sarlavhasi (1, 2, 3...)
    let headerHtml = '<td>Javob</td>';
    for (let i = 1; i <= questionCount; i++) {
        headerHtml += `<th>${i}</th>`;
    }

    // Radio qatorlari (1 va 0)
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
        <div class="student-form card animate-fade-in">
            <h2>👤 ${currentStudentIndex + 1}-o‘quvchi / ${studentsData.length}</h2>
            <div class="name-delete-group" style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="studentNameInput" class="form-control"
                       value="${student.name}" 
                       placeholder="O'quvchi ismini kiriting..." 
                       oninput="updateName(this.value)">
                <button class="btn delete-btn" type="button" onclick="deleteCurrentStudent()">❌ O‘chirish</button>
            </div>
            <div class="answers-section">
                <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #eee;">
                    <table class="answers-table">
                        <thead><tr>${headerHtml}</tr></thead>
                        <tbody>
                            <tr>${generateRow(1)}</tr>
                            <tr>${generateRow(0)}</tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    updateNavButtons();
}

/**
 * 5. Ma'lumotlarni yangilash
 */
window.updateAnswer = function(questionIndex, value) {
    if (studentsData[currentStudentIndex]) {
        studentsData[currentStudentIndex].answers[questionIndex] = value;
        
        // Belgilangan zahoti qizil rangni o'chirish
        const table = document.querySelector('.answers-table');
        if (table) {
            const headers = table.querySelectorAll('thead th');
            headers[questionIndex + 1].classList.remove('header-error');
            const cells = table.querySelectorAll(`td:nth-child(${questionIndex + 2})`);
            cells.forEach(c => c.classList.remove('cell-error'));
        }
    }
};

window.updateName = function(newName) {
    if (studentsData[currentStudentIndex]) {
        studentsData[currentStudentIndex].name = newName;
        const input = document.getElementById('studentNameInput');
        if (newName.trim() !== "") input.classList.remove('input-error');
    }
};

/**
 * 6. Boshqaruv
 */
function updateNavButtons() {
    prevStudentBtn.disabled = currentStudentIndex === 0;
    nextStudentBtn.disabled = currentStudentIndex === studentsData.length - 1;
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

window.deleteCurrentStudent = function() {
    if (studentsData.length > 1) {
        if (confirm("Ushbu o'quvchini ro'yxatdan o'chirasizmi?")) {
            studentsData.splice(currentStudentIndex, 1);
            currentStudentIndex = Math.max(0, currentStudentIndex - 1);
            displayCurrentStudent();
        }
    } else {
        alert("Kamida bitta o'quvchi bo'lishi shart!");
    }
};

/**
 * 7. Excel va Yakunlash
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

            const imported = json.slice(1).filter(row => row.length > 0).map(row => ({
                name: row[0] ? String(row[0]).trim() : "Noma'lum",
                answers: row.slice(1, questionCount + 1).map(v => {
                    let val = parseInt(v);
                    return (val === 0 || val === 1) ? val : null;
                })
            }));

            if (imported.length > 0) {
                studentsData = imported;
                currentStudentIndex = 0;
                displayCurrentStudent();
                clearDataBtn.style.display = 'inline-flex';
            }
        } catch (err) {
            alert("Excel faylni o'qishda xatolik!");
        }
    };
    reader.readAsArrayBuffer(file);
};

finishBtn.onclick = async () => {
    if (!validateCurrentStudent()) return;
    
    finishBtn.disabled = true;
    finishBtn.innerHTML = '⌛ Hisoblanmoqda...';

    try {
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ students: studentsData })
        });
        const result = await response.json();
        console.log("Natijalar:", result);
        alert("Hisoblash yakunlandi! Natijalarni konsolda ko'rishingiz mumkin.");
    } catch (err) {
        alert("Server bilan aloqa xatosi!");
    } finally {
        finishBtn.disabled = false;
        finishBtn.innerHTML = '✅ Yakunlash va Natija';
    }
};

// Dasturni ishga tushirish
document.addEventListener('DOMContentLoaded', initApp);