const numbers = '0123456789';

const getRandomNumberAsString = (): string => {
    const length = numbers.length;

    return numbers.charAt(Math.floor(Math.random() * length));
};

export const generateRandomCodeAsString = (digitsNumber: number) => {
    let result = '';

    for (let i = 0; i <= digitsNumber; i++) {
        result += getRandomNumberAsString();
    }

    return result;
};
