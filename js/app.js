moment.locale('ro');
const isPortrait = window.innerHeight > window.innerWidth;
const isPortraitMobile = window.innerWidth < 768 && isPortrait;
const isLandscapeMobile = window.innerWidth < 768 && !isPortrait;
const maxElementsInWidth = window.innerWidth / 30;
const defaultDateFormat = isPortraitMobile ? 'DD.MM' : 'DD MMMM';
const formatThousandsAsK = (value) => (value > 999 ? value / 1000 + 'k' : value);

async function init() {
  await processData();
  populateLabelsSinceStartOfYear();
  setupBarLabels();
  setTimeout(() => {
    setPickerCountries(window.data);
  }, 0);
}

var startTime;
var endTime;

async function draw() {
  drawRomaniaDeathMap();
  drawRomaniaSexBar();
  drawRomaniaAgeCasesPie();

  setTimeout(
    () => {
      drawRomaniaDiseasesPie();
    },
    isPortraitMobile ? 500 : 0
  );
  setTimeout(
    async () => {
      await init();
      drawCountryDailyBars('romaniaChart', 'Romania');
      drawCountryEvolutionLine('romaniaTotals', 'Romania');

      drawGlobalActiveCases();
      show('globalActiveCasesWrapper', document.querySelector('button'), true);

      drawCountryDailyBars('otherCountryChart', 'Italy', '#ffeb3b'); //8
      drawCountryActiveCases('Romania'); // 29
      drawCountryEvolutionLine('otherCountryTotals', 'Italy', '#ffeb3b'); //30
      drawLastWeekTotalsBars(); //122
      drawAllTimeTotalsBars(); //22
      drawGlobalEvolutionLine(); //22
    },
    isPortraitMobile ? 1200 : 800
  );
}

function setCurrentDate() {
  const currentDateSpan = document.getElementById('lastUpdated');
  currentDateSpan.innerText = moment().format('DD.MM.YYYY');
}

var otherCountryChart = undefined;
var otherCountryChartTotals = undefined;
var countryActiveCases = undefined;

function drawRomaniaDeathMap() {
  const country = window.romaniaTopo;
  const states = ChartGeo.topojson.feature(country, country.objects.states).features;

  states.forEach(({ properties }) => {
    properties.name = properties.name.startsWith('Buch') ? 'București' : properties.name;
  });

  const labels = states.map((d) => d.properties.name);

  const nation = JSON.parse(JSON.stringify(states[0]));

  nation.geometry.coordinates[0][0][0] -= 0;
  nation.geometry.coordinates[0][0][1] += 1.9;

  nation.geometry.coordinates[0][260 / 2][0] += 4;
  nation.geometry.coordinates[0][260 / 2][1] -= 2.5;

  const values = states.map((d) => ({
    feature: d,
    value: window.romaniaDeaths.filter((x) => d.properties.name.toLowerCase() == x.county.toLowerCase()).length,
  }));

  new Chart(document.querySelector('#deathMap canvas').getContext('2d'), {
    type: 'choropleth',
    data: {
      labels: labels.map((x, i) => `${x}: ${values[i].value}`),
      datasets: [
        {
          label: 'States',
          outline: nation,
          backgroundColor: (context) => {
            if (context.dataIndex == null) {
              return null;
            }
            const { value } = context.dataset.data[context.dataIndex];

            const colors = ['#E91E63', '#ff5722', '#ff9800', '#ffc107', '#ffeb3b', '#cddc39'];

            if (value > 80) {
              return colors[0];
            }
            if (value > 35) {
              return colors[1];
            }
            if (value > 20) {
              return colors[2];
            }
            if (value > 5) {
              return colors[3];
            }
            if (value > 0) {
              return colors[4];
            }

            return '#fff';
          },
          data: values,
        },
      ],
    },
    options: {
      legend: {
        display: false,
      },
      scale: {
        projection: d3.geoMercator(),
      },
    },
  });
}

const countyCodes = {
  Suceava: 'SV',
  Hunedoara: 'HD',
  Arad: 'AR',
  București: 'B',
  Timiș: 'TM',
  Mureș: 'MS',
  Neamț: 'NT',
  Galați: 'GL',
  Ialomița: 'IL',
  Botoșani: 'BT',
  'Bistrița N.': 'BN',
  Sibiu: 'SB',
  Vrancea: 'VN',
  Brașov: 'BV',
  Bacău: 'BC',
};

function drawRomaniaCountyCasesPie() {
  const ctx = document.getElementById('romaniaCountyDeaths').getContext('2d');
  const data = window.romaniaDeaths;

  let labels = [...new Set(data.map((x) => x.county))]
    .sort((a, b) => data.filter((y) => y.county == b).length - data.filter((y) => y.county == a).length)
    .slice(0, 15);

  const othersValue = data.filter((x) => !labels.includes(x.county)).length;
  const values = [...labels.map((x) => data.filter((y) => y.county == x).length), othersValue];

  otherCountryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [...labels.map((x) => x[0].toUpperCase() + x.substr(1)).map((x) => (isPortraitMobile ? countyCodes[x] || 'bb' : x)), 'Restul județelor'],
      datasets: [
        {
          label: 'Morți pe judet',
          data: values,
          backgroundColor: [
            '#ff5722',
            '#ff9800',
            '#ffc107',
            '#ffeb3b',
            '#cddc39',
            '#8bc34a',
            '#4caf50',
            '#009688',
            '#00BCD4',
            '#03A9F4',
            '#2196f3',
            '#3f51b5',
            '#673ab7',
            '#673ab7',
            '#673ab7',
            '#673ab7',
          ],
        },
      ],
    },
    options: {
      legend: {
        display: false,
      },
      maintainAspectRatio: false,
      layout: {
        padding: {
          right: 85,
        },
      },
      plugins: {
        labels: {
          render: ({ label, value }) => {
            if (label.startsWith('     Restul')) {
              return `${label}: ${value}\n`;
            }

            return `${label}: ${value}`;
          },
          precision: 0,
          showZero: true,
          fontSize: 12,
          fontColor: '#444',
          fontStyle: 'normal',
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          textShadow: true,
          shadowBlur: 10,
          shadowOffsetX: -5,
          shadowOffsetY: 5,
          shadowColor: '#0000',
          arc: false,
          position: 'outside',
          overlap: true,
          showActualPercentages: true,
          images: [
            {
              src: 'image.png',
              width: 16,
              height: 16,
            },
          ],
          outsidePadding: 4,
          textMargin: 6,
        },
      },
    },
  });
}

function drawRomaniaAgeCasesPie() {
  const ctx = document.getElementById('romaniaAgeDeaths').getContext('2d');
  const data = window.romaniaDeaths;

  const intervals = [
    {
      min: 0,
      max: 10,
      label: '<10 ani',
    },
    {
      min: 10,
      max: 20,
      label: '10-20',
    },
    {
      min: 20,
      max: 30,
      label: '20-30',
    },
    {
      min: 30,
      max: 40,
      label: '30-40',
    },
    {
      min: 40,
      max: 50,
      label: '40-50',
    },
    {
      min: 50,
      max: 60,
      label: '50-60',
    },
    {
      min: 60,
      max: 70,
      label: '60-70',
    },
    {
      min: 70,
      max: 100,
      label: '70+',
    },
  ];

  let labels = intervals.map((x) => x.label);
  const values = intervals.map((x) => data.filter((y) => y.age > x.min && y.age <= x.max).length);

  otherCountryChart = new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels: labels.map((x, i) => `${x} (${values[i]})`),
      datasets: [
        {
          label: 'Morți pe grupe de varsta',
          data: values,
          backgroundColor: ['#E91E63', '#F44336', '#ff5722', '#ff9800', '#ffc107', '#ffeb3b', '#2196f3', undefined].reverse(),
        },
      ],
    },
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              reverse: true,
              beginAtZero: true,
              stepSize: 10,
              display: false,
            },
            gridLines: {
              display: false,
              color: 'rgba(0, 0, 0, 0)',
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              reverse: true,
              beginAtZero: true,
              display: false,
              max: values[values.length - 1],
            },
            gridLines: {
              display: false,
              color: 'rgba(0, 0, 0, 0)',
            },
          },
        ],
      },
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 170,
          right: 12,
        },
      },
      tooltips: {
        enabled: false,
      },
      legend: {
        display: false,
      },
      plugins: {
        labels: {
          render: ({ label }) => {
            return label + '                      ';
          },
          precision: 0,
          showZero: true,
          fontSize: 14,
          fontColor: '#000',
          fontStyle: 'normal',
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          arc: false,
          // position: 'outside',
          overlap: true,
          showActualPercentages: true,
          outsidePadding: 100,
          textMargin: 100,
        },
      },
    },
  });
}

function drawRomaniaDiseasesPie() {
  const ctx = document.getElementById('romaniaConditionDeaths').getContext('2d');
  const data = window.romaniaDeaths;

  const allConditionsDuplicated = data.map((x) => x.preexistingCondition).flat();

  let labels = [...new Set(allConditionsDuplicated)]
    .sort((a, b) => allConditionsDuplicated.filter((y) => y == b).length - allConditionsDuplicated.filter((y) => y == a).length)
    .slice(0, 5)
    .sort((a, b) => b - a);

  const unknownValue = data.filter((x) => !x.preexistingCondition).length;
  const noConditionValue = data.filter((x) => x.preexistingCondition && x.preexistingCondition.length == 0).length;
  const diseasesValues = [...labels.map((x) => allConditionsDuplicated.filter((y) => y == x).length)];

  const intermediateValue = unknownValue + noConditionValue + diseasesValues.reduce((a, b) => a + b);

  const othersValue = allConditionsDuplicated.length - intermediateValue;

  const values = [othersValue, ...diseasesValues, noConditionValue, unknownValue];

  otherCountryChart = new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels: ['Alte afecțiuni', ...labels, 'Fără boli preexistente', 'Necunoscut'].map((x, i) => x[0].toUpperCase() + x.substr(1) + ': ' + values[i]),
      datasets: [
        {
          label: 'Morți pe baza afectiunilor preexistente',
          data: values,
          backgroundColor: ['#E91E63', '#F44336', '#ff5722', '#ff9800', '#ffc107', '#ffeb3b', '#2196f3', undefined],
        },
      ],
    },
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              stepSize: 10,
              display: false,
            },
            gridLines: {
              display: false,
              // color: 'rgba(0, 0, 0, 0)',
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              beginAtZero: true,
              display: false,
              max: othersValue,
            },
            gridLines: {
              display: false,
              color: 'rgba(0, 0, 0, 0)',
              stepSize: 10,
            },
          },
        ],
      },
      tooltips: {
        enabled: false,
      },
      legend: {
        display: false,
      },
      maintainAspectRatio: false,
      layout: {
        padding: {
          right: 170,
          left: 3,
        },
      },
      plugins: {
        labels: {
          render: ({ label, value }) => {
            return ' '.repeat(8 + label.length * (isPortraitMobile ? 1.6 : 1.4)) + label;
          },
          precision: 0,
          showZero: true,
          fontSize: 14,
          fontColor: '#000',
          fontStyle: 'normal',
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          arc: false,
          // position: 'outside',
          overlap: true,
          showActualPercentages: true,
          outsidePadding: 4,
          textMargin: 15,
        },
      },
    },
  });
}

function drawRomaniaSexBar() {
  const ctx = document.querySelector('#sexBar canvas').getContext('2d');
  const data = window.romaniaDeaths;

  let labels = [''];
  const valueMen = data.filter((x) => !x.gender).length;
  const valueWomen = data.filter((x) => x.gender).length;

  const total = valueMen + valueWomen;

  new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels: labels,
      datasets: [
        {
          label: `Bărbați`,
          data: [valueMen],
          backgroundColor: ['#2196f3'],
        },
        {
          label: `Femei`,
          data: [valueWomen],
          backgroundColor: ['#E91E63'],
        },
      ],
    },
    options: {
      plugins: {
        labels: {
          render: ({ value }) => {
            return `${((100 / total) * value).toFixed(1)}% (${value})                        `;
          },
          precision: 0,
          showZero: true,
          fontSize: 14,
          fontColor: '#fff',
          fontStyle: 'normal',
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          arc: false,
          overlap: true,
          showActualPercentages: true,
        },
      },
      scales: {
        xAxes: [
          {
            display: false,
            stacked: true,
            ticks: {
              display: false,
              max: valueMen + valueWomen,
            },
            gridLines: {
              display: false,
            },
          },
        ],
        yAxes: [
          {
            display: false,
            stacked: true,
            gridLines: {
              display: false,
            },
            ticks: {
              display: false,
            },
          },
        ],
      },
      maintainAspectRatio: false,
      layout: {
        padding: {
          bottom: 58,
        },
      },
    },
  });
}

function drawCountryDailyBars(chartId, countryName, color = '#ff9800') {
  const ctx = document.getElementById(chartId).getContext('2d');
  const data = window.data;

  let countryData = data
    .filter((x) => x.countryName == countryName)
    .sort((a, b) => +moment(b.dateString, 'DD/MM/YYYY') - +moment(a.dateString, 'DD/MM/YYYY'))
    .reverse();

  countryData = countryData.slice(isPortraitMobile ? countryData.length - 10 : Math.max(115 - maxElementsInWidth, 60));

  const labels = countryData.map((x) => moment(x.dateString, 'DD/MM/YYYY').format(defaultDateFormat));
  const values = countryData.map((x) => x.cases);
  const deaths = countryData.map((x) => +x.deaths);
  const recoveries = countryData.map((x) => +x.recoveries);

  otherCountryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Infectări',
          data: values,
          backgroundColor: color + '33',
          borderColor: color,
          borderWidth: 1,
        },
        {
          label: 'Vindecări',
          data: recoveries,
          backgroundColor: '#4CAF5044',
          borderColor: '#4CAF50',
          borderWidth: 1,
        },
        {
          label: 'Morți',
          data: deaths,
          backgroundColor: '#E91E6344',
          borderColor: '#E91E63',
          borderWidth: 1,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              callback: formatThousandsAsK,
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
      layout: {
        padding: {
          right: 10,
        },
      },
    },
  });
}

function drawAllTimeTotalsBars() {
  const ctx = document.getElementById('totalsChart').getContext('2d');
  const data = window.data;

  const totals = {};

  const allCountries = [...new Set(data.map((x) => x.countryName))];

  allCountries.forEach((countryName) => {
    totals[countryName] = data
      .filter((y) => y.countryName == countryName)
      .map((x) => x.cases)
      .reduce((a, b) => +a + +b);
  });

  const countriesWithTotals = Object.keys(totals).map((key) => ({ countryName: key, total: totals[key] }));

  const sortedByTotalCases = countriesWithTotals.sort((a, b) => b.total - a.total).slice(0, 10);

  const labels = [...new Set(sortedByTotalCases.map((x) => x.countryName))];
  const values = sortedByTotalCases.map((x) => x.total);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cazuri totale',
          data: values,
          backgroundColor: '#E91E6322',
          borderColor: '#E91E63',
          borderWidth: 1,
        },
      ],
    },
    options: {
      animation: {
        duration: 0,
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              callback: formatThousandsAsK,
            },
          },
        ],
      },
    },
  });
}

function drawCountryActiveCases(countryName) {
  const ctx = document.getElementById('countryActiveCases').getContext('2d');
  const data = window.data;

  const labels = dayStringsSinceStartOfYear;
  const localizedLabels = labels.map((x) => moment(x, 'DD/MM/YYYY').format(defaultDateFormat));

  const firstCountryInfections = labels.map((x) =>
    data
      .filter((y) => y.dateString == x && y.countryName == countryName)
      .map((x) => x.cases)
      .reduce((a, b) => +a + +b, 0)
  );
  const summedFirstCountryInfections = firstCountryInfections.map((x, i, a) => {
    const totalSoFar = firstCountryInfections.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });
  const firstCountryrecoveries = labels.map((x) =>
    data
      .filter((y) => y.dateString == x && y.countryName == countryName)
      .map((x) => x.recoveries)
      .reduce((a, b) => +a + +b, 0)
  );
  const summedFirstCountryrecoveries = firstCountryrecoveries.map((x, i, a) => {
    const totalSoFar = firstCountryrecoveries.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });
  const firstCountrydeaths = labels.map((x) =>
    data
      .filter((y) => y.dateString == x && y.countryName == countryName)
      .map((x) => x.deaths)
      .reduce((a, b) => +a + +b, 0)
  );
  const summedFirstCountrydeaths = firstCountrydeaths.map((x, i, a) => {
    const totalSoFar = firstCountrydeaths.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const values = summedFirstCountryInfections.map((x, i) => x - (summedFirstCountryrecoveries[i] + summedFirstCountrydeaths[i]));

  const filterFunction = (x, i, a) => {
    if (i < (countryName == 'China' ? 30 : 50)) {
      return false;
    }

    const distanceFromPresent = a.length - i;

    const volumeToShow = isPortraitMobile ? 6 : 16;

    const rarifyingFactor = Math.floor(distanceFromPresent / volumeToShow) + 1;

    return i % rarifyingFactor == 0;
  };

  countryActiveCases = new Chart(ctx, {
    type: 'line',
    data: {
      labels: localizedLabels.filter(filterFunction),
      datasets: [
        {
          label: 'Cazuri active - ' + countryName,
          data: values.filter(filterFunction),
          backgroundColor: '#5b9bd522',
          borderColor: '#5b9bd5',
          borderWidth: 2,
        },
      ],
    },
    options: {
      animation: {
        duration: 0,
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: '#000',
              beginAtZero: true,
              callback: formatThousandsAsK,
            },
          },
        ],
      },
      layout: {
        padding: {
          left: 0,
          right: 15,
          top: 0,
          bottom: 0,
        },
      },
    },
  });
}

function drawGlobalActiveCases() {
  const ctx = document.getElementById('globalActiveCases').getContext('2d');
  const data = window.data;

  const labels = dayStringsSinceStartOfYear;
  const localizedLabels = labels.map((x) => moment(x, 'DD/MM/YYYY').format(defaultDateFormat));

  const topCountries = ['China', 'USA', 'Italy', 'Spain'];

  const datasets = [];
  topCountries.forEach((countryName) => {
    const thisCountryData = data.filter((y) => y.countryName == countryName);

    const activeCases = labels.map((x) => {
      const { cases = 0, recoveries = 0, deaths = 0 } = thisCountryData.find((y) => y.dateString == x) || {};

      return +cases - (+recoveries + +deaths);
    });

    const summedActiveCases = activeCases.map((x, i, a) => {
      const totalSoFar = a.slice(0, i).reduce((a, b) => a + b, 0);
      return totalSoFar + x;
    });

    datasets.push(summedActiveCases);
  });

  const filterFunction = (_, i, a) => {
    const itemsToSkip = isPortraitMobile ? 40 : 30;
    if (i < itemsToSkip) {
      return false;
    }

    return i % (isPortraitMobile ? 4 : 2) == 0 || i == a.length - 1;
  };

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: localizedLabels.filter(filterFunction),
      datasets: [
        {
          label: topCountries[0],
          data: datasets[0].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#5b9bd5',
          borderWidth: 3,
        },
        {
          label: topCountries[1],
          data: datasets[1].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#ffc001',
          borderWidth: 3,
        },
        {
          label: topCountries[2],
          data: datasets[2].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#ed7d31',
          borderWidth: 3,
        },
        {
          label: topCountries[3],
          data: datasets[3].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#9C27B0',
          borderWidth: 3,
        },
      ],
    },
    options: {
      animation: {
        duration: 0,
      },
      elements: {
        point: {
          radius: 0,
        },
      },
      minPercentageForLabel: isPortraitMobile ? 5 : 3,
      skipLabelFactor: isPortraitMobile ? 5 : 2,
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: '#000',
              beginAtZero: true,
              callback: formatThousandsAsK,
            },
          },
        ],
      },
      layout: {
        padding: {
          left: 0,
          right: 15,
          top: 0,
          bottom: 0,
        },
      },
    },
  });
}

function drawLastWeekTotalsBars() {
  const ctx = document.getElementById('lastWeekTotals').getContext('2d');
  const data = window.data.filter((x) => +new Date() - +new Date(x.dateString) < 7 * 24 * 60 * 60 * 1000);

  const totals = {};

  const allCountries = [...new Set(data.map((x) => x.countryName))];

  allCountries.forEach((countryName) => {
    totals[countryName] = data
      .filter((y) => y.countryName == countryName)
      .map((x) => x.cases)
      .reduce((a, b) => +a + +b);
  });

  const countriesWithTotals = Object.keys(totals).map((key) => ({ countryName: key, total: totals[key] }));

  const sortedByTotalCases = countriesWithTotals.sort((a, b) => b.total - a.total).slice(0, 10);

  const labels = [...new Set(sortedByTotalCases.map((x) => x.countryName))];
  const values = sortedByTotalCases.map((x) => x.total);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cazuri confirmate in ultimele 7 zile',
          data: values,
          backgroundColor: '#9c27b022',
          borderColor: '#9c27b0',
          borderWidth: 1,
        },
      ],
    },
    options: {
      animation: {
        duration: 0,
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              callback: formatThousandsAsK,
            },
          },
        ],
      },
    },
  });
}

function drawCountryEvolutionLine(chartId, countryName, color = '#ff9800') {
  const ctx = document.getElementById(chartId).getContext('2d');
  const data = window.data;

  const localizedLabels = dayStringsSinceStartOfYear.map((x) => moment(x, 'DD/MM/YYYY').format(defaultDateFormat));
  const values = dayStringsSinceStartOfYear.map((x) =>
    data
      .filter((y) => y.dateString == x && y.countryName == countryName)
      .map((x) => x.cases)
      .reduce((a, b) => +a + +b, 0)
  );

  const deaths = dayStringsSinceStartOfYear.map((x) =>
    data
      .filter((y) => y.dateString == x && y.countryName == countryName)
      .map((x) => x.deaths)
      .reduce((a, b) => +a + +b, 0)
  );
  const recoveries = dayStringsSinceStartOfYear.map((x) =>
    data
      .filter((y) => y.dateString == x && y.countryName == countryName)
      .map((x) => x.recoveries)
      .reduce((a, b) => +a + +b, 0)
  );

  const summedDailyValues = values.map((x, i, a) => {
    const totalSoFar = values.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailyDeaths = deaths.map((x, i, a) => {
    const totalSoFar = deaths.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  if (countryName == 'Romania') {
    document.querySelectorAll('.total-deaths-value').forEach((x) => (x.innerText = summedDailyDeaths[summedDailyDeaths.length - 1]));
  }

  const summedDailyRecoveries = recoveries.map((x, i, a) => {
    const totalSoFar = recoveries.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const filterFunction = (x, i, a) => {
    if (i < (isPortraitMobile ? 70 : 50)) {
      return false;
    }

    const distanceFromPresent = a.length - i;

    const volumeToShow = isPortraitMobile ? 7 : 16;

    const rarifyingFactor = Math.floor(distanceFromPresent / volumeToShow) + 1;

    return i % rarifyingFactor == 0;
  };

  if (countryName == 'Romania') {
    document.querySelector('.total-cases-value').innerText = summedDailyValues[summedDailyValues.length - 1].toLocaleString();
  }

  otherCountryChartTotals = new Chart(ctx, {
    type: 'line',
    data: {
      labels: localizedLabels.filter(filterFunction),
      datasets: [
        {
          label: 'Morți - ' + countryName,
          data: summedDailyDeaths.filter(filterFunction),
          backgroundColor: '#E91E6333',
          borderColor: '#E91E63',
          borderWidth: 1,
        },
        {
          label: 'Vindecări - ' + countryName,
          data: summedDailyRecoveries.filter(filterFunction),
          backgroundColor: '#4CAF5033',
          borderColor: '#4CAF50',
          borderWidth: 1,
        },
        {
          label: 'Infectări - ' + countryName,
          data: summedDailyValues.filter(filterFunction),
          backgroundColor: color + '22',
          borderColor: color,
          borderWidth: 1,
        },
      ],
    },
    options: {
      animation: {
        duration: 0,
      },
      minPercentageForLabel: isPortraitMobile ? 5 : 0,
      skipLabelFactor: isPortraitMobile || isLandscapeMobile ? 2 : 0,
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: '#000',
              beginAtZero: true,
              callback: formatThousandsAsK,
            },
          },
        ],
      },
      layout: {
        padding: {
          right: 15,
        },
      },
    },
  });
}

function drawGlobalEvolutionLine() {
  const ctx = document.getElementById('globalTotals').getContext('2d');
  const data = window.data;

  const labels = dayStringsSinceStartOfYear;
  const localizedLabels = labels.map((x) => moment(x, 'DD/MM/YYYY').format(defaultDateFormat));
  const values = labels.map((x) =>
    data
      .filter((y) => y.dateString == x)
      .map((x) => x.cases)
      .reduce((a, b) => +a + +b, 0)
  );
  const deaths = labels.map((x) =>
    data
      .filter((y) => y.dateString == x)
      .map((x) => x.deaths)
      .reduce((a, b) => +a + +b, 0)
  );
  const recoveries = labels.map((x) =>
    data
      .filter((y) => y.dateString == x)
      .map((x) => x.recoveries)
      .reduce((a, b) => +a + +b, 0)
  );

  const summedDailyValues = values.map((x, i, a) => {
    const totalSoFar = values.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailydeaths = deaths.map((x, i, a) => {
    const totalSoFar = deaths.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailyrecoveries = recoveries.map((x, i, a) => {
    const totalSoFar = recoveries.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const filterFunction = (_, i, a) => {
    const distanceFromPresent = a.length - i;

    const volumeToShow = isPortraitMobile ? 6 : 16;

    const rarifyingFactor = Math.floor(distanceFromPresent / volumeToShow) + 1;

    return i % rarifyingFactor == 0;
  };

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: localizedLabels.filter(filterFunction),
      datasets: [
        {
          label: 'Infectări - toata lumea',
          data: summedDailyValues.filter(filterFunction),
          backgroundColor: '#ff980022',
          borderColor: '#ff9800',
          borderWidth: 1,
        },
        {
          label: 'Vindecări - toata lumea',
          data: summedDailyrecoveries.filter(filterFunction),
          backgroundColor: '#4CAF5022',
          borderColor: '#4CAF50',
          borderWidth: 1,
        },
        {
          label: 'Morți - toata lumea',
          data: summedDailydeaths.filter(filterFunction),
          backgroundColor: '#E91E6322',
          borderColor: '#E91E63',
          borderWidth: 1,
        },
      ],
    },
    options: {
      animation: {
        duration: 0,
      },
      minPercentageForLabel: isPortraitMobile ? 5 : 2,
      skipLabelFactor: isPortraitMobile ? 3 : 2,
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: '#000',
              beginAtZero: true,
              callback: formatThousandsAsK,
            },
          },
        ],
      },
      layout: {
        padding: {
          left: 0,
          right: 15,
          top: 0,
          bottom: 0,
        },
      },
    },
  });
}

function maybeAddEntryForRomaniaToday() {
  const romaniaEntries = window.data.filter((x) => x['countryName'] == 'Romania');
  const todayString = moment().format('DD/MM/YYYY');
  const maybeMissingDays = [todayString, '05/03/2020', '03/03/2020'];

  maybeMissingDays.forEach((maybeMissingDay) => {
    if (!romaniaEntries.find((x) => x.dateString == maybeMissingDay)) {
      const currentHour = moment().format('HH');
      if (+currentHour > 12 || maybeMissingDay !== todayString) {
        window.data = [...window.data, { countryName: 'Romania', dateString: maybeMissingDay, deaths: 0, recoveries: 0, cases: 0 }];
      }
    }
  });
}

const recoveriesCountriesMap = {
  'Korea, South': 'southkorea',
  US: 'USA',
};

const recoveries = {};

async function populateRecoveriesObject() {
  await getRecoveriesDataPromise;

  const allCountries = [...new Set(window.recoveredData.map((x) => x['Country/Region']).filter((x) => x))];
  const allDates = Object.keys(window.recoveredData[0]).filter((x) => x.includes('/20'));

  allDates.forEach((date, i) => {
    const casesForAllCountriesForCurrentDate = {};
    allCountries.forEach((recoveredCountryName) => {
      casesForAllCountriesForCurrentDate[
        (recoveriesCountriesMap[recoveredCountryName] || recoveredCountryName.replace(/[\s\_]/g, '')).toLowerCase()
      ] = window.recoveredData
        .filter((x) => x['Country/Region'] == recoveredCountryName)
        .map((x) => x[date])
        .reduce((a, b) => +a + +b, 0);
    });

    recoveries[date] = casesForAllCountriesForCurrentDate;
  });
}

function getRecoveriesForToday(countryName, dateString) {
  const yesterdaysKey = moment(dateString, 'DD/MM/YYYY').subtract(1, 'day').format('M/D/YY');
  const todaysKey = moment(dateString, 'DD/MM/YYYY').format('M/D/YY');

  const todaysRecoveries = (recoveries[todaysKey] || {})[countryName] || 0;
  const yesterdaysRecoveries = (recoveries[yesterdaysKey] || {})[countryName] || 0;

  return todaysRecoveries ? todaysRecoveries - yesterdaysRecoveries : 0;
}

async function getRecoveriesData() {
  const recoveriesCsvUrl =
    'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv';
  const recoveriesCsv = await (await fetch(recoveriesCsvUrl)).text();
  window.recoveredData = csvToArray(recoveriesCsv);
}

const getRecoveriesDataPromise = getRecoveriesData();

async function processData() {
  await populateRecoveriesObject();

  window.data = window.data.map((x) => {
    const { countryName } = x;

    x.recoveries = getRecoveriesForToday(countryName.replace(/[\s\_]/g, '').toLowerCase(), x.dateString);

    if (countryName == 'Romania') {
      const { cases = 0, recoveries = 0, deaths = 0 } = window.romaniaData[x.dateString] || {};
      x.cases = cases;
      x.recoveries = recoveries;
      x.deaths = deaths;
    }
    if (countryName == 'Italy') {
      if (x.dateString == '03/16/2020') {
        x.cases = '3230';
      }
      if (x.dateString == '03/15/2020') {
        x.cases = '3090';
      }
    }
    return {
      ...x,
      countryName,
    };
  });
}

function drawComparedCountry(picker) {
  otherCountryChart.destroy();

  drawCountryDailyBars('otherCountryChart', picker.value, '#ffeb3b');
  ga('send', 'event', 'ChooseCountryDailyBars', picker.value);
}

function drawComparedCountryTotalCases(picker) {
  otherCountryChartTotals.destroy();
  drawCountryEvolutionLine('otherCountryTotals', picker.value, '#ffeb3b');
  ga('send', 'event', 'ChooseCountryCountryEvolution', picker.value);
}

function drawComparedActiveCases(picker) {
  countryActiveCases.destroy();
  drawCountryActiveCases(picker.value);
  ga('send', 'event', 'ChooseCountryCountryActiveCases', picker.value);
}

function setPickerCountries(data) {
  const pickers = document.querySelectorAll('.country-picker');

  const countries = [...new Set(data.map((x) => x.countryName))];

  pickers.forEach((picker) => {
    countries.forEach((countryName) => {
      const option = document.createElement('option');
      option.innerText = countryName;
      picker.appendChild(option);
    });
    picker.value = picker.id == 'activeCasesCountryPicker' ? 'Romania' : 'Italy';
  });
}

function setupBarLabels() {
  Chart.pluginService.register({
    afterDraw: function (chartInstance) {
      var ctx = chartInstance.chart.ctx;

      if (!['line', 'bar'].includes(chartInstance.config.type)) {
        return;
      }

      ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, 'normal', Chart.defaults.global.defaultFontFamily);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#555';

      const { minPercentageForLabel = 0, skipLabelFactor = 0, labelsToIgnore = [] } = chartInstance.options;

      chartInstance.data.datasets.forEach((dataset, j) => {
        for (var i = 0; i < dataset.data.length; i++) {
          var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
          const currentValue = dataset.data[i];
          // let formattedValue = currentValue > 9999 ? Math.floor(dataset.data[i] / 1000) + 'k' : dataset.data[i] + '';

          let thousands = currentValue / 1000;
          let letter = 'k';
          if (thousands > 999) {
            letter = 'M';
            thousands = thousands / 1000;
          }

          const endsWithZero = thousands.toFixed(1).endsWith('.0');
          const thousandsWithoutZero = thousands.toFixed(endsWithZero || thousands > 99 ? 0 : 1);

          const formattedValue = currentValue > (isPortraitMobile ? 7000 : 9999) ? thousandsWithoutZero + letter : currentValue;

          let shouldShowLabel = skipLabelFactor ? i != 0 && ((i + j) % skipLabelFactor == 0 || i == dataset.data.length - 1) : true;

          if (
            currentValue > minPercentageForLabel * (dataset.data[dataset.data.length - 1] / 100) &&
            !labelsToIgnore.includes(formattedValue) &&
            shouldShowLabel
          ) {
            ctx.fillText(formattedValue, model.x, model.y - 2);
          }
        }
      });
    },
  });
}

function show(graphId, button, noTrack) {
  document.querySelectorAll('button').forEach((x) => {
    x.removeAttribute('selected');
  });
  document.querySelectorAll('.graph-wrapper').forEach((x) => {
    x.removeAttribute('visible');
  });

  button.toggleAttribute('selected');

  const wrapper = document.getElementById(graphId);
  wrapper.toggleAttribute('visible');

  if (!noTrack) {
    ga('send', 'event', 'ChooseGraph', graphId);
  }
}

let dayStringsSinceStartOfYear = [];

function populateLabelsSinceStartOfYear() {
  dayStringsSinceStartOfYear = [
    ...new Set(window.data.filter((x) => x['countryName'] == 'China' || x['countryName'] == 'Romania').map((x) => x.dateString)),
  ].sort((a, b) => moment(a, 'DD/MM/YYYY') - moment(b, 'DD/MM/YYYY'));
}

setCurrentDate();
draw();

let hasReachedHalf = false;
let hasReachedBottom = false;

window.onscroll = function () {
  setTimeout(() => {
    const pageHalf = document.body.offsetHeight / 2;
    const pageBottom = document.body.offsetHeight - 100;
    const currentScrollPos = window.innerHeight + window.scrollY;
    if (currentScrollPos >= pageBottom) {
      if (!hasReachedBottom) {
        ga('send', 'event', 'Scroll', 'toHalf');
        hasReachedBottom = true;
      }
    }
    if (currentScrollPos >= pageHalf) {
      if (!hasReachedHalf) {
        ga('send', 'event', 'Scroll', 'toBottom');
        hasReachedHalf = true;
      }
    }
  }, 0);
};

function csvToArray(csv) {
  var lines = csv.split('\n');
  var result = [];
  var headers = lines[0].split(',');

  for (var i = 1; i < lines.length; i++) {
    var obj = {};

    var row = lines[i],
      queryIdx = 0,
      startValueIdx = 0,
      idx = 0;

    if (row.trim() === '') {
      continue;
    }

    while (idx < row.length) {
      /* if we meet a double quote we skip until the next one */
      var c = row[idx];

      if (c === '"') {
        do {
          c = row[++idx];
        } while (c !== '"' && idx < row.length - 1);
      }

      if (c === ',' || /* handle end of line with no comma */ idx === row.length - 1) {
        /* we've got a value */
        var value = row.substr(startValueIdx, idx - startValueIdx + 1).trim();

        /* skip first double quote */
        if (value[0] === '"') {
          value = value.substr(1);
        }
        /* skip last comma */
        if (value[value.length - 1] === ',') {
          value = value.substr(0, value.length - 1);
        }
        /* skip last double quote */
        if (value[value.length - 1] === '"') {
          value = value.substr(0, value.length - 1);
        }

        var key = headers[queryIdx++];
        obj[key] = value;
        startValueIdx = idx + 1;
      }

      ++idx;
    }

    result.push(obj);
  }

  return result;
}
