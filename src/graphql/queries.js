// eslint-disable
// this is an auto generated file. This will be overwritten

export const getUser = `query GetUser($id: String) {
  getUser(id: $id) {
    id
    name
    profilePicUrl
  }
}
`;
export const getUsers = `query GetUsers($ids: [String]) {
  getUsers(ids: $ids) {
    id
    name
    profilePicUrl
  }
}
`;
export const listFastPasses = `query ListFastPasses {
  listFastPasses {
    id
    rideID
    fpDT
    creationDT
    authorID
    userPasses {
      user
      passes {
        redeemable
        official
        startDT
        pass {
          id
          name
          disID
          type
          expirationDT
        }
        priority
      }
    }
  }
}
`;
export const listPasses = `query ListPasses {
  listPasses {
    user
    passes {
      id
      name
      disID
      type
      expirationDT
    }
  }
}
`;
export const listFriendPasses = `query ListFriendPasses {
  listFriendPasses {
    user
    passes {
      id
      name
      disID
      type
      expirationDT
    }
  }
}
`;
export const getRides = `query GetRides {
  getRides {
    id
    time {
      status
      waitRating
      changedTime
      changedRange
      waitTime
      fastPassTime
      dateTime
    }
    info {
      name
      picUrl
      land
      height
      ages
      thrills
      photos {
        url
        maxSize
        numSizes
      }
    }
  }
}
`;
export const getRideDPs = `query GetRideDPs($rideID: String, $resortID: String) {
  getRideDPs(rideID: $rideID, resortID: $resortID) {
    rideID
    rideTimes {
      waitTime
      fastPassTime
      dateTime
    }
    predictTimes {
      waitTime
      fastPassTime
      dateTime
    }
  }
}
`;
export const getSchedules = `query GetSchedules {
  getSchedules {
    schedules {
      parkName
      parkIconUrl
      openTime
      closeTime
      magicStartTime
      magicEndTime
      crowdLevel
      resortName
      blockLevel
      date
    }
  }
}
`;
export const getHourlyWeather = `query GetHourlyWeather($date: String) {
  getHourlyWeather(date: $date) {
    weather {
      dateTime
      feelsLikeF
      rainStatus
    }
  }
}
`;
export const getRideFilters = `query GetRideFilters {
  getRideFilters {
    filterID
    notifyConfig {
      waitRating
      waitTime
      fastPassTime
      distance
      inLineTime
    }
    rideIDs
  }
}
`;
export const getParkingLocation = `query GetParkingLocation {
  getParkingLocation {
    latitude
    longitude
  }
}
`;
export const getParkingPosition = `query GetParkingPosition {
  getParkingPosition {
    level
    row
    col
  }
}
`;
export const getNotifyDate = `query GetNotifyDate {
  getNotifyDate
}
`;
