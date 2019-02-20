// eslint-disable
// this is an auto generated file. This will be overwritten

export const getRides = `query GetRides {
  getRides {
    id
    info {
      name
      picUrl
      land
      height
      labels
    }
    time {
      status
      waitTime
      fastPassTime
      waitRating
      changedTime
      changedRange
    }
  }
}
`;
export const getSchedules = `query GetSchedules {
  getSchedules {
    parkName
    blockLevel
    crowdLevel
    openTime
    closeTime
    magicStartTime
    date
  }
}
`;
export const getWeather = `query GetWeather($date: String) {
  getWeather(date: $date) {
    dateTime
    rainStatus
    feelsLikeF
  }
}
`;
