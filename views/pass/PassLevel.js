export function GetBlockLevel(type) {
    //TODO figure out official names of select, deluxe, and signature
    if (type == "socal-select-annual") {
        return 0;
    } else if (type == "socal-annual" || type == "dlrSocalAnnualPass") {
        return 1;
    } else if (type == "deluxe") {
        return 2;
    } else if (type == "signature") {
        return 3;
    } else if (type == "signature-plus") {
        return 4;
    }
    return 5;  //Probably a day pass
}