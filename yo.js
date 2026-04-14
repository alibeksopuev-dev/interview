function isLetter(char) {
    return char.toLowerCase() !== char.toUpperCase();
}

function isEquals(char1, char2) {
    return char1.toLowerCase() === char2.toLowerCase();
}

function isPalindrome(str) {
    let start = 0;
    let end = str.length - 1;

    while (start < end) {
        const firstChar = str[start];
        const endChar = str[end];

        if (!isLetter(firstChar)) {
            start += 1;
            continue;
        }

        if (!isLetter(endChar)) {
            end -= 1;
            continue;
        }

        if (!isEquals(firstChar, endChar)) {
            return false;
        }

        start += 1;
        end -= 1;
    }

    return true;
}

// Примеры использования
console.log(isPalindrome("A man, a plan, a canal, Panama!")); // true
console.log(isPalindrome("Was it a car or a cat I saw?")); // true
console.log(isPalindrome("Hello, World!")); // false
console.log(isPalindrome("racecar")); // false


function range (arr) {
    const sortedArr= [...arr].sort((a, b) => a - b);
    if(!sortedArr.length) {
        return ''
    }

    const result = [String(sortedArr[0])];
    let isInterval = false;

    for (let i = 1; i <= sortedArr.length; i++) {
        const prev = sortedArr[i-1];
        const current = sortedArr[i];

        if (current - prev === 1) {
            isInterval = true;
            continue;
        }

        if(isInterval) {
            result[result.length-1] += `-${prev}`
            isInterval = false;
        }

        if(current) {
            result.push(String(current));
        }

    }
    return result.join();
}

console.log(range([0, 1, 2, 3, 4, 5, 89]));
