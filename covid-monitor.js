const fs = require('fs');
const moment = require('moment');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const timestamp = '[' + moment().format('DD/MM/YYYY HH:mm:ss') + '] ';

const tenMinutes = 10 * 60 * 1000;
let shortRunInterval = 0;

longRun();
setInterval(longRun, tenMinutes);

function longRun() {
  if (hasDoneUpdateForToday()) {
    console.log(timestamp + 'Update for today done. Nothing to check.');
  } else {
    const isPastTwelve = +moment().format('HH') >= 11;
    console.log(timestamp + 'isPastTwelve', isPastTwelve);

    if (isPastTwelve) {
      const oneMinute = 60 * 1000;

      shortRun();
      shortRunInterval = setInterval(shortRun, oneMinute);
    }
  }
}

async function shortRun() {
  const { stdout } = await execAsync('node update');
  console.log(timestamp + 'node update: ', stdout);

  if (hasDoneUpdateForToday()) {
    console.log(timestamp + 'Update done! Committing..');

    await execAsync('git add .');
    await execAsync('git commit -m "ro 1pm"');
    await execAsync('git push');

    clearTimeout(shortRunInterval);

    console.log(timestamp + 'Commited & pushed succesfully! Going back to standby mode...');
  }
}

function hasDoneUpdateForToday() {
  let romaniaDailyCasesString = fs.readFileSync('./data/romania.js', 'utf8');

  const romaniaDailyCases = JSON.parse(romaniaDailyCasesString.replace('window.romaniaData = ', ''));

  const todayKey = moment().format('DD/MM/YYYY');

  if (romaniaDailyCases[todayKey]) {
    return true;
  }
}
