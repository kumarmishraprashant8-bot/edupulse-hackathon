import { motion } from 'framer-motion';

interface QuickChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export default function QuickChips({ suggestions, onSelect }: QuickChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion, idx) => (
        <motion.button
          key={idx}
          type="button"
          onClick={() => onSelect(suggestion)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 text-sm bg-gradient-to-r from-primary-100 to-accent-100 text-primary-800 rounded-full hover:from-primary-200 hover:to-accent-200 transition-all duration-200 font-medium border border-primary-200 shadow-sm hover:shadow"
          aria-label={`Select suggestion: ${suggestion}`}
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
}
