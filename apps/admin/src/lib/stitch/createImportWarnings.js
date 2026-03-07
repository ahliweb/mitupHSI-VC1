const toWarningObject = (warning) => {
    if (!warning) return null;

    if (typeof warning === 'string') {
        return { code: 'generic', message: warning };
    }

    if (typeof warning === 'object' && warning.message) {
        return {
            code: warning.code || 'generic',
            message: warning.message,
        };
    }

    return null;
};

export const createImportWarnings = (warnings = []) => {
    const normalized = warnings
        .map(toWarningObject)
        .filter(Boolean);

    const unique = new Map();
    normalized.forEach((warning) => {
        const key = `${warning.code}:${warning.message}`;
        if (!unique.has(key)) {
            unique.set(key, warning);
        }
    });

    return Array.from(unique.values());
};
