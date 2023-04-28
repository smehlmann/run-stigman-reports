import got from 'got'
import open from 'open'
import promptSync from 'prompt-sync'
import { stringify } from 'csv-stringify/sync'
import fs from 'fs'
import path from 'path'
import * as reportGetters from './reports/reportGetters.js';
import * as statusReport from './reports/statusReport.js';
import * as assetCountReport from './reports/assetCountReport.js';
import * as saReport from './reports/saReport.js';
import * as saReportByAsset from './reports/saReportByAsset.js';
import * as assetCountReportByEmass from './reports/assetCountReportByEmass.js';
import * as saReportByLabelAndEmass from './reports/saReportByLabelAndEmass.js';
 
const oidcBase = 'https://stigman.nren.navy.mil/auth/realms/np-stigman'
const apiBase = 'https://stigman.nren.navy.mil/np/api'
const client_id = 'np-stig-manager'
const scope = 'openid stig-manager:collection stig-manager:user stig-manager:stig stig-manager:op'

const prompt = promptSync();

console.log('Which report you want to run?');
console.log('To select "Run Assets by Collection" enter 1 when prompted.');
console.log('To select "Run Status Report" enter 2 when prompted.');
console.log('To select "Run Asset Count Report" enter 3 when prompted.');
console.log('To select "Run SA Report Aggregated by Label" enter 4 when prompted.');
console.log('To select "Run SA Report Aggregated Asset" enter 5 when prompted.');
console.log('To select "Run Asset Count Report by EMASS Number" enter 6 when prompted.');
console.log('To select "Run SAReport by Label and EMASS" enter 7 when prompted.');


const inputVal = prompt('Enter your choice by number: ');
var args;
var selection = inputVal.substring(0, inputVal.indexOf(' '));
if(selection.length == 0){
  selection = inputVal;
}
else{
  args = inputVal.substring(inputVal.indexOf(' ') + 1);
}

if(selection == 1){
  console.log('Run Assets by Collection');
  let tokens = await getTokens(oidcBase, client_id, scope);
  runAssetsByCollection(tokens);
}
else if(selection == 2){
  console.log('Run Status Report');
  let tokens = await getTokens(oidcBase, client_id, scope);
  statusReport.runStatusReport(tokens);
}
else if(selection == 3){
  console.log('Run Asset Count Report');
  let tokens = await getTokens(oidcBase, client_id, scope);
  assetCountReport.runAssetCountReport(tokens);
}
else if(selection == 4){
  console.log('Run SA Report');
  let tokens = await getTokens(oidcBase, client_id, scope);
  saReport.runSAReport(tokens);
}
else if(selection == 5){
  console.log('Run SA Report by Asset')
  let tokens = await getTokens(oidcBase, client_id, scope);
  saReportByAsset.runSAReportByAsset(tokens, args);
}
else if(selection == 6){
  console.log('Run Asset Count Report by EMASS Number')
  let tokens = await getTokens(oidcBase, client_id, scope);
  assetCountReportByEmass.runAssetCountReportByEmass(tokens);
}
else if(selection == 7){
  console.log('Run SAReport by Label and EMASS');
  let tokens = await getTokens(oidcBase, client_id, scope);
  saReportByLabelAndEmass.runSAReportByLabelAndEmass(tokens);
}
else{
  console.log('You must provide a valid report option.');
}

async function runAssetsByCollection(tokens) {
  try {

    console.log(`Requesting STIG Manager Collections`);
    const collections = await reportGetters.getCollections(tokens.access_token)
    //console.log(collections)

    var stigs = []
    var assets = []
    var rows = []

    for (var i = 0; i < collections.length; i++) {
      var collectionName = collections[i].name;

      //console.log("Requesting STIGS")
      stigs = await reportGetters.getStigs(tokens.access_token, collections[i].collectionId)
      //console.log(stigs)

      //console.log("Requesting assets")
      for (var k = 0; k < stigs.length; k++) {
        assets.length = 0;
        assets = await reportGetters.getAssets(tokens.access_token, collections[i].collectionId, stigs[k].benchmarkId)
        //console.log(assets)

        var myData = getRow(collectionName, stigs[k], assets)
        //console.log('myData: ', myData)
        //console.log('myData.length: ' + myData.length)
        //console.log(stringify(myData))

        rows.push(myData)
      }
    }


    const output = stringify(rows, function (err, output) {
      //header: true
      console.log(output)

    })

    //const output = getCsvOutput(rows)
    const filePath = prompt('Where do you want to save the file? Enter full path name.');
    console.log(filePath);

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

function wait(ms = 1000) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function poll(fn, fnCondition, ms) {
  let result = await fn()
  while (!fnCondition(result)) {
    await wait(ms)
    result = await fn()
  }
  return result
}

async function getToken(device_code) {
  try {
    console.log('Requesting token')
    const response = await got.post('https://stigman.nren.navy.mil/auth/realms/np-stigman/protocol/openid-connect/token', {
      //const response = await got.post('https://stigman.nren.navy.mil/auth/realms/np-stigman/protocol/openid-connect/token',{
      //const response = await got.post('http://localhost:8080/realms/stigman/protocol/openid-connect/token', {
      //const response = await got.post('https://login.microsoftonline.com/863af28d-88be-4b4d-a58a-d5c40ee1fa22/oauth2/v2.0/token', {
      form: {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: 'np-stig-manager',
        device_code
      }
    }).json()
    return response
  }
  catch (e) {
    console.log(e)
    return {}
  }
}

async function getDeviceCode(url, client_id, scope) {
  return await got.post(url, {
    form: {
      client_id,
      scope
    }
  }).json()
}

async function getOidcMetadata(url) {
  return await got.get(`${url}/.well-known/openid-configuration`).json()
}

async function getMetricsData(accessToken, myUrl) {
  //console.log("getMetricsData: Requesting data.")
  return await got.get(myUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }).json()
}

async function getCsvOutput(rows) {

  await stringify([
    ['1', '2', '3', '4'],
    ['a', 'b', 'c', 'd']
  ], function (err, output) {
    console.log(output);
  });
}

function getRow(collectionName, stigs, assets) {
  var assetNames = ''
  var benchmarkId = stigs.benchmarkId
  var stigVersion = stigs.lastRevisionStr

  for (var i = 0; i < assets.length; i++) {
    if (i < assets.length - 1) {
      assetNames += assets[i].name + ', '
    }
    else {
      assetNames += assets[i].name
    }
  }

  var rowData = {
    collectionName: collectionName,
    benchmark: benchmarkId,
    stigVersion: stigVersion,
    assetNames: assetNames
  }

  return rowData
}

async function getTokens(oidcBase, client_id, scope) {

  try {

    const oidcMeta = await getOidcMetadata(oidcBase)
    if (!oidcMeta.device_authorization_endpoint) {
      console.log(`Device Authorization grant is not supported by the OIDC Provider`)
      process.exit(1);
    }
    const response = await getDeviceCode(oidcMeta.device_authorization_endpoint, client_id, scope)

    //console.log(response)

    //await new Promise(resolve => setTimeout(resolve, 5000));
    //console.log(process.argv)

    //open(process.argv[2] === 'complete' ? response.verification_uri_complete : response.verification_uri)
    open(response.verification_uri_complete)


    let fetchToken = () => getToken(response.device_code)

    let validate = result => !!result.access_token
    let tokens = await poll(fetchToken, validate, response.interval * 1000)
    console.log(`Got access token from Keycloak`);

    return tokens;
  }
  catch (e) {
    console.log(e);
  }
}