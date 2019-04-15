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
export const updateCustomAttractionInfo = `mutation UpdateCustomAttractionInfo(
  $attractionID: String!
  $customName: String
  $pics: [Pic]
) {
  updateCustomAttractionInfo(
    attractionID: $attractionID
    customName: $customName
    pics: $pics
  ) {
    name
    officialName
    picUrl
    officialPicUrl
    land
    height
    labels
    customPicUrls
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
  $attractionIDs: [String]
  $filterType: String
  $watchConfig: WatchConfigInput
) {
  updateFilter(
    filterName: $filterName
    attractionIDs: $attractionIDs
    filterType: $filterType
    watchConfig: $watchConfig
  )
}
`;
export const deleteFilters = `mutation DeleteFilters($filterNames: [String], $filterType: String) {
  deleteFilters(filterNames: $filterNames, filterType: $filterType)
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
export const updatePlannedFpTransactions = `mutation UpdatePlannedFpTransactions(
  $plannedTransactions: [PlannedFpTransactionIn]
) {
  updatePlannedFpTransactions(plannedTransactions: $plannedTransactions) {
    transactions {
      attractionID
      attractionName
      attractionPicUrl
      attractionOfficialPicUrl
      startDateTime
      endDateTime
      passes {
        id
        startDateTime
        endDateTime
      }
    }
    plannedTransactions {
      id
      attractionID
      attractionName
      attractionPicUrl
      attractionOfficialPicUrl
      selectionDateTime
      fastPassTime
      passes {
        id
        priority
        nextSelectionDateTime
      }
    }
    allUserPasses {
      user {
        id
        name
        profilePicUrl
      }
      allPasses {
        pass {
          id
          name
          type
          expirationDT
          isPrimary
          isEnabled
          hasMaxPass
        }
        fastPassInfo {
          selectionDateTime
          earliestSelectionDateTime
          earliestSelectionDateTimes
          priority
        }
      }
    }
  }
}
`;
export const refreshPasses = `mutation RefreshPasses {
  refreshPasses
}
`;
export const syncPasses = `mutation SyncPasses($passID: String) {
  syncPasses(passID: $passID)
}
`;
