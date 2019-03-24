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
    parkIconUrl
    blockLevel
    crowdLevel
    openTime
    closeTime
    magicStartTime
    magicEndTime
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
export const getUserPasses = `query GetUserPasses($userID: String) {
  getUserPasses(userID: $userID) {
    user {
      id
      name
      profilePicUrl
    }
    passes {
      id
      name
      type
      expirationDT
      isPrimary
      isEnabled
      hasMaxPass
    }
  }
}
`;
export const getPartyPasses = `query GetPartyPasses {
  getPartyPasses {
    userPasses {
      user {
        id
        name
        profilePicUrl
      }
      passes {
        id
        name
        type
        expirationDT
        isPrimary
        isEnabled
        hasMaxPass
      }
    }
    splitters
  }
}
`;
export const getFriendPasses = `query GetFriendPasses {
  getFriendPasses {
    user {
      id
      name
      profilePicUrl
    }
    passes {
      id
      name
      type
      expirationDT
      isPrimary
      isEnabled
      hasMaxPass
    }
  }
}
`;
export const searchUsers = `query SearchUsers($prefix: String) {
  searchUsers(prefix: $prefix) {
    id
    name
    profilePicUrl
  }
}
`;
export const getFriends = `query GetFriends {
  getFriends {
    id
    name
    profilePicUrl
  }
}
`;
export const getPartyMembers = `query GetPartyMembers {
  getPartyMembers {
    id
    name
    profilePicUrl
  }
}
`;
export const getInvites = `query GetInvites {
  getInvites {
    isOwner
    isFriend
    type
    user {
      id
      name
      profilePicUrl
    }
  }
}
`;
