import {cd ,pwd, exec} from "shelljs";
import {FilesCli} from "./files.cli";
import {LoggerService} from "../services/logger.service";
import {select} from 'underscore';
import {PumaCli} from "./puma.cli";
import {GitCli} from "./git.cli";
import {readFileSync} from "fs";
export class CommandsCli {

  static setup(repo?: string, verbose = false) {
    CommandsCli.bundleInstall(repo, verbose);
    CommandsCli.db(repo, verbose);
    CommandsCli.npm(repo, verbose);
    CommandsCli.yarn(repo, verbose);
    if (repo === undefined) {
      PumaCli.linkAllRepos();
    } else {
      PumaCli.link(repo);
    }
  }

  static link(repo?: string, verbose = false) {
    CommandsCli.runCommandInAllRepos([`mac-cli link --repo ${repo}`], ['Gemfile.lock'], repo, verbose);
  }

  static bundleInstall(repo?: string, verbose = false) {
    CommandsCli.runCommandInAllRepos(['bundle install'], ['Gemfile.lock'], repo, verbose);
  }

  static db(repo?: string, verbose = false) {

    if (FilesCli.fileExists('spec/dummy/config/database.yml')) {
      CommandsCli.runCommandInAllRepos(['bundle exec rake db:create', 'bundle exec rake db:migrate', 'bundle exec rake db:seed'], [], repo, verbose);
    }
  }

  static dbReset(repo?: string, verbose = false) {
    CommandsCli.runCommandInAllRepos(['bundle exec rake db:reset', 'bundle exec rake db:seed'], ['config/database.yml'], repo, verbose);
  }

  static npm(repo?: string, verbose = false) {
    if(FilesCli.fileExists('yarn.lock')) {
      LoggerService.warn(`Skipping: [npm ci] in ${repo} because there is a yarn.lock file`);

      return
    }
    CommandsCli.runCommandInAllRepos(['npm ci'], ['package-lock.json'], repo, verbose);
  }

  static yarn(repo?: string, verbose = false) {
    CommandsCli.runCommandInAllRepos(['yarn install --frozen-lockfile'], ['yarn.lock'], repo, verbose);
  }

  static runCommandInRepo(repo: string, commands: string[], requiredFiles: string[] = [], verbose: boolean = true) {
    const currentDirectory = pwd();
    const path = `${GitCli.repoPath(repo)}`;
    if (path.includes('mobile')) {
      LoggerService.warn(`Skipping: ${commands} in ${repo} this is a mobile project and I am not sure what to do here`);
    }
    cd(path);
    const missingFiles =  select(requiredFiles, (requiredFile) => {
      return !FilesCli.fileExists(requiredFile)
    });
    if (missingFiles.length > 0) {
      LoggerService.warn(`Skipping: ${JSON.stringify(commands)} in ${repo} because ${JSON.stringify(missingFiles)} do(es) not exist`);
      exec(`cd ${currentDirectory}`);
      return;
    }

    commands.map((command) => {
      LoggerService.grey(`Running: ${command} in ${path}`);
      const result = exec(command, {silent: !verbose});
      exec(`cd ${currentDirectory}`);
      if (result.code === 0) {
        LoggerService.success(`Successfully ran ${command} in ${path}`)
      } else {
        console.log(result);
        LoggerService.error(result.stderr);
      }
    })
  }

  static runCommandInAllRepos(commands: string[], requiredFiles?: string[], repo?: string, verbose = false) {
    if (repo !== undefined) {
      CommandsCli.runCommandInRepo(repo, commands, requiredFiles, verbose);
      return
    }
    const repos = FilesCli.localNotArchivedRepos().filter((repo) => {
      return GitCli.repoPath(repo).includes('product')
    });
    const currentDirectory = pwd();
    repos.map((repo) => {
      CommandsCli.runCommandInRepo(repo, commands, requiredFiles, verbose)
    });
    exec(`cd ${currentDirectory}`);
  }
}
