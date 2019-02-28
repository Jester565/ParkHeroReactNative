// eslint-disable
// this is an auto generated file. This will be overwritten

export const getRides = `query GetRides {
  getRides {
    id
    info {
      name
      officialName
      picUrl
      officialPicUrl
      land
      height
      labels
      customPicUrls
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
export const getRideDPs = `query GetRideDPs($date: String!, $rideID: String) {
  getRideDPs(date: $date, rideID: $rideID) {
    rideID
    rideOpenDateTime
    rideCloseDateTime
    dps {
      prediction {
        waitMins
        fastPassTime
      }
      history {
        waitMins
        fastPassTime
        status
      }
      fastPassTime
      waitMins
      dateTime
    }
  }
}
`;
export const getFilters = `query GetFilters {
  getFilters {
    name
    rideIDs
    watchConfig {
      waitTime
      waitRating
      fastPassTime
    }
  }
}
`;
