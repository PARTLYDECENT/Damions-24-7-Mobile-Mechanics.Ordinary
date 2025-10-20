/**
 * tool1.js
 * This is a placeholder module for tool-specific logic.
 */

export function getToolInfo(toolName) {
    const toolDatabase = {
        wrench: {
            id: 'wrench-001',
            description: 'A standard 10-inch combination wrench. Forged from chrome vanadium steel.'
        }
    };

    return toolDatabase[toolName] || { id: 'unknown', description: 'Tool not found in database.' };
}