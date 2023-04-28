import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path'

async function runSAReportByLabelAndEmass(tokens) {

    try {

        console.log(`runSAReportByLabelAndEmass: Requesting STIG Manager Collections`);
        //console.log(`runSAReportByLabelAndEmass Requesting STIG Manager Data for collection ` + collectionName);

        const collections = await reportGetters.getCollections(tokens.access_token)
        //console.log(collections);

        var emassMap = reportUtils.getCollectionsByEmassNumber(collections);

        var labels = [];
        var metrics = [];
        let labelMap = new Map();

        var rows = [
            {
                emass: 'EMASS Number',
                collectionName: 'Collection',
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

        var iKey = 0;
        var iKeyend = emassMap.size;
        var myKeys = emassMap.keys();
        //console.log(myKeys);

        var collectionNames = '';
        while (iKey < iKeyend) {
            var emassNum = myKeys.next().value;
            var myCollections = emassMap.get(emassNum);
            var metricsData = [];

            for (var i = 0; i < myCollections.length; i++) {

                //labelMap.clear();
                labels.length = 0;
                labels = await reportGetters.getLabelsByCollection(tokens.access_token, myCollections[i].collectionId);
                //console.log("labels: " + labels);

                for (var x = 0; x < labels.length; x++) {
                    labelMap.set(labels[x].labelId, labels[x].description);
                }

                collectionNames = collectionNames + myCollections[i].name + ', ';
                metrics = await reportGetters.getCollectionMerticsAggreatedByLabel(tokens.access_token, myCollections[i].collectionId);
                //console.log(metrics);
                metricsData.push(metrics);
            }

            /*for (var i = 0; i < myCollections.length; i++) {
                collectionNames = collectionNames + myCollections[i].name + ', ';
                metrics = await reportGetters.getCollectionMerticsAggreatedByLabel(tokens.access_token, myCollections[i].collectionId);
                //console.log(metrics);
                metricsData.push(metrics);

            }*/

            // remove trailing comma and white space
            collectionNames = collectionNames.replace(/,\s*$/, "");
            var myData = getRow(emassNum, metricsData, labelMap, collectionNames);
            rows.push(myData);
            iKey++;
            metricsData.length = 0;
            collectionNames = '';
            labelMap.clear();
            
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

function getRow(emassNum, metrics, labelMap, collectionNames) {

    var numAssessments = 0;
    var numAssessed = 0;
    var numSubmitted = 0;
    var numAccepted = 0;
    var numRejected = 0;
    var numAssets = 0;
    var sumOfCat3 = 0;
    var sumOfCat2 = 0;
    var sumOfCat1 = 0;
    var labelName = '';
    var labelDesc = '';
    var labelNames = '';
    for (var i = 0; i < metrics.length; i++) {
        var myMetricsData = metrics[i];
        //console.log(myMetricsData);
        var myMetrics;
        for (var j = 0; j < myMetricsData.length; j++) {
            myMetrics = myMetricsData[j].metrics;
            //console.log(myMetrics);

            numAssessments += myMetrics.assessments;
            numAssessed += myMetrics.assessed;
            numSubmitted += myMetrics.statuses.submitted;
            numAccepted += myMetrics.statuses.accepted;
            numRejected += myMetrics.statuses.rejected;
            numAssets += myMetricsData[j].assets;
            sumOfCat3 += myMetrics.findings.low;
            sumOfCat2 += myMetrics.findings.medium;
            sumOfCat1 += myMetrics.findings.high;

            labelName = myMetricsData[j].name;
            labelDesc = labelMap.get(myMetricsData[j].labelId);
            if (labelDesc) {
                if (labelDesc.toUpperCase() === 'OWNER') {
                    labelName += ' (O)';
                }
                else if (labelDesc.toUpperCase() === 'PRIMARY SA') {
                    labelName += ' (SA)';
                }

                labelNames = labelNames + labelName + ', ';
            }
            
        }
    }
    
    const numUnassessed = numAssessments - numAssessed;
    const totalChecks = numAssessments;

    const avgAssessed = Math.round(numAssessments ? (numAssessed / numAssessments) * 100 : 0);
    const avgSubmitted = Math.round(numAssessments ? ((numSubmitted + numAccepted + numRejected) / numAssessments) * 100 : 0);
    const avgAccepted = Math.round(numAssessments ? ((numAccepted) / numAssessments) * 100 : 0);
    const avgRejected = Math.round(numAssessments ? ((numRejected) / numAssessments) * 100 : 0);

    // remove trailing comma and white space
    labelNames = labelNames.replace(/,\s*$/, "");

    var rowData = {
        emass: emassNum,
        collectionName: collectionNames,
        label: labelNames,
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

export { runSAReportByLabelAndEmass };