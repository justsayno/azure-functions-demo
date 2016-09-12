require('shelljs/global');

if (!which('npm')) {
  echo('Sorry, this script requires npm')
  exit(1)
}

const fs = require('fs');
const path = require('path');
const scriptDirectory = __dirname

const installPackagesInDirectory = (directoryPath, scriptDirectory) => {
    if (fs.existsSync(`./${directoryPath}/package.json`)) { 
        cd(`./${directoryPath}`)
        exec('npm install')
        cd(scriptDirectory)
    }
}

getDirectories = (directoryPath) => {
  return fs.readdirSync(directoryPath).filter(function(file) {
    return fs.statSync(path.join(directoryPath, file)).isDirectory()
  });
}

const directories = getDirectories(scriptDirectory)

installPackagesInDirectory(scriptDirectory)

directories.map((directory) => {
    installPackagesInDirectory(directory, scriptDirectory)
})

