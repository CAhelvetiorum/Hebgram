class HebrewUtils {
    static nikkudRange = '\u0591-\u05C7';
    static hebrewRange = '\u05D0-\u05EA';
    
    static removeNikkud(text) {
        return text.replace(new RegExp(`[${this.nikkudRange}]`, 'g'), '');
    }
    
    static isHebrew(text) {
        return new RegExp(`^[${this.hebrewRange}${this.nikkudRange}\\s]+$`).test(text);
    }
    
    static transliterate(hebrew) {
        const transliterationMap = {
            'א': "'", 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h',
            'ו': 'w', 'ז': 'z', 'ח': 'ḥ', 'ט': 'ṭ', 'י': 'y',
            'כ': 'k', 'ל': 'l', 'מ': 'm', 'ן': 'n', 'נ': 'n',
            'ס': 's', 'ע': "'", 'פ': 'p', 'צ': 'ṣ', 'ק': 'q',
            'ר': 'r', 'ש': 'š', 'ת': 't'
        };
        
        return hebrew.split('').map(char => 
            transliterationMap[char]
