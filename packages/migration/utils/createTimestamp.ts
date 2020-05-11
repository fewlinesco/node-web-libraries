// Format Date in to 14 char timestamp (i.e. `2020-05-07T09:59:22.603Z` => `20200507095922`).
export function createTimestamp(date: Date): string | void {
  const filteredDate = date.toISOString().match(/[\d]/g);

  if (filteredDate) {
    return filteredDate.join("").slice(0, -3);
  } else {
    throw new Error("❗Incorrect date format. Please use `new Date()`");
  }
}
