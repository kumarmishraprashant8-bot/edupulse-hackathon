// Simple keyword to topic mapping for autosuggest
export const INTENT_KEYWORDS: Record<string, string> = {
  'subtract': 'subtraction-borrowing',
  'borrow': 'subtraction-borrowing',
  'zero': 'subtraction-borrowing',
  'tens place': 'subtraction-borrowing',
  'fraction': 'fractions-conceptual',
  'half': 'fractions-conceptual',
  'quarter': 'fractions-conceptual',
  'multiply': 'multiplication-tables',
  'times table': 'multiplication-tables',
  'multiplication': 'multiplication-tables',
  'noisy': 'classroom-management',
  'discipline': 'classroom-management',
  'attention': 'classroom-management',
  'management': 'classroom-management',
  'parent': 'parent-engagement',
  'home': 'parent-engagement',
  'family': 'parent-engagement',
  'read': 'reading-fluency',
  'reading': 'reading-fluency',
  'fluency': 'reading-fluency',
  'absent': 'absenteeism',
  'attendance': 'absenteeism',
  'missing': 'absenteeism',
  'assess': 'assessment-formative',
  'test': 'assessment-formative',
  'check understanding': 'assessment-formative',
  'different level': 'differentiation',
  'mixed ability': 'differentiation',
  'slow learner': 'differentiation',
};

export const TOPIC_DISPLAY_NAMES: Record<string, string> = {
  'subtraction-borrowing': 'Subtraction with Borrowing',
  'fractions-conceptual': 'Understanding Fractions',
  'multiplication-tables': 'Multiplication Tables',
  'classroom-management': 'Classroom Management',
  'parent-engagement': 'Parent Engagement',
  'reading-fluency': 'Reading Fluency',
  'absenteeism': 'Student Attendance',
  'assessment-formative': 'Formative Assessment',
  'differentiation': 'Differentiated Instruction',
};

export function detectTopicFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];
  
  for (const [keyword, topic] of Object.entries(INTENT_KEYWORDS)) {
    if (lowerText.includes(keyword) && !matches.includes(topic)) {
      matches.push(topic);
    }
  }
  
  return matches.slice(0, 3); // Return top 3 matches
}

export function getTopicDisplayName(topic: string): string {
  return TOPIC_DISPLAY_NAMES[topic] || topic.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
}
