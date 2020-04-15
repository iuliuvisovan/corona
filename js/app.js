moment.locale('ro');
const isMobile = window.innerWidth < 768;
const defaultDateFormat = isMobile ? 'DD.MM' : 'DD MMMM';
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

function draw() {
  drawRomaniaSexCasesPie();
  drawRomaniaCountyCasesPie();

  setTimeout(
    () => {
      drawRomaniaConditionPie();
      drawRomaniaAgeCasesPie();
    },
    isMobile ? 500 : 0
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
    isMobile ? 1200 : 1000
  );
}

function setCurrentDate() {
  const currentDateSpan = document.getElementById('lastUpdated');
  currentDateSpan.innerText = moment().format('DD.MM.YYYY');
}

var otherCountryChart = undefined;
var otherCountryChartTotals = undefined;
var countryActiveCases = undefined;

function drawRomaniaCountyCasesPie() {
  const ctx = document.getElementById('romaniaCountyDeaths').getContext('2d');
  const data = window.romaniaDeaths;

  let labels = [...new Set(data.map((x) => x.county))]
    .sort((a, b) => data.filter((y) => y.county == b).length - data.filter((y) => y.county == a).length)
    .slice(0, 15);

  const othersValue = data.filter((x) => !labels.includes(x.county)).length;
  const values = [...labels.map((x) => data.filter((y) => y.county == x).length), othersValue];

  document.querySelectorAll('.total-deaths').forEach((x) => (x.innerText = data.length));

  otherCountryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [...labels, 'Restul județelor'].map((x) => x[0].toUpperCase() + x.substr(1)),
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
          left: 70,
        },
      },
      plugins: {
        labels: {
          render: ({ label, value }) => {
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
      min: 60,
      max: 100,
      label: '60+ ani',
    },
    {
      min: 20,
      max: 40,
      label: '20-40 ani',
    },
    {
      min: 40,
      max: 60,
      label: '40-60 ani',
    },
  ];

  let labels = intervals.map((x) => x.label || x.min + ' - ' + x.max);
  const values = intervals.map((x) => data.filter((y) => y.age > x.min && y.age <= x.max).length);

  otherCountryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map((x, i) => `${x}\n${values[i]} (${((values[i] / data.length) * 100).toFixed(0)}%)`),
      datasets: [
        {
          label: 'Morți pe grupe de varsta',
          data: values,
          backgroundColor: ['#ff5722', '#009688bb', '#4caf50bb', '#ff9800'],
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      tooltips: {
        enabled: false,
      },
      legend: {
        display: false,
      },
      plugins: {
        labels: {
          render: ({ label }) => {
            return label;
          },
          precision: 0,
          showZero: true,
          fontSize: 14,
          fontColor: '#fff',
          fontStyle: 'normal',
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          textShadow: true,
          shadowBlur: 1,
          shadowOffsetX: 1,
          shadowOffsetY: 1,
          shadowColor: '#000',
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

function drawRomaniaConditionPie() {
  const ctx = document.getElementById('romaniaConditionDeaths').getContext('2d');
  const data = window.romaniaDeaths;

  const allConditionsDuplicated = data
    .map((x) => x.preexistingCondition)
    .flat()
    .map((x) => ((x || {}).length > 12 ? x.split(' ').join('\n') : x));

  let labels = [...new Set(allConditionsDuplicated)]
    .sort((a, b) => (a.startsWith('Boli') ? 1 : -1))
    .sort((a, b) => allConditionsDuplicated.filter((y) => y == b).length - allConditionsDuplicated.filter((y) => y == a).length)
    .slice(0, 5)
    .sort((a, b) => b - a);

  const othersValue = data.filter((x) => {
    let hasOneOfTopDiseases = false;
    (x.preexistingCondition || []).forEach((disease) => {
      if (labels.includes(disease)) {
        hasOneOfTopDiseases = true;
      }
    });
    return hasOneOfTopDiseases;
  }).length;

  const unknownValue = data.filter((x) => !x.preexistingCondition).length;
  const noConditionValue = data.filter((x) => x.preexistingCondition && x.preexistingCondition.length == 0).length;
  const values = [othersValue, ...labels.map((x) => allConditionsDuplicated.filter((y) => y == x).length), noConditionValue, unknownValue];

  otherCountryChart = new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels: ['Alte afecțiuni', ...labels, 'Fără boli \npreexistente', 'Necunoscut'].map((x, i) => x[0].toUpperCase() + x.substr(1) + ':\n ' + values[i]),
      datasets: [
        {
          label: 'Morți pe baza afectiunilor preexistente',
          data: values,
          backgroundColor: ['#ffeb3b', '#E91E63', '#F44336', '#ff5722', '#ff9800', '#ffc107', '#4caf50', undefined],
        },
      ],
    },
    options: {
      tooltips: {
        enabled: false,
      },
      legend: {
        display: false,
      },
      maintainAspectRatio: false,
      layout: {
        padding: {
          right: 50,
          left: 60,
        },
      },
      plugins: {
        labels: {
          render: ({ label, value, percentage }) => {
            if (label.startsWith('Fara')) {
              return 'Fără boli \npreexistente: ' + value + '\n\n';
            }
            if (label.startsWith('Hiper') || label.startsWith('Boli card')) {
              return '\n\n' + label;
            }
            if (label.startsWith('Fibril')) {
              return label;
            }

            return `\n ${label}`;
          },
          precision: 0,
          showZero: true,
          fontSize: 12,
          fontColor: '#333',
          fontStyle: 'normal',
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          textShadow: true,
          shadowBlur: 5,
          shadowOffsetX: -2,
          shadowOffsetY: -2,
          shadowColor: '#fff',
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
          outsidePadding: 60,
          textMargin: 2,
        },
      },
    },
  });
}

function drawRomaniaSexCasesPie() {
  const ctx = document.getElementById('romaniaSexDeaths').getContext('2d');
  const data = window.romaniaDeaths;

  let labels = ['Bărbați', 'Femei'];
  const values = [data.filter((x) => !x.gender).length, data.filter((x) => x.gender).length];

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Morți pe sex',
          data: values,
          backgroundColor: ['#2196f3', '#F06292'],
        },
      ],
    },
    options: {
      legend: {
        display: false,
      },
      maintainAspectRatio: false,
      plugins: {
        labels: {
          render: ({ value, percentage, label }) => {
            return `${label}: ${value} (${percentage}%)`;
          },
          precision: 0,
          showZero: true,
          fontSize: 14,
          fontColor: '#fff',
          fontStyle: 'normal',
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          textShadow: true,
          shadowBlur: 10,
          shadowOffsetX: -5,
          shadowOffsetY: 5,
          shadowColor: '#0000',
          arc: false,
          // position: 'outside',
          overlap: true,
          showActualPercentages: true,
          outsidePadding: 50,
          textMargin: 25,
        },
      },
    },
  });
}

function drawCountryDailyBars(chartId, countryName, color = '#ff9800') {
  const ctx = document.getElementById(chartId).getContext('2d');
  const data = window.data;

  const countryData = data
    .filter((x) => x.countryName == countryName)
    .sort((a, b) => +moment(b.dateString, 'DD/MM/YYYY') - +moment(a.dateString, 'DD/MM/YYYY'))
    .slice(0, isMobile ? 10 : 20)
    .reverse();

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

    const volumeToShow = isMobile ? 6 : 16;

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
    const itemsToSkip = isMobile ? 40 : 30;
    if (i < itemsToSkip) {
      return false;
    }

    return i % (isMobile ? 4 : 2) == 0 || i == a.length - 1;
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
      minPercentageForLabel: 5,
      skipLabelFactor: 5,
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

  const summedDailyRecoveries = recoveries.map((x, i, a) => {
    const totalSoFar = recoveries.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const filterFunction = (x, i, a) => {
    if (i < a.length - (isMobile ? 30 : 40)) {
      return false;
    }

    const distanceFromPresent = a.length - i;

    const volumeToShow = isMobile ? 7 : 16;

    const rarifyingFactor = Math.floor(distanceFromPresent / volumeToShow) + 1;

    return i % rarifyingFactor == 0;
  };

  if (countryName == 'Romania') {
    document.getElementById('totalCases').innerText = summedDailyValues[summedDailyValues.length - 1].toLocaleString();
    document.getElementById('totalDeaths').innerText = summedDailyDeaths[summedDailyDeaths.length - 2].toLocaleString();
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
      minPercentageForLabelPercentage: countryName !== 'Romania' ? 5 : 0,
      skipLabelFactor: countryName !== 'Romania' ? 2 : 0,
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
          right: 13,
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

    const volumeToShow = isMobile ? 6 : 16;

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
      minPercentageForLabel: 5,
      skipLabelFactor: 3,
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
      ctx.fillStyle = '#000';

      const { minPercentageForLabel = 0, skipLabelFactor = 0, labelsToIgnore = [] } = chartInstance.options;

      chartInstance.data.datasets.forEach((dataset, j) => {
        for (var i = 0; i < dataset.data.length; i++) {
          var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
          const currentValue = dataset.data[i];
          let formattedValue = currentValue > 9999 ? Math.floor(dataset.data[i] / 1000) + 'k' : dataset.data[i] + '';

          if (isMobile) {
            const thousands = (currentValue / 1000).toFixed(1);
            const endsWithZero = thousands.endsWith('.0');
            const thousandsWithoutZero = (dataset.data[i] / 1000).toFixed(endsWithZero ? 0 : 1);

            formattedValue = formattedValue > 999 ? thousandsWithoutZero + 'k' : formattedValue;
          }

          let shouldShowLabel = skipLabelFactor ? (i + j) % skipLabelFactor == 0 || i == dataset.data.length - 1 : true;

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
