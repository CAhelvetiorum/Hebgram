
class ProgressTracker {
    constructor() {
        this.achievements = [];
        this.streaks = { current: 0, longest: 0 };
        this.sessionStats = { startTime: Date.now(), exercisesCompleted: 0 };
        this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem('hebrew-grammar-progress');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(this, data);
        }
    }

    saveProgress() {
        localStorage.setItem('hebrew-grammar-progress', JSON.stringify({
            achievements: this.achievements,
            streaks: this.streaks,
            sessionStats: this.sessionStats
        }));
    }

    recordAnswer(isCorrect, category, difficulty) {
        if (isCorrect) {
            this.streaks.current++;
            this.streaks.longest = Math.max(this.streaks.longest, this.streaks.current);
            this.checkForAchievements(category, difficulty);
        } else {
            this.streaks.current = 0;
        }
        
        this.sessionStats.exercisesCompleted++;
        this.saveProgress();
        this.updateAchievementDisplay();
    }

    checkForAchievements(category, difficulty) {
        const achievements = [
            { id: 'first_correct', name: 'First Success', condition: () => this.streaks.current === 1 },
            { id: 'streak_5', name: 'On Fire', condition: () => this.streaks.current === 5 },
            { id: 'streak_10', name: 'Unstoppable', condition: () => this.streaks.current === 10 },
            { id: 'alphabet_master', name: 'Alphabet Master', condition: () => category === 'alphabet' && this.streaks.current >= 22 },
            { id: 'verb_expert', name: 'Verb Expert', condition: () => category === 'verbs' && difficulty >= 3 }
        ];

        achievements.forEach(achievement => {
            if (!this.achievements.includes(achievement.id) && achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        this.achievements.push(achievement.id);
        this.showAchievementNotification(achievement);
        this.saveProgress();
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-text">
                <h4>Achievement Unlocked!</h4>
                <p>${achievement.name}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateAchievementDisplay() {
        const container = document.getElementById('achievements-container');
        if (container) {
            container.innerHTML = this.achievements.map(id => `
                <div class="achievement unlocked">
                    <span class="achievement-name">${this.getAchievementName(id)}</span>
                </div>
            `).join('');
        }

        // Update streak display
        const streakDisplay = document.getElementById('current-streak');
        if (streakDisplay) {
            streakDisplay.textContent = this.streaks.current;
        }
    }

    getAchievementName(id) {
        const names = {
            'first_correct': 'First Success',
            'streak_5': 'On Fire',
            'streak_10': 'Unstoppable',
            'alphabet_master': 'Alphabet Master',
            'verb_expert': 'Verb Expert'
        };
        return names[id] || id;
    }

    getDetailedStats() {
        return {
            sessionTime: Date.now() - this.sessionStats.startTime,
            exercisesCompleted: this.sessionStats.exercisesCompleted,
            currentStreak: this.streaks.current,
            longestStreak: this.streaks.longest,
            achievementsCount: this.achievements.length
        };
    }
}
