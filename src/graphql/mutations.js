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
export const updateUser = `mutation UpdateUser($name: String, $imgUri: String) {
  updateUser(name: $name, imgUri: $imgUri) {
    user {
      id
      name
      profilePicUrl
    }
    errors
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
export const verifySns = `mutation VerifySns(
  $token: String!
  $endpointArn: String
  $subscriptionArn: String
  $endpointUserID: String
) {
  verifySns(
    token: $token
    endpointArn: $endpointArn
    subscriptionArn: $subscriptionArn
    endpointUserID: $endpointUserID
  ) {
    endpointArn
    subscriptionArn
  }
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
export const updateSplitters = `mutation UpdateSplitters($groupID: String!, $action: String!) {
  updateSplitters(groupID: $groupID, action: $action) {
    groupID
    splitters
  }
}
`;
export const updatePass = `mutation UpdatePass(
  $passID: String!
  $isPrimary: Boolean
  $isEnabled: Boolean
) {
  updatePass(passID: $passID, isPrimary: $isPrimary, isEnabled: $isEnabled) {
    user {
      id
      name
      profilePicUrl
    }
    pass {
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
export const removePass = `mutation RemovePass($passID: String!) {
  removePass(passID: $passID)
}
`;
export const addFriend = `mutation AddFriend($friendID: String!) {
  addFriend(friendID: $friendID)
}
`;
export const removeFriend = `mutation RemoveFriend($friendID: String!) {
  removeFriend(friendID: $friendID)
}
`;
export const inviteToParty = `mutation InviteToParty($memberID: String!) {
  inviteToParty(memberID: $memberID)
}
`;
export const acceptPartyInvite = `mutation AcceptPartyInvite($inviterID: String!) {
  acceptPartyInvite(inviterID: $inviterID) {
    id
    name
    profilePicUrl
  }
}
`;
export const leaveParty = `mutation LeaveParty {
  leaveParty
}
`;
export const deleteInvite = `mutation DeleteInvite($type: Int, $isOwner: Boolean, $userID: String) {
  deleteInvite(type: $type, isOwner: $isOwner, userID: $userID)
}
`;
