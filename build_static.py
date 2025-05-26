import os
import json
from jinja2 import Environment, FileSystemLoader

def build_static_site():
    """Build static HTML files for GitHub Pages"""
    
    # Setup Jinja2 environment
    env = Environment(loader=FileSystemLoader('templates'))
    
    # Load data
    with open('data/exercise-data.json', 'r', encoding='utf-8') as f:
        exercises = json.load(f)
    
    with open('data/vocabulary.json', 'r', encoding='utf-8') as f:
        vocabulary = json.load(f)
    
    # Create output directory
    os.makedirs('dist', exist_ok=True)
    os.makedirs('dist/exercises', exist_ok=True)
    
    # Generate main page
    template = env.get_template('index.html')
    html = template.render(
        exercises=exercises,
        vocabulary=vocabulary
    )
    
    with open('dist/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    # Generate exercise pages
    for category in exercises:
        category_template = env.get_template('category.html')
        category_html = category_template.render(
            category=category,
            exercises=exercises[category]
        )
        
        with open(f'dist/exercises/{category}.html', 'w', encoding='utf-8') as f:
            f.write(category_html)
    
    # Copy static files
    import shutil
    shutil.copytree('css', 'dist/css', dirs_exist_ok=True)
    shutil.copytree('js', 'dist/js', dirs_exist_ok=True)
    shutil.copytree('assets', 'dist/assets', dirs_exist_ok=True)
    
    print("Static site built successfully!")

if __name__ == '__main__':
    build_static_site()
