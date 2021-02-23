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
    tests: 0,
    countryName: getCountryName(countriesAndTerritories),
  }));

  maybeAddMissingDays(activeCasesNormalized);

  fs.writeFileSync(
    './data/global-cases-and-deaths.js',
    'window.data = ' + JSON.stringify(activeCasesNormalized, null, 4)
  );
}

function maybeAddMissingDays(activeCases) {
  const romaniaEntries = activeCases.filter((x) => x.countryName == 'Romania');
  const todayString = moment().format('DD/MM/YYYY');
  const maybeMissingDays = [todayString, '05/03/2020', '03/03/2020'];

  maybeMissingDays.forEach((maybeMissingDay) => {
    if (!romaniaEntries.find((x) => x.dateString == maybeMissingDay)) {
      const currentHour = moment().format('HH');
      if (+currentHour > 11 || maybeMissingDay !== todayString) {
        activeCases.push({ countryName: 'Romania', dateString: maybeMissingDay, deaths: 0, recoveries: 0, cases: 0 });
      }
    }
  });
}

function getCountryName(countryName) {
  if (countryName.toLowerCase().startsWith('united_states_of_amer')) {
    return 'USA';
  }
  if (countryName.startsWith('cases')) {
    return 'Diamond Princess';
  }

  return countryName.replace(/\_/g, ' ');
}

function bumpRomaniaVersion() {
  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const myRegexp = /data\/romania\.js\?v=([0-9]*)/;
  const [_, version] = myRegexp.exec(indexHtml);

  const replacedIndexHtml = indexHtml.replace(myRegexp, 'data/romania.js?v=' + (+version + 1));

  fs.writeFileSync(indexHtmlPath, replacedIndexHtml);
}

function bumpRomaniaDeathsVersion() {
  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const myRegexp = /data\/romania-deaths\.js\?v=([0-9]*)/;
  const [_, version] = myRegexp.exec(indexHtml);

  const replacedIndexHtml = indexHtml.replace(myRegexp, 'data/romania-deaths.js?v=' + (+version + 1));

  fs.writeFileSync(indexHtmlPath, replacedIndexHtml);
}

function bumpGlobalCasesVersion() {
  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const myRegexp = /data\/global-cases-and-deaths\.js\?v=([0-9]*)/;
  const [_, version] = myRegexp.exec(indexHtml);

  const replacedIndexHtml = indexHtml.replace(myRegexp, 'data/global-cases-and-deaths.js?v=' + (+version + 1));

  fs.writeFileSync(indexHtmlPath, replacedIndexHtml);
}

function bumpAppJsVersion() {
  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const myRegexp = /js\/app\.js\?v=([0-9]*)/;
  const result = myRegexp.exec(indexHtml);

  const [_, version] = result;

  const replacedIndexHtml = indexHtml.replace(myRegexp, 'js/app.js?v=' + (+version + 1));

  fs.writeFileSync(indexHtmlPath, replacedIndexHtml);
}

function bumpAppCssVersion() {
  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const myRegexp = /css\/styles\.css\?v=([0-9]*)/;
  const [_, version] = myRegexp.exec(indexHtml);

  const replacedIndexHtml = indexHtml.replace(myRegexp, 'css/styles.css?v=' + (+version + 1));

  fs.writeFileSync(indexHtmlPath, replacedIndexHtml);
}

async function addTodayCases() {
  const { todayCases, todayRecoveries, todayDeaths, todayTests } = await crawlTodaysCases();

  if (!todayCases) {
    return;
  }

  let romaniaDailyCasesString = fs.readFileSync('./data/romania.js', 'utf8');

  const romaniaDailyCases = JSON.parse(romaniaDailyCasesString.replace('window.romaniaData = ', ''));

  const todayKey = moment().format('DD/MM/YYYY');

  const totalCasesSoFar = Object.keys(romaniaDailyCases)
    .map((x) => romaniaDailyCases[x].cases)
    .reduce((a, b) => a + b);
  const totalRecoveriesSoFar = Object.keys(romaniaDailyCases)
    .map((x) => romaniaDailyCases[x].recoveries)
    .reduce((a, b) => a + b);
  const totalDeathsSoFar = Object.keys(romaniaDailyCases)
    .map((x) => romaniaDailyCases[x].deaths)
    .reduce((a, b) => a + b);
  const totalTestsSoFar = Object.keys(romaniaDailyCases)
    .map((x) => romaniaDailyCases[x].tests)
    .reduce((a, b) => a + b);

  romaniaDailyCases[todayKey] = {
    cases: todayCases - totalCasesSoFar,
    recoveries: todayRecoveries - totalRecoveriesSoFar,
    deaths: todayDeaths - totalDeathsSoFar,
    tests: todayTests - totalTestsSoFar,
  };

  const newRomaniaDailyCases = {};
  [todayKey, ...Object.keys(romaniaDailyCases)].forEach((key) => {
    newRomaniaDailyCases[key] = romaniaDailyCases[key];
  });

  const newRomaniaDailyCasesString = 'window.romaniaData = ' + JSON.stringify(newRomaniaDailyCases, null, 2);

  fs.writeFileSync('./data/romania.js', newRomaniaDailyCasesString);
}

async function crawlTodaysCases() {
  const months = [
    'ianuarie',
    'februarie',
    'martie',
    'aprilie',
    'mai',
    'iunie',
    'iulie',
    'august',
    'septembrie',
    'octombrie',
    'noiembrie',
    'decembrie',
  ];

  // const day = 23;
  const day = +moment().format('DD');
  const month = months[+moment().format('MM') - 1];
  const year = +moment().format('YYYY');
  const url = `https://stirioficiale.ro/informatii/buletin-de-presa-${day}-${month}-${year}-ora-13-00`;

  const pageHtml = await (await fetch(url)).text();

  if (pageHtml.includes('nu am găsit pagina')) {
    console.log('[' + moment().format('DD/MM/YYYY HH:mm:ss') + '] ' + 'Article not published yet.');
    return {};
  } else {
    fetchActiveCases();
    bumpAppJsVersion();
    bumpAppCssVersion();
    bumpGlobalCasesVersion();
    bumpRomaniaVersion();
    bumpRomaniaDeathsVersion();

    const todayCases = +pageHtml.match(/au fost confirmate ([0-9+\.]+) (de )?cazuri/)[1].replace(/\./g, '');
    console.log('totalCases', todayCases);

    const todayRecoveries = +pageHtml
      .match(/([0-9+\.]+) (de )?pacienți au fost declarați vindecați/)[1]
      .replace(/\./g, '');
    console.log('totalRecoveries', todayRecoveries);

    const todayDeaths = +pageHtml
      .match(
        /P&acirc;nă astăzi, ([0-9+\.]+) (de )?persoane diagnosticate cu infecție cu SARS &ndash; CoV &ndash; 2 au decedat./
      )[1]
      .replace(/\./g, '');
    console.log('totalDeaths', todayDeaths);

    const todayTests = +pageHtml.match(/au fost prelucrate ([0-9+\.]+)/)[1].replace(/\./g, '');
    console.log('totalTests', todayTests);

    return { todayCases, todayRecoveries, todayDeaths, todayTests };
  }
}

addTodayCases();
