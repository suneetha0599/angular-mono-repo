export const formatText = (status: string): string => {
    if (!status) return '';
    const formatted = status?.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
    return formatted;
}