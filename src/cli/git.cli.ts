import {exec, exit, pwd} from "shelljs";
import {OWNER} from "../constants/github.constant";
import {FilesCli} from "./files.cli";
import {LoggerService} from "../services/logger.service";
import {PumaCli} from "./puma.cli";
import {compact, difference, findWhere, pluck} from 'underscore';
import {ObjectService} from "../services/object.service";
import {GithubApi} from "../apis/github.api";
const chalk = require("chalk");

export class GitCli {
  token: string = process.env.GITHUB_TOKEN || '';
  username: string = process.env.GITHUB_USERNAME || process.env.GITHUB_ACTOR || '';
  cache: any = {};

  static async removeArchivedReposThatShouldNotBeArchived(dryRun = false) {
    const shouldBeArchived = await this.shouldBeArchived();
    const areArchived = await FilesCli.localArchivedRepos();
    const needToBeRemoved = difference(pluck(areArchived, 'name'), shouldBeArchived);
    needToBeRemoved.map((name: string) => {
      const removeable: any = findWhere(areArchived, {name: name});
      if(dryRun) {
        LoggerService.pink(`rm -rf ${removeable.path}`);
      } else {
        exec(`rm -rf ${removeable.path}`)
      }
    })
  }

  static async cloneMissingRepos(dryRun = false) {
    const some = await this.removeArchivedReposThatShouldNotBeArchived(dryRun);
    const missing: any = await FilesCli.missingLocalRepos();
    missing.map((repoName: string) => {
      const path = `${this.repoPath(repoName)}`;
      if(!dryRun) {
        GitCli.command(`clone git@github.com:${OWNER}/${repoName} ${path}`, true);
      }
      if (path.includes('archived')) {
        LoggerService.warn(`Cloned ${repoName} to ${path}`);
        LoggerService.grey(`You might want to add ${repoName} to the mac-cli/dist/repo_structure.json for better organization`);
      } else {
        LoggerService.success(`Cloned ${repoName} to ${path}`);
        if (process.env.LOCAL_GITHUB_REPO_STRUCTURE === 'clean' && path.includes('rails')) {
	//          PumaCli.link(repoName, path, dryRun);
        }
      }
    });
  }

  static checkout(branch: string) {
    const repos = FilesCli.localNotArchivedRepos().sort();

    repos.map((repo) => {
      GitCli.checkoutInRepo(repo, branch);
    });

  }

  static checkoutInRepo(repo: string, branch: string) {
    const currentBranch = GitCli.getBranch(repo);
    if (currentBranch === branch) {
      LoggerService.success(`${repo} is already on branch: ${branch}`);
      return;
    }
    GitCli.commandInRepo(repo, `fetch`);
    GitCli.commandInRepo(repo, `add .`);
    GitCli.commandInRepo(repo, `commit -m 'automated'`);
    if (currentBranch !== 'master') {
      LoggerService.pink(`Pushing changes to ${repo} on ${currentBranch} to github.com`);
      GitCli.commandInRepo(repo, `push origin ${currentBranch}`);
    }
    LoggerService.grey(`Pulling changes to master in ${repo}`);
    GitCli.commandInRepo(repo, `checkout master`);
    GitCli.commandInRepo(repo, `pull origin master`);
    const branches: any = GitCli.getBranches(repo);
    if (branches.includes(branch)) {
      LoggerService.info(`Checking out ${branch} in ${repo} from master`);
      GitCli.commandInRepo(repo, `checkout ${branch}`)
    } else {
      LoggerService.warn(`Checking out a new branch: ${branch} in ${repo} from master`);
      GitCli.commandInRepo(repo, `checkout -b ${branch}`)
    }
    LoggerService.grey(`Puling down updates from master in ${branch} ${repo}`);
    const response = GitCli.commandInRepo(repo, `pull origin ${branch}`)
    if (response.includes(`fatal: couldn't find remote ref`)) {
      LoggerService.warn(`Pushing ${branch} in ${repo} to github.com`);
      GitCli.commandInRepo(repo, `push origin ${branch}`)
    }

  }

  static branches() {
    const repos = FilesCli.localNotArchivedRepos().sort();

    repos.map((repo) => {
      const branch = GitCli.getBranch(repo) === 'master' ? chalk.green('master') : chalk.cyan(GitCli.getBranch(repo));
      LoggerService.pink(`${repo}: ${branch}`)
    });

  }

  static createBranch(branch: string) {
    const repos = FilesCli.localNotArchivedRepos().sort();
    repos.map((repo) => {
      console.log(repo)
      GitCli.commandInRepo(repo, `fetch`);
      GitCli.commandInRepo(repo, `add .`);
      GitCli.commandInRepo(repo, `commit -m 'automated'`);
      GitCli.commandInRepo(repo, `checkout master`);
      GitCli.commandInRepo(repo, `checkout -B ${branch}`)
    });
  }

  static async allPaths() {
    const names = await new GithubApi().repoNames(true);
    names.map((name: string) => {
      LoggerService.info({repo: name, path: this.repoPath(name)})
    })
  }

  static async shouldBeArchived() {
    const names = await new GithubApi().repoNames(true);
    return names.filter((name: string) => {
      return this.repoPath(name).includes('/archived/');
    })
  }

  static findPathBy(structure: any, key: 'startsWith' | 'endsWith' | 'includes', repoName: string ) {
    const options = compact(pluck(structure, key));
    const matches = options.filter((option: string) => repoName.toLowerCase()[key](option.toLowerCase()) );
    if (matches.length > 0) {
      const match: string =  matches[0];
      const obj: any = findWhere(structure, {[key]: match});
      return obj.path;
    } else {
      return null;
    }
  }

  static repoPath(repoName: string) {
    if (repoName === 'mac-cli') {
      return `${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/mac-cli`
    }
    if (process.env.LOCAL_GITHUB_REPO_STRUCTURE !== 'clean') {
      return `${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/${repoName}`;
    }
    return `${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/${repoName}`
  }

  static repoDirectoryStructure() {
    const structure = FilesCli.readConfigFile('repo_structure');
    const result = ObjectService.flatten(structure);
    //console.log(result);
    return result;
  }

  static async fetch() {
    await GitCli.cloneMissingRepos();
    const localRepos = FilesCli.localNotArchivedRepos().sort();
    LoggerService.info(`Starting fetch process.`);
    LoggerService.grey(`There are ${localRepos.length} repos to be fetched.`);
    const all = Promise.all(localRepos.map((repo) => {
      GitCli.fetchRepo(repo)
    }));
    const finished = await all;
    LoggerService.success(`Completed fetch for all ${localRepos.length} repos.`)
  }

  static async pull() {
    await GitCli.cloneMissingRepos();
    const localRepos = FilesCli.localNotArchivedRepos().sort();
    LoggerService.info(`Starting pull process.`);
    LoggerService.grey(`There are ${localRepos.length} repos to be pulled.`);
    const all = Promise.all(localRepos.map((repo) => {
      GitCli.pullRepo(repo)
    }));
    const finished = await all;
    LoggerService.success(`Completed pull for all ${localRepos.length} repos.`)
  }

  static cleanStatus(repo: string) {
    const status: any = GitCli.commandInRepo(repo, 'status');
    return status.includes('nothing to commit, working tree clean');
  }

  static getBranches(repo: string) {
    let branches = GitCli.commandInRepo(repo, "branch" ).split('\n');
    if (branches === undefined) {
      return ['master']
    } else {
      return compact(branches.map((branch: string) => {
        return branch.replace('*', '').trim();
      }));
    }
  }

  static getBranch(repo: string) {
    let branch: any= GitCli.commandInRepo(repo, "branch | grep '*'" )
    if(branch === undefined) {
      return 'master';
    }
    return branch.replace('*', '').trim();
  }

  static onMaster(repo: string) {
    return (GitCli.getBranch(repo) === 'master')
  }

  static async fetchRepo(repo: string) {
    if(!FilesCli.gitExists(repo)) { return; }

    if(!GitCli.cleanStatus(repo)) {
      LoggerService.pink(`${repo} has files that need to be committed.`)
    }
    if(!GitCli.onMaster(repo)) {
      LoggerService.pink(`${repo} is NOT on master [${GitCli.getBranch(repo)}]`);
    }

    GitCli.commandInRepo(repo, 'fetch');
    LoggerService.magenta(`Successfully fetched ${repo}`);
  }

  static async pullRepo(repo: string) {
    if(!FilesCli.gitExists(repo)) { return; }

    if(!GitCli.cleanStatus(repo)) {
      LoggerService.pink(`${repo} has files that need to be committed.`)
    }
    if(!GitCli.onMaster(repo)) {
      LoggerService.pink(`${repo} is NOT on master [${GitCli.getBranch(repo)}]`);
    }

    GitCli.commandInRepo(repo, 'pull');
    LoggerService.magenta(`Successfully pulled ${repo}`);
  }

  static commandInRepo(repo: string, command: string) {
    const path = `${GitCli.repoPath(repo)}`;
    const gitCommand =  `--git-dir ${path}/.git --work-tree=${path} ${command}`;
    return GitCli.command(gitCommand, false);
  }

  static command(command: string, debug = false) {
    const gitCommand: string =  `git ${command}`;
    if(debug) {
      LoggerService.grey(`Running: $ ${gitCommand}`);
    }
    const res: any = exec(gitCommand, {silent: !debug});
    if (res.code !== 0) {
      LoggerService.error(res.stderr);
      return res.stderr
      //exit(1)
    } else {
      return res.stdout
    }
  }

}
