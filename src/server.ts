import {exec} from "shelljs";
const chalk = require('chalk');

export function linkPumaAddress(projectName: string) {
  let serverAddress = pumaAddress(projectName);
  const directory = `${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/${projectName}`;
  console.log(chalk.magenta(`LINKING ADDRESS: http://${serverAddress} TO ${directory}`));
  const result = exec(`puma-dev link -n ${serverAddress} ${directory}`, {silent: true});
  if(result.stderr) {
    console.log(chalk.red(result.stderr))
  }
 return result
}

export function pumaAddress(projectName: string) {
  switch(projectName) {
    case 'roundtrip-1':
      return 'roundtrip1';
    case 'roundtrip-2':
      return 'roundtrip2';
    default:
      return  projectName.replace(/^roundtrip-/, '').replace(/\-/g, '');
  }
}
