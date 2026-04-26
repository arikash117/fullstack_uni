export const formatDateTime = (isoString: string | undefined): string => {
    if (!isoString) {
        return '--.--.--';
    }
    
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime()) || date.getFullYear() < 1970) {
            return '--.--.--';
        }
        
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        });
    } catch {
        return '--.--.--';
    }
};