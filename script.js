// Application Variables
let allQuestionsData = null;
let currentUnit = null;
let currentQuestions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let autoTransitionTimer = null;

// Helper Functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Load all questions from JSON file
async function loadAllQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allQuestionsData = data;
        return true;
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error loading questions. Please make sure the "questions.json" file exists in the same folder.');
        return false;
    }
}

// Screen Navigation Functions
function showMenu() {
    document.getElementById('menuScreen').classList.remove('hidden');
    document.getElementById('quizScreen').classList.add('hidden');
    if (autoTransitionTimer) {
        clearTimeout(autoTransitionTimer);
        autoTransitionTimer = null;
    }
}

function showQuiz() {
    document.getElementById('menuScreen').classList.add('hidden');
    document.getElementById('quizScreen').classList.remove('hidden');
    document.getElementById('quizArea').classList.add('hidden');
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('loadingArea').classList.remove('hidden');
    document.getElementById('completionMessage').classList.add('hidden');
}

function showQuizContent() {
    document.getElementById('loadingArea').classList.add('hidden');
    document.getElementById('quizArea').classList.remove('hidden');
    document.getElementById('resultArea').classList.add('hidden');
}

function showResult() {
    document.getElementById('quizArea').classList.add('hidden');
    document.getElementById('resultArea').classList.remove('hidden');
    renderResult();
}

function backToMenu() {
    showMenu();
    currentUnit = null;
    currentQuestions = [];
    userAnswers = [];
    currentQuestionIndex = 0;
    if (autoTransitionTimer) {
        clearTimeout(autoTransitionTimer);
        autoTransitionTimer = null;
    }
}

// Load Unit from the single JSON file
async function loadUnit(unitIndex) {
    const unitNames = ['unit1', 'unit2', 'unit3', 'unit4', 'unit5'];
    currentUnit = unitNames[unitIndex];
    showQuiz();
    
    if (!allQuestionsData) {
        const success = await loadAllQuestions();
        if (!success) {
            backToMenu();
            return;
        }
    }
    
    if (allQuestionsData[currentUnit]) {
        currentQuestions = allQuestionsData[currentUnit].map(q => ({...q}));
        userAnswers = new Array(currentQuestions.length).fill(null);
        currentQuestionIndex = 0;
        showQuizContent();
        renderQuestion();
    } else {
        alert(`Error: Unit ${currentUnit} not found in questions.json`);
        backToMenu();
    }
}

async function loadComprehensive() {
    currentUnit = 'comprehensive';
    showQuiz();
    
    if (!allQuestionsData) {
        const success = await loadAllQuestions();
        if (!success) {
            backToMenu();
            return;
        }
    }
    
    let allQuestions = [];
    const unitNames = ['unit1', 'unit2', 'unit3', 'unit4', 'unit5'];
    
    for (const unit of unitNames) {
        if (allQuestionsData[unit]) {
            allQuestions = allQuestions.concat(allQuestionsData[unit]);
        }
    }
    
    if (allQuestions.length === 0) {
        alert('No questions found in questions.json');
        backToMenu();
        return;
    }
    
    allQuestions = shuffleArray(allQuestions);
    currentQuestions = allQuestions.slice(0, 50).map(q => ({...q}));
    userAnswers = new Array(currentQuestions.length).fill(null);
    currentQuestionIndex = 0;
    showQuizContent();
    renderQuestion();
}

// Question Display and Interaction Functions
function renderQuestion() {
    if (currentQuestions.length === 0) return;
    
    if (autoTransitionTimer) {
        clearTimeout(autoTransitionTimer);
        autoTransitionTimer = null;
    }
    
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('questionText').textContent = q.question;
    document.getElementById('progressText').textContent = `Question ${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    document.getElementById('completionMessage').classList.add('hidden');
    
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (userAnswers[currentQuestionIndex] === index) {
            btn.classList.add('selected');
        }
        btn.textContent = opt;
        btn.onclick = () => selectOption(index);
        optionsContainer.appendChild(btn);
    });
    
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
}

function selectOption(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;
    
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, idx) => {
        if (idx === optionIndex) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
        if (autoTransitionTimer) {
            clearTimeout(autoTransitionTimer);
        }
        autoTransitionTimer = setTimeout(() => {
            currentQuestionIndex++;
            renderQuestion();
            autoTransitionTimer = null;
        }, 500);
    } else {
        document.getElementById('completionMessage').classList.remove('hidden');
        if (autoTransitionTimer) {
            clearTimeout(autoTransitionTimer);
        }
        autoTransitionTimer = setTimeout(() => {
            showResult();
            autoTransitionTimer = null;
        }, 1000);
    }
}

function goToPrevQuestion() {
    if (currentQuestionIndex > 0) {
        if (autoTransitionTimer) {
            clearTimeout(autoTransitionTimer);
            autoTransitionTimer = null;
        }
        currentQuestionIndex--;
        renderQuestion();
    }
}

// Result Display Function
function renderResult() {
    const totalQuestions = currentQuestions.length;
    let correctCount = 0;
    
    userAnswers.forEach((ans, idx) => {
        if (ans !== null && ans === currentQuestions[idx].correct) {
            correctCount++;
        }
    });
    
    document.getElementById('scoreValue').textContent = correctCount;
    document.getElementById('totalQuestionsValue').textContent = totalQuestions;
    
    const reviewContainer = document.getElementById('answersReview');
    reviewContainer.innerHTML = '';
    
    currentQuestions.forEach((q, idx) => {
        const userAnsIndex = userAnswers[idx];
        const userAnsText = userAnsIndex !== null ? q.options[userAnsIndex] : 'Not answered';
        const correctAnsText = q.options[q.correct];
        const isCorrect = (userAnsIndex !== null && userAnsIndex === q.correct);
        
        const reviewDiv = document.createElement('div');
        reviewDiv.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
        
        let answerHtml = '';
        if (isCorrect) {
            answerHtml = `<span class="user-answer correct-answer">✅ Your answer: ${userAnsText}</span>`;
        } else {
            answerHtml = `
                <span class="user-answer wrong-answer">❌ Your answer: ${userAnsText}</span><br>
                <span class="correct-answer">✓ Correct answer: ${correctAnsText}</span>
            `;
        }
        
        reviewDiv.innerHTML = `
            <p><strong>Question ${idx + 1}:</strong> ${q.question}</p>
            <p>${answerHtml}</p>
        `;
        reviewContainer.appendChild(reviewDiv);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Menu buttons
    const unitButtons = document.querySelectorAll('.menu-btn[data-unit]');
    unitButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const unitIndex = parseInt(btn.getAttribute('data-unit'));
            loadUnit(unitIndex);
        });
    });
    
    // Comprehensive button
    document.getElementById('comprehensiveBtn').addEventListener('click', loadComprehensive);
    
    // Back buttons
    document.getElementById('backToMenuBtn').addEventListener('click', backToMenu);
    document.getElementById('returnToMenuBtn').addEventListener('click', backToMenu);
    
    // Previous button
    document.getElementById('prevBtn').addEventListener('click', goToPrevQuestion);
});
