import { createHmac } from 'crypto';

export function generateHMACSignature(params: any, secretKey: string) {
    const sortedValues = Object.entries(params)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Сортируем по ключам
        .filter(
            ([_, value]) =>
                value !== null && value !== undefined && value !== ''
        )
        .map(([_, value]) => (value as any).toString()); // Приводим все значения к строкам

    // Объединяем значения с использованием разделителя '|'
    const dataToSign = sortedValues.join('|');

    // Создаем HMAC подпись
    const hmac = createHmac('sha256', secretKey);
    hmac.update(dataToSign);
    return hmac.digest('hex');
}
