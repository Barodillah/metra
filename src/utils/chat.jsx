import React from 'react';

/**
 * Format chat message with bold text and line breaks
 * Converts **text** to bold and \n to line breaks
 */
export const formatMessage = (text) => {
    if (!text) return null;

    // Split by line breaks
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
        // Check if line starts with ### (heading format)
        const isHeading = line.startsWith('###');
        const processedLine = isHeading ? line.slice(3).trim() : line;

        // Process bold text (**text**)
        const parts = processedLine.split(/(\*\*[^*]+\*\*)/g);

        const formattedLine = parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                // Remove ** and make bold
                return <strong key={partIndex} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });

        // If heading, wrap in styled span with bold and larger font
        if (isHeading) {
            return (
                <React.Fragment key={lineIndex}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{formattedLine}</span>
                    {lineIndex < lines.length - 1 && <br />}
                </React.Fragment>
            );
        }

        return (
            <React.Fragment key={lineIndex}>
                {formattedLine}
                {lineIndex < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });
};
