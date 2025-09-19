import { Link } from "react-router-dom";

interface ClickableMentionsProps {
  text: string;
  className?: string;
}

export function ClickableMentions({ text, className = "" }: ClickableMentionsProps) {
  const mentionRegex = /@(\w+)/g;
  
  const renderTextWithMentions = (content: string) => {
    const parts = content.split(mentionRegex);
    const result = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text
        if (parts[i]) {
          result.push(
            <span key={i}>{parts[i]}</span>
          );
        }
      } else {
        // Username (captured group from regex)
        result.push(
          <Link
            key={i}
            to={`/universal-profile?username=${parts[i]}`}
            className="text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            @{parts[i]}
          </Link>
        );
      }
    }
    
    return result;
  };

  return (
    <div className={className}>
      {renderTextWithMentions(text)}
    </div>
  );
}