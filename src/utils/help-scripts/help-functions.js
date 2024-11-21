generateRandomId=function generateRandomId() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 6-digit number
}

export default generateRandomId;