import {exec, exit, pwd} from "shelljs";
import {LoggerService} from "../services/logger.service";
import {FilesCli} from "./files.cli";
import {GitCli} from "./git.cli";

export class PumaCli {

  static link(repo: string, path = '', dryRun = false) {
    let serverAddress = PumaCli.address(repo);
    const directory = `${GitCli.repoPath(repo)}`;
    if(!dryRun) {
      const result = exec(`puma-dev link -n ${serverAddress} ${directory}`, {silent: true});
      if(result.stderr) {
        LoggerService.error(result.stderr);
        exit(1)
      }
    }
    LoggerService.success(`LINKED ADDRESS: https://${serverAddress}.dev TO ${directory}`);
  }

  static linkAllRepos() {
    const repos = FilesCli.localNotArchivedRepos().filter((repo) => {
      return GitCli.repoPath(repo).includes('product/rails')
    });
    const currentDirectory = pwd();
    repos.map((repo) => {
      PumaCli.link(repo);
    });
    exec(`cd ${currentDirectory}`);
  }

  static url(repo: string) {
    return `https://${PumaCli.address(repo)}.dev`
  }

  private static address(repo: string) {
    switch(repo) {
      case 'idme-idp':
        return 'api.idme';
      case 'idme-marketplace':
        return 'shop.idme';
      case 'idme-verification':
        return 'verify.idme';
      case 'account-api':
        return 'account-api.idme';
      default:
        return  repo.replace(/^idme-/, '').replace(/\-/g, '') + '.idme';
    }
  }
}
