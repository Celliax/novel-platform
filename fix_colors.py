import os
import re

replacements = {
    r'\bbg-white\b': 'bg-surface',
    r'\bbg-gray-50\b': 'bg-canvas',
    r'\btext-gray-900\b': 'text-foreground',
    r'\btext-gray-800\b': 'text-foreground/90',
    r'\btext-gray-700\b': 'text-foreground/80',
    r'\btext-gray-600\b': 'text-muted',
    r'\btext-gray-500\b': 'text-muted',
    r'\btext-gray-400\b': 'text-muted/80',
    r'\bborder-gray-100\b': 'border-border',
    r'\bborder-gray-200\b': 'border-border',
    r'\bborder-gray-300\b': 'border-border/80',
    r'\bshadow-sm\b': 'shadow-card',
    r'\bshadow-md\b': 'shadow-card',
    r'\bbg-purple-50\b': 'bg-brand-50',
    r'\bbg-purple-100\b': 'bg-brand-100',
    r'\bbg-purple-500\b': 'bg-brand-500',
    r'\bbg-purple-600\b': 'bg-brand-600',
    r'\bbg-purple-700\b': 'bg-brand-700',
    r'\btext-purple-600\b': 'text-brand-600',
    r'\btext-purple-700\b': 'text-brand-700',
    r'\btext-purple-900\b': 'text-brand-700',
    r'\btext-purple-500\b': 'text-brand-500',
    r'\bborder-purple-100\b': 'border-brand-100',
    r'\bborder-purple-200\b': 'border-brand-200',
    r'\bborder-purple-400\b': 'border-brand-600',
    r'\bring-purple-100\b': 'ring-brand-100',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, repl in replacements.items():
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('app'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            process_file(os.path.join(root, file))

for root, dirs, files in os.walk('components'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            process_file(os.path.join(root, file))

print("Done replacing hardcoded colors.")
