import * as reportGetters from './reportGetters.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

async function runAssetCountReport(tokens) {

    try {

        //console.log(`runStatusReport: Requesting STIG Manager Collections`);
        console.log(`runStatusReport: Requesting STIG Manager Data`);
        const collections = await reportGetters.getCollections(tokens.access_token)
        //console.log(collections);

        var metrics = [];

        var rows = [
            {
                collectionName: 'Collection',
                assetCount: 'Asset Count'
            }

        ];

        for (var i = 0; i < collections.length; i++) {
            var collectionName = collections[i].name;

            metrics.length = 0;
            metrics = await reportGetters.getCollectionMertics(tokens.access_token, collections[i].collectionId);

            var myData = getRow(collectionName, metrics);
            rows.push(myData);
        }
        
        const output = stringify(rows, function (err, output) {
            header: true
            //console.log(output)

        })

        const prompt = promptSync()
        const filePath = prompt('Where do you want to save the file? Enter full path name.')
        console.log(filePath)

        fs.writeFile(filePath, output, function (err) {
            if (err) {
                return console.log(err);
            }
            else {
                console.log("The file was saved!");
            }
        });
    }
    catch (e) {
        console.log(e)
    }
}

function getRow(collectionName, metrics) {

    const sumOfStigs = metrics.stigs;
    var totalAssetCount = 0;


    // get metrics data
    totalAssetCount = metrics.assets;

    var rowData = {
        collectionName: collectionName,
        assetCount: metrics.assets
    }

    return rowData
}

export { runAssetCountReport };