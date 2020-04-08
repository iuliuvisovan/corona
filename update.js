const fs = require('fs');
const fetch = require('node-fetch');
const moment = require('moment');

async function fetchActiveCases() {
  const jsonUrl = 'https://opendata.ecdc.europa.eu/covid19/casedistribution/json';

  const { records: activeCases } = await (await fetch(jsonUrl)).json();

  const activeCasesNormalized = activeCases.map(({ dateRep, cases, deaths, countriesAndTerritories }) => ({
    dateString: dateRep,
    cases: +cases,
    deaths: +deaths,
    countryName: countriesAndTerritories,
  }));

  const completeActiveCases = maybeAddMissingDays(activeCasesNormalized);

  fs.writeFileSync('./data/active/current.js', 'window.data = ' + JSON.stringify(completeActiveCases, null, 4));
}

function maybeAddMissingDays(activeCases) {
  const completeActiveCases = activeCases;
  const romaniaEntries = activeCases.filter((x) => x.countryName == 'Romania');
  const todayString = moment().format('DD/MM/YYYY');
  const maybeMissingDays = [todayString, '05/03/2020', '03/03/2020'];

  maybeMissingDays.forEach((maybeMissingDay) => {
    if (!romaniaEntries.find((x) => x.dateString == maybeMissingDay)) {
      const currentHour = moment().format('HH');
      if (+currentHour > 12 || maybeMissingDay !== todayString) {
        completeActiveCases.push({ countryName: 'Romania', dateString: maybeMissingDay, deaths: 0, recoveries: 0, cases: 0 });
      }
    }
  });

  return completeActiveCases;
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
