import crypto from "crypto";
// this is a random password generator function
// it returns varying in length password between 8 and 16 characters
// that are generated using crypto library
// min and max included
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
// imitate Math.random() functionality using crypto.getRandomValues instead
function cryptoRandom() {
    const typedArray = new Uint32Array(1);
    const randomValue = crypto.getRandomValues(typedArray)[0];
    const randomFloat = randomValue / Math.pow(2, 32);
    return randomFloat;
}
// generating an array with length 8-16 and filling it with random characters
const getRandomPassword = () => {
    return new Array(randomIntFromInterval(8, 16))
        .fill(null)
        .map(() => String.fromCharCode(cryptoRandom() * 86 + 40))
        .join("");
};
export default getRandomPassword;
//# sourceMappingURL=getRandomPassword.js.map