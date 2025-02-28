
export const prepareDurationString = async (inputs) => {
    
const {seconds} = inputs;
const hours = Math.floor(seconds / 3600);
const minutes = Math.floor((seconds % 3600) / 60);
const secs = seconds % 60;
const formattedHours = String(hours).padStart(2, '0');
const formattedMinutes = String(minutes).padStart(2, '0');
const formattedSeconds = String(secs).padStart(2, '0');
const time_string = `${formattedHours}-${formattedMinutes}-${formattedSeconds}`;
return {time_string}
    
}
