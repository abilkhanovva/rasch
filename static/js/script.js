let studentIndex = 0;
let students = [];
let questionCount = 3; // default, modal orqali o‘zgartiriladi

// Modal oynani ochish
const modal = document.getElementById('questionCountModal');
modal.style.display = "flex";

// Modal orqali savollar sonini olish
document.getElementById('saveQuestionCountBtn').onclick = () => {
    const val = parseInt(document.getElementById('questionCountInput').value);
    if (!val || val < 1) {
        alert("Savollar soni noto‘g‘ri!");
        return;
    }
    questionCount = val;
    students = [createStudent()]; // birinchi student
    studentIndex = 0;
    modal.style.display = "none";
    renderForm(students[0]);
};

// Yangi o'quvchi yaratish
function createStudent() {
    return {
        name: '',
        answers: Array(questionCount).fill(''),
        score: 0
    };
}

// Shake animatsiyasi
function shakeInput(input) {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 500);
}

// Validatsiya
function validateStudent(student) {
    let valid = true;
    const nameInput = document.querySelector('#formContainer input[type="text"]');
    if (!student.name.trim()) {
        shakeInput(nameInput);
        valid = false;
    }

    const answerInputs = document.querySelectorAll('#formContainer input[type="number"]');
    answerInputs.forEach((input, i) => {
        const val = student.answers[i];
        if (val !== '0' && val !== '1') {
            shakeInput(input);
            valid = false;
        }
    });

    return valid;
}

// Formani render qilish
function renderForm(student) {
    const container = document.getElementById('formContainer');
    container.innerHTML = '';

    // Sarlavha
    const heading = document.createElement('h3');
    heading.textContent = `${studentIndex + 1}-o‘quvchi`;
    container.appendChild(heading);

    // Ism input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Ism Familiya';
    nameInput.value = student.name;
    nameInput.oninput = e => student.name = e.target.value;
    container.appendChild(nameInput);

    // Javoblar container (gorizontal grid)
    const answersDiv = document.createElement('div');
    answersDiv.className = 'test-input';
    student.answers.forEach((val, i) => {
        const pair = document.createElement('div');
        pair.className = 'answer-pair';

        const span = document.createElement('span');
        span.textContent = (i + 1); // raqam yuqorida

        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0;
        input.max = 1;
        input.value = val;
        input.oninput = e => student.answers[i] = e.target.value;

        pair.appendChild(span);
        pair.appendChild(input);
        answersDiv.appendChild(pair);
    });
    container.appendChild(answersDiv);

    // O‘quvchini o‘chirish tugmasi
    const deleteStudentBtn = document.createElement('button');
    deleteStudentBtn.textContent = '❌ O‘quvchini o‘chirish';
    deleteStudentBtn.classList.add('delete-student');
    deleteStudentBtn.onclick = () => {
        if (!confirm('Haqiqatan ham bu o‘quvchini o‘chirmoqchimisiz?')) return;

        students.splice(studentIndex, 1);
        if (students.length === 0) {
            students.push(createStudent());
            studentIndex = 0;
        } else if (studentIndex >= students.length) {
            studentIndex = students.length - 1;
        }
        renderForm(students[studentIndex]);
    };
    container.appendChild(deleteStudentBtn);
}

// Tugmalar ishlashi
document.getElementById('addStudentBtn').onclick = () => {
    const currentStudent = students[studentIndex];
    if (!validateStudent(currentStudent)) return;

    const newStudent = createStudent();
    students.push(newStudent);
    studentIndex = students.length - 1;
    renderForm(newStudent);
};

document.getElementById('prevStudentBtn').onclick = () => {
    if (studentIndex > 0) {
        studentIndex--;
        renderForm(students[studentIndex]);
    }
};

document.getElementById('nextStudentBtn').onclick = () => {
    const currentStudent = students[studentIndex];
    if (!validateStudent(currentStudent)) return;

    if (studentIndex < students.length - 1) {
        studentIndex++;
    } else {
        const newStudent = createStudent();
        students.push(newStudent);
        studentIndex++;
    }
    renderForm(students[studentIndex]);
};

// Yakunlash
document.getElementById('finishBtn').onclick = () => {
    for (let s of students) {
        if (!validateStudent(s)) {
            alert("❌ Ba'zi o‘quvchilar to‘liq emas!");
            return;
        }
    }

    const payload = {
        students: students.map(s => ({
            name: s.name,
            answers: s.answers.map(a => parseInt(a) || 0)
        }))
    };

    fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        data.forEach((res, i) => students[i].score = res.score);
        renderResults();
    })
    .catch(error => {
        console.error('Xatolik:', error);
        alert("❌ Hisoblashda xatolik yuz berdi.");
    });
};

// Natijalarni chiqarish va Excel
function renderResults() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '<h2>Natijalar:</h2>';

    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    ['#', 'Ism Familiya', 'Javoblar', 'Baholash'].forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    students.forEach((s, i) => {
        const tr = document.createElement('tr');
        [i + 1, s.name, s.answers.join(', '), s.score].forEach(text => {
            const td = document.createElement('td');
            td.textContent = text;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    container.appendChild(table);

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '⬇️ Excelga yuklash';
    exportBtn.classList.add('primary');
    exportBtn.onclick = exportToExcel;
    container.appendChild(exportBtn);

    alert("✅ Hisoblash yakunlandi! Natijalar pastda ko‘rsatilmoqda.");
}

// Excelga eksport
function exportToExcel() {
    const wb = XLSX.utils.book_new();

    students.forEach((student, idx) => {
        const sheetName = student.name.substring(0, 28) + (idx + 1);
        const sheetData = [
            ['Ism', 'Javoblar', 'Baholash'],
            [student.name, student.answers.join(', '), student.score]
        ];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rash_modeli_natijalari.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
