// ==UserScript==
// @name         Goaliepost Timezone Fix
// @namespace    https://cameronkeif.com
// @version      0.1
// @description  Updates the https://www.goaliepost.com website to display times in your local time instead of just eastern time.
// @author       Cameron Keif
// @match        *://goaliepost.com
// ==/UserScript==

(function() {
  'use strict';

  const pageTimeZoneText = "(ET)";
  const englishUSLocale = "en-US";
  const UTC = "UTC";
  const easternTimeZone = "America/New_York";

  /**
   *
   * @param {string} timeZone the timezone as an IANA Time Zone Name (ex: "America/New_York")
   * @param {number} year
   * @param {number} month
   * @param {number} day
   * @param {number} hour
   * @param {number} minute
   * @param {number} second
   * @returns {Date} A constructed date in the specified timeZone
   */
  const dateWithTimeZone = (timeZone, year, month, day, hour, minute, second) => {
    const date = new Date(Date.UTC(year, month, day, hour, minute, second));

    const utcDate = new Date(date.toLocaleString(englishUSLocale, { timeZone: UTC }));
    const tzDate = new Date(date.toLocaleString(englishUSLocale, { timeZone }));
    const offset = utcDate.getTime() - tzDate.getTime();

    date.setTime(date.getTime() + offset);

    return date;
  };

  /**
   * Determine if it is daylight savings in the Eastern time zone by comparing the
   * time offset from January.
   * @returns true if it's currently daylight savings time in the Eastern time zone, false otherwise
   */
   const isDST = () => {
    // The date is in an unnamed div before the "startermain" tables begin.
    const currentDate = document.getElementsByClassName("startermain")[0]
      .previousSibling.textContent.trim().split("-");

    const year = currentDate[0];
    const month = currentDate[1] - 1;
    const day = currentDate[2];

    const firstDay = dateWithTimeZone(easternTimeZone, year, 0, 1, 0, 0, 0);
    const today = dateWithTimeZone(easternTimeZone, year, month, day, 0, 0, 0);

    return today.getTimezoneOffset() !== firstDay.getTimezoneOffset();
  }

  const browserTimezoneOffset = isDST() ? 4 : 5; // EST is GMT-5; EDT is GMT-4.
  const easternTimezoneOffset = new Date().getTimezoneOffset() / 60;

  // Grab the shorthand timezone to replace timezone with
  const browserTimezoneAbbreviation = new Date()
    .toLocaleTimeString(undefined, { timeZoneName: 'short' }).split(' ')[2];

  const gameTimes = document.querySelectorAll(".startermain > tbody > tr > td:nth-child(2)");

  gameTimes.forEach((gameTime) => {
    // Grab the hour and adjust by our calculated offset
    const { innerText } = gameTime;
    const hour = parseInt(innerText.slice(3).split(":")[0]);
    const offset = browserTimezoneOffset - easternTimezoneOffset;
    let convertedHour = hour + offset;

    // Convert to 24 hour time to compare across days more easily to handle day overlap
    let twentyFourHour = hour;

    if (innerText.includes("PM")) {
      twentyFourHour += 12;
    } else if (hour === 12) {
      twentyFourHour = 0;
    }

    let convertedTwentyFourHour = twentyFourHour + offset;

    const shouldSwapAmPm = convertedHour > 12 || convertedHour < 1 || convertedTwentyFourHour >= 24;
    if (convertedHour > 12) {
      convertedHour = convertedHour - 12;
    } else if (convertedHour < 1) {
      convertedHour += 12;
    }
    // Update the text
    let updatedText = innerText.replace(`${hour}:`, `${convertedHour}:`);
    updatedText = updatedText.replace(pageTimeZoneText, `(${browserTimezoneAbbreviation})`)

    if (shouldSwapAmPm) {
      updatedText = innerText.includes("AM")
        ? updatedText.replace("AM", "PM")
        : updatedText.replace("PM", "AM");
    }

    gameTime.innerText = updatedText;
  })
})();
