import got from 'got';
import open from 'open';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path';

const apiBase = 'https://stigman.nren.navy.mil/np/api';

async function getMetricsData(accessToken, myUrl) {
  //console.log("getMetricsData: Requesting data.")
  return await got.get(myUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }).json()
}

async function getCollections(accessToken) {

  var myUrl = apiBase + '/collections';
  var collections = getMetricsData(accessToken, myUrl);
  return collections;
}

async function getCollectionByName(accessToken, collectionName) {

  var myUrl = apiBase + '/collections?name=' + collectionName + '&name-match=exact';
  var collections = getMetricsData(accessToken, myUrl);
  return collections;
}

async function getStigs(accessToken, collectionId) {
  //console.log('inGetStigs')
  var myUrl = apiBase + '/collections/' + collectionId + '/stigs'
  var stigs = getMetricsData(accessToken, myUrl)
  return stigs
}

async function getStigsByAsset(accessToken, assetId) {
  //console.log('inGetStigsByAssets')
  var myUrl = apiBase + '/assets/' + assetId + '/stigs';
  //console.log('myUrl: ' + myUrl);
  var stigs = getMetricsData(accessToken, myUrl)
  return stigs
}

async function getAssets(accessToken, collectionId, benchmarkId) {
  //console.log('inGetStigs')
  var myUrl = apiBase + '/collections/' + collectionId + '/stigs/' + benchmarkId + '/assets'
  var assets = getMetricsData(accessToken, myUrl)
  return assets
}

async function getAssetsByCollection(accessToken, collectionId) {

  //console.log('getAssetsByCollection');
  var myUrl = apiBase + '/assets?collectionId=' + collectionId + '&name-match=exact';
  var assets = getMetricsData(accessToken, myUrl)
  return assets;
}

async function getAssetsByLabel(accessToken, collectionId, labelId) {

  //console.log('getAssetsByLabel');
  var myUrl = apiBase + '/collections/' + collectionId + '/labels/' + labelId + '/assets';
  var assets = getMetricsData(accessToken, myUrl)
  return assets;
}


async function getFindingsByCollectionAndAsset(accessToken, collectionId, assetId) {

  //console.log('getFindingsByCollectionAndAsset assetId: ' + assetId);
  var myUrl = apiBase + '/collections/' + collectionId + '/findings?aggregator=ruleId&acceptedOnly=false&assetId=' + assetId;
  var assets = getMetricsData(accessToken, myUrl)
  return assets;

}

async function getFindingsByCollection(accessToken, collectionId) {

  //console.log('getFindingsByCollectionAndAsset assetId: ' + assetId);
  var myUrl = apiBase + '/collections/' + collectionId + 'findings?aggregator=ruleId&acceptedOnly=false';
  var assets = getMetricsData(accessToken, myUrl)
  return assets;

}

async function getCollectionMertics(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail/collection?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getCollectionMerticsAggreatedByLabel(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/summary/label?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getCollectionMerticsAggreatedByAsset(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/summary/asset?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

// Return metrics for the specified Collection aggregated by collection ID, stig benchmark, asset ID, label ID
async function getCollectionMerticsByCollectionBenchmarkAssetAndLabel(accessToken, collectionId,
  benchmark, assetId, labelId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail/stig?benchmarkId=' +
    benchmark + '&assetId=' + assetId + '&labelId=' + labelId + '&format=json';

  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

// Return metrics for the specified Collection aggregated by collection ID, stig benchmark, asset ID, label ID
async function getCollectionMerticsByCollectionAssetAndLabel(accessToken, collectionId, assetId, labelId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail?assetId=' + assetId + '&labelId=' + labelId
    + '&format=json';

  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

// Return metrics for the specified Collection by collection ID, and asset ID
async function getCollectionMerticsByCollectionAndAsset(accessToken, collectionId, assetId) {

  //collections/1/metrics/detail/stig?benchmarkId=Network_WLAN_AP-NIPR_Mgmt_STIG&assetId=1&labelId=1&format=json
  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail?assetId=' + assetId + '&format=json';

  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getCollectionMerticsUnaggregated(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getCollectionMerticAggregatedByStig(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/summary/stig?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getCollectionMerticsdByStig(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/summary/stig?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getLabelsByCollection(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/labels';
  var labels = getMetricsData(accessToken, myUrl);
  return labels;

}


export {
  getCollections,
  getCollectionByName,
  getStigs,
  getStigsByAsset,
  getAssets,
  getAssetsByLabel,
  getAssetsByCollection,
  getCollectionMerticsAggreatedByLabel,
  getCollectionMerticsAggreatedByAsset,
  getFindingsByCollectionAndAsset,
  getFindingsByCollection,
  getCollectionMertics,
  getCollectionMerticsByCollectionBenchmarkAssetAndLabel,
  getCollectionMerticsByCollectionAndAsset,
  getCollectionMerticsByCollectionAssetAndLabel,
  getCollectionMerticsUnaggregated,
  getCollectionMerticsdByStig,
  getLabelsByCollection
};