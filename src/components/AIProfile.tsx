import { Persona } from '@/lib/personas';

interface AIProfileProps {
  persona: Persona;
  className?: string;
}

export function AIProfile({ persona, className = "" }: AIProfileProps) {
  return (
    <div className={`flex items-center gap-3 mb-3 ${className}`}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
        {persona.avatar}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-900">{persona.name}</span>
        <span className="text-xs text-gray-500">{persona.description}</span>
      </div>
    </div>
  );
} 