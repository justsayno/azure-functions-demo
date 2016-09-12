require('shelljs/global');
const fs = require('fs');
const path = require('path');

const installPackagesInDirectory = (directoryPath) => {
    if(`./${directoryPath}`)
}

getDirectories = (directoryPath) => {
  return fs.readdirSync(directoryPath).filter(function(file) {
    return fs.statSync(path.join(directoryPath, file)).isDirectory();
  });
}


if (!which('npm')) {
  echo('Sorry, this script requires npm');
  exit(1);
}

const directories = getDirectories("./")

directories.map((directory) => {
    console.log(directory)
})


cd('./rss-scanner');
exec('npm install')