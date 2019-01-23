// eslint-disable
// this is an auto generated file. This will be overwritten

export const addFastPass = `mutation AddFastPass($rideID: String, $targetPasses: [String]) {
  addFastPass(rideID: $rideID, targetPasses: $targetPasses) {
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
export const replaceFastPasses = `mutation ReplaceFastPasses($fastPasses: [FastPassInput]) {
  replaceFastPasses(fastPasses: $fastPasses)
}
`;
export const removeFastPasses = `mutation RemoveFastPasses($fptID: String, $targetIDs: [String]) {
  removeFastPasses(fptID: $fptID, targetIDs: $targetIDs)
}
`;
export const addPass = `mutation AddPass($passID: String) {
  addPass(passID: $passID) {
    id
    name
    disID
    type
    expirationDT
  }
}
`;
export const removePass = `mutation RemovePass($passID: String) {
  removePass(passID: $passID)
}
`;
export const updateFastPasses = `mutation UpdateFastPasses {
  updateFastPasses {
    fps {
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
    nextSelection
  }
}
`;
export const updateRides = `mutation UpdateRides {
  updateRides {
    rides {
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
}
`;
export const addAccelData = `mutation AddAccelData($accelData: String) {
  addAccelData(accelData: $accelData)
}
`;
export const initUser = `mutation InitUser {
  initUser
}
`;
export const updateRideFilter = `mutation UpdateRideFilter($rideFilter: RideFilterIn) {
  updateRideFilter(rideFilter: $rideFilter) {
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
export const deleteRideFilters = `mutation DeleteRideFilters($filterIDs: [String]) {
  deleteRideFilters(filterIDs: $filterIDs)
}
`;
export const updateParkingLocation = `mutation UpdateParkingLocation($latitude: Float, $longitude: Float) {
  updateParkingLocation(latitude: $latitude, longitude: $longitude)
}
`;
export const updateParkingPosition = `mutation UpdateParkingPosition($level: String, $row: String, $col: String) {
  updateParkingPosition(level: $level, row: $row, col: $col)
}
`;
export const updateNotifyDate = `mutation UpdateNotifyDate($date: String) {
  updateNotifyDate(date: $date)
}
`;
