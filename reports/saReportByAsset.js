import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path'

async function runSAReportByAsset(tokens, args) {

    try {

        //const prompt = promptSync();
        //const collectionName = prompt('Enter collection name.');

        console.log(`runStatusReport: Requesting STIG Manager Collections`);
        var collections = [];
        var tempCollections = [];
        //console.log(`runStatusReport: Requesting STIG Manager Data for collection ` + collectionName);

        tempCollections = await reportGetters.getCollections(tokens.access_token);

        if (!args || args.length === 0) {
            collections = tempCollections;
        }
        else {
            var emassMap = reportUtils.getCollectionsByEmassNumber(tempCollections);
            var emassArray = args.split(',');
            for (var mapIdx = 0; mapIdx < emassArray.length; mapIdx++) {
                if (emassMap.has(emassArray[mapIdx])) {

                    var mappedCollection = emassMap.get(emassArray[mapIdx]);
                    if (mappedCollection) {
                        collections = collections.concat(mappedCollection);
                    }
                }
            }
        }
        //console.log(collections);
        //const collections = await reportGetters.getCollectionByName(tokens.access_token, collectionName);

        var metrics = [];
        var labels = [];
        let labelMap = new Map();

        var rows = [
            {
                collectionName: 'Collection',
                asset: 'Asset',
                primOwner: 'Primary Owner',
                secOwner: 'Second Owner',
                sysAdmin: 'Sys Admin',
                label: 'Label',
                stigs: 'STIGs',
                benchmarks: 'Benchmarks',
                assessed: 'Assessed',
                submitted: 'Submitted',
                accepted: 'Accepted',
                rejected: 'Rejected',
                cat3: 'CAT3',
                cat2: 'CAT2',
                cat1: 'CAT1'
            }
        ];


        for (var i = 0; i < collections.length; i++) {
            var collectionName = collections[i].name;
            //console.log(collectionName);
            labelMap.clear();
            labels.length = 0;

            labels = await reportGetters.getLabelsByCollection(tokens.access_token, collections[i].collectionId);
            for (var x = 0; x < labels.length; x++) {
                labelMap.set(labels[x].labelId, labels[x].description);
            }


            metrics = await reportGetters.getCollectionMerticsAggreatedByAsset(tokens.access_token, collections[i].collectionId);
            //console.log(metrics);

            for (var j = 0; j < metrics.length; j++) {
                var myData = getRow(collectionName, metrics[j], labelMap);
                rows.push(myData);

            }
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

function getRow(collectionName, metrics, labelMap) {

    const numAssessments = metrics.metrics.assessments;
    const numAssessed = metrics.metrics.assessed;
    const numSubmitted = metrics.metrics.statuses.submitted;
    const numAccepted = metrics.metrics.statuses.accepted;
    const numRejected = metrics.metrics.statuses.rejected;
    const numSaved = metrics.metrics.statuses.rejected;
    const numAssets = metrics.assets;

    var primOwner = "";
    var secOwner = "";
    var sysAdmin = "";
    var labelName = "";
    for (var iLabel = 0; iLabel < metrics.labels.length; iLabel++) {

        var labelDesc = labelMap.get(metrics.labels[iLabel].labelId);

        if (labelDesc) {
            if (labelDesc.toUpperCase() === 'OWNER') {
                if (primOwner === "") {
                    primOwner = metrics.labels[iLabel].name;
                }
                else {
                    secOwner = metrics.labels[iLabel].name;
                }
            }
            else if (labelDesc.toUpperCase() === 'PRIMARY SA') {
                sysAdmin = metrics.labels[iLabel].name;
            }
            else {
                labelName = metrics.labels[iLabel].name;
            }
        }
        else {
            labelName = metrics.labels[iLabel].name;
        }
    }

    const numUnassessed = numAssessments - numAssessed;
    const totalChecks = numAssessments;

    const avgAssessed = Math.round(numAssessments ? (numAssessed / numAssessments) * 100 : 0);
    const avgSubmitted = Math.round(numAssessments ? ((numSubmitted + numAccepted + numRejected) / numAssessments) * 100 : 0);
    const avgAccepted = Math.round(numAssessments ? ((numAccepted) / numAssessments) * 100 : 0);
    const avgRejected = Math.round(numAssessments ? ((numRejected) / numAssessments) * 100 : 0);

    const sumOfCat3 = metrics.metrics.findings.low;
    const sumOfCat2 = metrics.metrics.findings.medium;
    const sumOfCat1 = metrics.metrics.findings.high;

    var rowData = {
        collectionName: collectionName,
        asset: metrics.name,
        primOwner: primOwner,
        secOwner: secOwner,
        sysAdmin: sysAdmin,
        label: labelName,
        stigs: metrics.benchmarkIds.length,
        benchmarks: metrics.benchmarkIds.toString(),
        assessed: avgAssessed + '%',
        submitted: avgSubmitted + '%',
        accepted: avgAccepted + '%',
        rejected: avgRejected + '%',
        cat3: sumOfCat3,
        cat2: sumOfCat2,
        cat1: sumOfCat1
    }


    return rowData;

}

export { runSAReportByAsset };