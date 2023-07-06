interface ITimestampsCompare {
    mySQLTimestamp: string;     // Timestamp
    mySQLOffset: number;        // SQL server offset
    maxDelta: number;           // max difference between current time and server stored timestamp in seconds
}

// function returns true if time difference does not exceed maxDelta
const compareTimestamps = ({ mySQLTimestamp, mySQLOffset, maxDelta }: ITimestampsCompare) => {
    const serverTimestamp = new Date(mySQLTimestamp).getTime() - mySQLOffset * 60 * 60 * 1000;
    const currentTimestamp = new Date().getTime();

    // comparing maxDelta in milliseconds with the difference in timestamps in UTC-0
    return maxDelta * 1000 > currentTimestamp - serverTimestamp;
}

export default compareTimestamps