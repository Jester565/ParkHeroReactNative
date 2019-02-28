// eslint-disable
// this is an auto generated file. This will be overwritten

export const createUser = `mutation CreateUser($name: String) {
  createUser(name: $name) {
    id
    name
    profilePicUrl
  }
}
`;
export const getRideTimes = `mutation GetRideTimes {
  getRideTimes {
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
export const updateCustomRideInfo = `mutation UpdateCustomRideInfo(
  $rideID: String!
  $customName: String
  $pics: [Pic]
) {
  updateCustomRideInfo(rideID: $rideID, customName: $customName, pics: $pics) {
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
export const verifySns = `mutation VerifySns($token: String!, $endpointArn: String) {
  verifySns(token: $token, endpointArn: $endpointArn)
}
`;
export const updateFilter = `mutation UpdateFilter(
  $filterName: String
  $rideIDs: [String]
  $watchConfig: WatchConfigInput
) {
  updateFilter(
    filterName: $filterName
    rideIDs: $rideIDs
    watchConfig: $watchConfig
  )
}
`;
export const deleteFilters = `mutation DeleteFilters($filterNames: [String]) {
  deleteFilters(filterNames: $filterNames)
}
`;
