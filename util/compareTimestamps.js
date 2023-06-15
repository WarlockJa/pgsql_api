// function returns true if time difference does not exceed maxDelta
const compareTimestamps = ({ mySQLTimestamp, mySQLOffset, maxDelta }) => {
    const serverTimestamp = new Date(mySQLTimestamp).getTime() - mySQLOffset * 60 * 60 * 1000;
    const currentTimestamp = new Date().getTime();
    // comparing maxDelta in milliseconds with the difference in timestamps in UTC-0
    return maxDelta * 1000 > currentTimestamp - serverTimestamp;
};
export default compareTimestamps;
//# sourceMappingURL=compareTimestamps.js.map