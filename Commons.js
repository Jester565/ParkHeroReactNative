function addToArr(arr, addElm, isEqual) {
    for (var elm of arr) {
        if (isEqual(elm, addElm)) {
            return arr;
        }
    }
    var newArr = arr.slice();
    newArr.push(addElm);
    return newArr;
}

function removeFromArr(arr, removeElm, isEqual) {
    var newArr = [];
    for (var elm of arr) {
        if (!isEqual(elm, removeElm)) {
            newArr.push(elm);
        }
    }
    if (newArr.length != arr.length) {
        return newArr;
    }
    return arr;
}

export default {
    addToArr: addToArr,
    removeFromArr: removeFromArr
}
