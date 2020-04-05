const fs = require('fs');

function cleanupActiveCasesFiles() {
  const activeCasesFolder = './data/active';
  const filesInFolder = fs.readdirSync(activeCasesFolder);

  filesInFolder.forEach(fileName => {
    const filePath = activeCasesFolder + '/' + fileName;
    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.startsWith('window.data')) {
      content = 'window.data = ' + content;
    }

    fs.writeFileSync(filePath, content);
  });
}

function cleanupRecoveredCasesFiles() {
  const activeCasesFolder = './data/recovered';
  const filesInFolder = fs.readdirSync(activeCasesFolder);

  filesInFolder.forEach(fileName => {
    const filePath = activeCasesFolder + '/' + fileName;
    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.startsWith('window.recoveredData')) {
      content = 'window.recoveredData = ' + content;
    }

    fs.writeFileSync(filePath, content);
  });
}

function referenceMostRecentActiveCasesFile() {
  const activeCasesFolder = './data/active';
  const filesInFolder = fs.readdirSync(activeCasesFolder);

  let largestFilePath = '';
  let largestFileSize = 0;

  filesInFolder.forEach(fileName => {
    const filePath = activeCasesFolder + '/' + fileName;
    let fileContent = fs.readFileSync(filePath, 'utf8');

    const fileSize = fileContent.length;

    if (fileSize > largestFileSize) {
      largestFileSize = fileSize;
      largestFilePath = filePath;
    }
  });

  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  indexHtml = indexHtml.replace(/data\/active\/[0-9]*[a-z]*\.js/, largestFilePath.substr(2));

  fs.writeFileSync(indexHtmlPath, indexHtml);
}

function referenceMostRecentRecoveredCasesFile() {
  const activeCasesFolder = './data/recovered';
  const filesInFolder = fs.readdirSync(activeCasesFolder);

  let largestFilePath = activeCasesFolder + '/' + filesInFolder[filesInFolder.length - 1];

  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  indexHtml = indexHtml.replace(/data\/recovered\/[0-9]*[a-z]*\.js/, largestFilePath.substr(2));

  fs.writeFileSync(indexHtmlPath, indexHtml);
}

function bumpRomaniaVersion() {
  const indexHtmlPath = './index.html';
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const myRegexp = /data\/romania\.js\?v=([0-9]*)/;
  const [_, version] = myRegexp.exec(indexHtml);

  const replacedIndexHtml = indexHtml.replace(myRegexp, 'data/romania.js?v=' + (+version + 1));

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

cleanupActiveCasesFiles();
// cleanupRecoveredCasesFiles();
referenceMostRecentActiveCasesFile();
// referenceMostRecentRecoveredCasesFile();
bumpRomaniaVersion();
bumpAppJsVersion();
