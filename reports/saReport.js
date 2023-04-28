import * as reportGetters from './reportGetters.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path'

async function runSAReport(tokens) {

    try {

        //const prompt = promptSync();
        //const collectionName = prompt('Enter collection name.');

        console.log(`runStatusReport: Requesting STIG Manager Collections`);
        //console.log(`runStatusReport: Requesting STIG Manager Data for collection ` + collectionName);
        const collections = await reportGetters.getCollections(tokens.access_token)
        //console.log(collections);
        //const collections = await reportGetters.getCollectionByName(tokens.access_token, collectionName);

        var labels = [];
        var assets = [];
        var stigs = [];
        var metrics = [];

        let labelMap = new Map();

        var rows = [
            {
                emassNum: 'EMASS Number',
                collectionName: 'Collections',
                label: 'Label',
                asset: 'Asset',
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

            metrics = await reportGetters.getCollectionMerticsAggreatedByLabel(tokens.access_token, collections[i].collectionId);
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
    var labelName = metrics.name;
    var labelDesc = labelMap.get(metrics.labelId);
    if (labelDesc) {
        if (labelDesc.toUpperCase() === 'OWNER') {
            labelName += ' (O)';
        }
        else if (labelDesc.toUpperCase() === 'PRIMARY SA') {
            labelName += ' (SA)';
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
        label: labelName,
        asset: numAssets,
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

export { runSAReport };