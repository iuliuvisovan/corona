const fs = require('fs');
const fetch = require('node-fetch');

async function fetchActiveCases() {
  const jsonUrl = 'https://opendata.ecdc.europa.eu/covid19/casedistribution/json';

  const activeCases = await (await fetch(jsonUrl)).json();

  const activeCasesNormalized = activeCases.records.map(({ dateRep, cases, deaths, countriesAndTerritories }) => ({
    dateString: dateRep,
    cases: +cases,
    deaths: +deaths,
    countryName: countriesAndTerritories,
  }));

  fs.writeFileSync('./data/active/current.js', 'window.data = ' + JSON.stringify(activeCasesNormalized, null, 4));
}

function bumpRomaniaVersion() {
  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const myRegexp = /data\/romania\.js\?v=([0-9]*)/;
  const [_, version] = myRegexp.exec(indexHtml);

  const replacedIndexHtml = indexHtml.replace(myRegexp, 'data/romania.js?v=' + (+version + 1));

  fs.writeFileSync(indexHtmlPath, replacedIndexHtml);
}

function bumpActiveCasesVerions() {
  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const myRegexp = /data\/active\/current\.js\?v=([0-9]*)/;
  const [_, version] = myRegexp.exec(indexHtml);

  const replacedIndexHtml = indexHtml.replace(myRegexp, 'data/active/current.js?v=' + (+version + 1));

  fs.writeFileSync(indexHtmlPath, replacedIndexHtml);
}

function bumpAppJsVersion() {
  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const myRegexp = /js\/app\.js\?v=([0-9]*)/;
  const [_, version] = myRegexp.exec(indexHtml);

  const replacedIndexHtml = indexHtml.replace(myRegexp, 'js/app.js?v=' + (+version + 1));

  fs.writeFileSync(indexHtmlPath, replacedIndexHtml);
}

fetchActiveCases();
bumpAppJsVersion();
bumpActiveCasesVerions();
bumpRomaniaVersion();
