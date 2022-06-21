export function assert(condition: boolean, message?: string) {
    if (condition) {
        return;
    }
    message = message || 'no message provided';
    throw new Error(`Assertion failed: ${message}`);
}
