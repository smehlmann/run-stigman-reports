function getCollectionsByEmassNumber(collections) {

    let emassMap = new Map();

    for (var x = 0; x < collections.length; x++) {
        var idx = collections[x].name.search("_[0-9]{1,}_");
        if (idx >= 0) {
            var emassNum = collections[x].name.substring(idx);
            emassNum = emassNum.replace('_', '');
            idx = emassNum.search("_");
            emassNum = emassNum.substring(0, idx);
            var myVal = emassMap.get(emassNum);
            if (myVal) {
                myVal.push(collections[x]);
                emassMap.set(emassNum, myVal);
            }
            else {
                myVal = [collections[x]];
                emassMap.set(emassNum, myVal);
            }
        }
    }

    return emassMap;
}

export { getCollectionsByEmassNumber };