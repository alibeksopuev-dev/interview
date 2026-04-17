const isPalindrome = (str: string): boolean => {
    let leftIndex = 0
    let rightIndex = str.length - 1

    while(leftIndex < rightIndex){
        const leftChar = str[leftIndex]
        const rightChar = str[rightIndex]
        
        if (!isLetter(leftChar)){
            leftIndex += 1
            continue
        }

        if (!isLetter(rightChar)){
            rightIndex -= 1
            continue
        }

        if(!isSameLetter(leftChar, rightChar)){
            return false
        }

        leftIndex += 1
        rightIndex -= 1
    }

    return true
}

const isLetter = (char: string) => {
    return char.toLowerCase() !== char.toUpperCase()
}

const isSameLetter = (charA: string, charB: string) => {
    return charA.toLowerCase() === charB.toLowerCase()
}

