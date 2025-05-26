# app.py
from flask import Flask, jsonify, request, render_template
import json
import random
from datetime import datetime

app = Flask(__name__)

class HebrewGrammarApp:
    def __init__(self):
        self.load_data()
        self.user_progress = {}
    
    def load_data(self):
        """Load all exercise and content data"""
        with open('data/vocabulary.json', 'r', encoding='utf-8') as f:
            self.vocabulary = json.load(f)
        
        with open('data/verb-paradigms.json', 'r', encoding='utf-8') as f:
            self.verbs = json.load(f)
        
        with open('data/exercise-data.json', 'r', encoding='utf-8') as f:
            self.exercises = json.load(f)
    
    def get_random_exercise(self, category):
        """Get a random exercise from specified category"""
        if category in self.exercises:
            return random.choice(self.exercises[category])
        return None
    
    def check_answer(self, exercise_id, user_answer, correct_answer):
        """Check user answer and provide feedback"""
        is_correct = self.normalize_hebrew(user_answer) == self.normalize_hebrew(correct_answer)
        
        feedback = {
            'correct': is_correct,
            'explanation': self.get_explanation(exercise_id, is_correct),
            'correct_answer': correct_answer if not is_correct else None
        }
        
        return feedback
    
    def normalize_hebrew(self, text):
        """Normalize Hebrew text for comparison"""
        # Remove nikkud (vowel points) and normalize
        import unicodedata
        text = unicodedata.normalize('NFD', text)
        # Remove combining characters (nikkud)
        text = ''.join(c for c in text if not unicodedata.combining(c))
        return text.strip()
    
    def get_explanation(self, exercise_id, is_correct):
        """Generate contextual explanations"""
        explanations = {
            'alphabet': {
                True: "Excellent! Understanding letter names is fundamental to Hebrew study.",
                False: "Remember that Hebrew letters often have multiple transliterations. Focus on the most common pronunciation."
            },
            'noun_analysis': {
                True: "Perfect analysis! You're grasping Hebrew nominal morphology.",
                False: "Hebrew nouns show gender through endings: ה- and ת- typically feminine, no ending typically masculine. Plural: ים- (masc), ות- (fem)."
            },
            'verb_conjugation': {
                True: "Outstanding! You understand the Hebrew verbal system.",
                False: "Hebrew verbs follow root-and-pattern morphology. The perfect conjugation adds suffixes to the root: כתב + תי = כתבתי (I wrote)."
            }
        }
        
        category = exercise_id.split('_')[0]
        return explanations.get(category, {}).get(is_correct, "Keep practicing!")

grammar_app = HebrewGrammarApp()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/exercise/<category>')
def get_exercise(category):
    exercise = grammar_app.get_random_exercise(category)
    return jsonify(exercise)

@app.route('/api/check', methods=['POST'])
def check_answer():
    data = request.json
    result = grammar_app.check_answer(
        data['exercise_id'], 
        data['user_answer'], 
        data['correct_answer']
    )
    return jsonify(result)

@app.route('/api/progress/<user_id>')
def get_progress(user_id):
    return jsonify(grammar_app.user_progress.get(user_id, {}))

if __name__ == '__main__':
    app.run(debug=True)
