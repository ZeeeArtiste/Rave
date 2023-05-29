import React, { useState, useEffect } from "react";
import { Text } from "react-native-paper";

const Timer = ({ startTimer }) => {
  const [time, setTime] = useState({ minutes: 0, seconds: 0 });
  const [isActive, setIsActive] = useState(false);

  // useEffect hook to handle timer logic
  useEffect(() => {
    let interval = null;

    // Check if the timer is active
    if (isActive) {
      // Set up an interval to update the time every second
      interval = setInterval(() => {
        setTime((time) => {
          // Increment the seconds by 1
          const seconds = time.seconds + 1;

          // Check if the seconds reach 60
          if (seconds === 60) {
            // Reset seconds to 0 and increment the minutes by 1
            return { minutes: time.minutes + 1, seconds: 0 };
          } else {
            // Keep the minutes unchanged and update the seconds
            return { ...time, seconds };
          }
        });
      }, 1000);
    } else if (!isActive && time.seconds !== 0) {
      // If the timer is not active and seconds is not 0, clear the interval
      clearInterval(interval);
    }

    // Clean up the interval when the component unmounts or when isActive or time.seconds change
    return () => clearInterval(interval);
  }, [isActive, time.seconds]);

  // Handle startTimer prop changes
  useEffect(() => {
    // Check if the timer should be reset
    if (startTimer.reset) {
      // Reset the time to 0 minutes and 0 seconds
      setTime({ minutes: 0, seconds: 0 });
    }

    // Check if the timer should start or stop
    if (startTimer.start) {
      // Start the timer
      setIsActive(true);
    } else {
      // Stop the timer
      setIsActive(false);
    }
  }, [startTimer]);

  return (
    <Text variant="displaySmall" style={{ margin: 20 }}>
      {`${time.minutes < 10 ? `0${time.minutes}` : time.minutes}:${
        time.seconds < 10 ? `0${time.seconds}` : time.seconds
      }`}
    </Text>
  );
};

export default Timer;
