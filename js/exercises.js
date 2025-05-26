class ExerciseManager {
    constructor() {
        this.currentExercise = null;
        this.userProgress = {
            totalAttempts: 0,
            correctAnswers: 0,
            categories: {}
        };
        this.initializeEventListeners();
    }

    async loadExercise(category, difficulty = null) {
        try {
            const response = await fetch(`/api/exercise/${category}${difficulty ? `?difficulty=${difficulty}` : ''}`);
            this.currentExercise = await response.json();
            this.renderExercise();
        } catch (error) {
            console.error('Failed to load exercise:', error);
        }
    }

    renderExercise() {
        const container = document.getElementById('current-exercise');
        const exercise = this.currentExercise;
        
        let exerciseHTML = '';
        
        switch (exercise.type) {
            case 'text_input':
                exerciseHTML = this.renderTextInput(exercise);
                break;
            case 'multiple_choice':
                exerciseHTML = this.renderMultipleChoice(exercise);
                break;
            case 'conjugation':
                exerciseHTML = this.renderConjugation(exercise);
                break;
            case 'drag_drop':
                exerciseHTML = this.renderDragDrop(exercise);
                break;
        }
        
        container.innerHTML = exerciseHTML;
        this.attachExerciseListeners();
    }

    renderTextInput(exercise) {
        return `
            <div class="exercise" data-exercise-id="${exercise.id}">
                <div class="exercise-title">Exercise: ${exercise.category}</div>
                <div class="question">
                    <div class="question-text">${exercise.question}</div>
                    ${exercise.letter ? `<div class="hebrew">${exercise.letter}</div>` : ''}
                    ${exercise.hebrew ? `<div class="hebrew">${exercise.hebrew}</div>` : ''}
                    <input type="text" id="user-answer" placeholder="Enter your answer" 
                           ${exercise.hebrew_input ? 'style="direction: rtl; text-align: right;"' : ''}>
                    <button onclick="exerciseManager.checkCurrentAnswer()">Check Answer</button>
                    <div class="feedback" id="current-feedback" style="display: none;"></div>
                </div>
            </div>
        `;
    }

    renderMultipleChoice(exercise) {
        const options = exercise.options.map((option, index) => 
            `<label class="option">
                <input type="radio" name="answer" value="${option.value}">
                <span>${option.text}</span>
            </label>`
        ).join('');

        return `
            <div class="exercise" data-exercise-id="${exercise.id}">
                <div class="exercise-title">Exercise: ${exercise.category}</div>
                <div class="question">
                    <div class="question-text">${exercise.question}</div>
                    ${exercise.hebrew ? `<div class="hebrew">${exercise.hebrew}</div>` : ''}
                    <div class="options">
                        ${options}
                    </div>
                    <button onclick="exerciseManager.checkCurrentAnswer()">Check Answer</button>
                    <div class="feedback" id="current-feedback" style="display: none;"></div>
                </div>
            </div>
        `;
    }

    renderConjugation(exercise) {
        const forms = Object.keys(exercise.paradigm).map(form => {
            const isGiven = exercise.paradigm[form] && !exercise.blanks?.includes(form);
            return `
                <div class="conjugation-row">
                    <label>${form}:</label>
                    ${isGiven ? 
                        `<div class="hebrew given">${exercise.paradigm[form]}</div>` :
                        `<input type="text" data-form="${form}" class="hebrew-input" style="direction: rtl; text-align: right;" placeholder="Enter form">`
                    }
                </div>
            `;
        }).join('');

        return `
            <div class="exercise" data-exercise-id="${exercise.id}">
                <div class="exercise-title">Exercise: Verb Conjugation</div>
                <div class="question">
                    <div class="question-text">${exercise.question}</div>
                    <div class="root-display">Root: <span class="hebrew">${exercise.root}</span></div>
                    <div class="conjugation-table">
                        ${forms}
                    </div>
                    <button onclick="exerciseManager.checkCurrentAnswer()">Check Conjugation</button>
                    <div class="feedback" id="current-feedback" style="display: none;"></div>
                </div>
            </div>
        `;
    }

    async checkCurrentAnswer() {
        const exercise = this.currentExercise;
        let userAnswer;
        
        switch (exercise.type) {
            case 'text_input':
                userAnswer = document.getElementById('user-answer').value.trim();
                break;
            case 'multiple_choice':
                const selected = document.querySelector('input[name="answer"]:checked');
                userAnswer = selected ? selected.value : '';
                break;
            case 'conjugation':
                userAnswer = {};
                document.querySelectorAll('.hebrew-input').forEach(input => {
                    userAnswer[input.dataset.form] = input.value.trim();
                });
                break;
        }

        try {
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exercise_id: exercise.id,
                    user_answer: userAnswer,
                    correct_answer: exercise.correct_answer || exercise.correct_answers
                })
            });

            const result = await response.json();
            this.displayFeedback(result);
            this.updateProgress(result.correct);
            
        } catch (error) {
            console.error('Failed to check answer:', error);
        }
    }

    displayFeedback(result) {
        const feedback = document.getElementById('current-feedback');
        feedback.className = `feedback ${result.correct ? 'correct' : 'incorrect'}`;
        feedback.textContent = result.explanation;
        
        if (!result.correct && result.correct_answer) {
            feedback.innerHTML += `<br><strong>Correct answer:</strong> ${
                typeof result.correct_answer === 'object' ? 
                JSON.stringify(result.correct_answer) : 
                result.correct_answer
            }`;
        }
        
        feedback.style.display = 'block';
        
        // Auto-advance after correct answer
        if (result.correct) {
            setTimeout(() => {
                this.loadNextExercise();
            }, 2000);
        }
    }

    updateProgress(isCorrect) {
        this.userProgress.totalAttempts++;
        if (isCorrect) {
            this.userProgress.correctAnswers++;
        }
        
        const category = this.currentExercise.category;
        if (!this.userProgress.categories[category]) {
            this.userProgress.categories[category] = { attempts: 0, correct: 0 };
        }
        
        this.userProgress.categories[category].attempts++;
        if (isCorrect) {
            this.userProgress.categories[category].correct++;
        }
        
        this.updateProgressDisplay();
    }

    updateProgressDisplay() {
        const overall = this.userProgress.correctAnswers / this.userProgress.totalAttempts * 100;
        document.getElementById('overall-progress').style.width = `${overall}%`;
        
        // Update category-specific progress bars
        Object.keys(this.userProgress.categories).forEach(category => {
            const categoryProgress = this.userProgress.categories[category];
            const percentage = categoryProgress.correct / categoryProgress.attempts * 100;
            const progressBar = document.getElementById(`progress-${category}`);
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
        });
    }

    loadNextExercise() {
        // Implement intelligent exercise selection based on user performance
        const weakestCategory = this.getWeakestCategory();
        this.loadExercise(weakestCategory);
    }

    getWeakestCategory() {
        let weakest = 'alphabet';
        let lowestScore = 1;
        
        Object.entries(this.userProgress.categories).forEach(([category, stats]) => {
            const score = stats.correct / stats.attempts;
            if (score < lowestScore) {
                lowestScore = score;
                weakest = category;
            }
        });
        
        return weakest;
    }
}

// Initialize exercise manager
const exerciseManager = new ExerciseManager();
