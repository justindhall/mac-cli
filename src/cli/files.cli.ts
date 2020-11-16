import {exec, test} from "shelljs";
import {readFileSync, writeFileSync} from "fs";
import {CACHE_PATH, CONFIG_PATH, DOCKER_PATH} from "../constants/file.constant";
import {LoggerService} from "../services/logger.service";
import {GithubApi} from "../apis/github.api";
import {difference, first, last, pluck} from 'underscore';
import {GitCli} from "./git.cli";
import {parse} from 'yaml'

export class FilesCli {
  constructor() {
  }

  static cacheExists(type: string) {
    return FilesCli.fileExists(`${CACHE_PATH}/${type}.json`);
  }

  static configExists(type: string) {
    return FilesCli.fileExists(`${CONFIG_PATH}/${type}.json`);
  }

  static dockerExists(type: string) {
    return FilesCli.fileExists(`${DOCKER_PATH}/${type}.yml`);
  }

  static fileExists(path: string) {
    return test('-f', path);
  }

  static gitExists(repo: string) {
    return test('-d', `${GitCli.repoPath(repo)}/.git`);
  }

  static localRepos() {
    const localRepoBlacklist = this.readConfigFile('local_repo_blacklist');
    const localRepos = exec(`find ${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY} -name .git -type d -prune`, {silent: true}).stdout.trim().split('\n').map((path: string) => {
      const pathArr: string[] = path.split('/');
      return `${first(last(pathArr,2))}`;
    });
    if (process.env.LOCAL_GITHUB_REPO_STRUCTURE !== 'clean') {
      return difference(localRepos, localRepoBlacklist);
    } else {
      return localRepos;
    }
  }

  static localNotArchivedRepos() {
    const localRepoBlacklist = this.readConfigFile('local_repo_blacklist');
    const localNotArchivedRepos: any = exec(`find ${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY} -name .git -type d -prune`, {silent: true}).stdout.trim().split('\n').filter((path) => {
      return !path.includes('/archived/')
    }).map((path: string) => {
      const pathArr: string[] = path.split('/');
      return {name: `${first(last(pathArr,2))}`, path: path};
    });
    if (process.env.LOCAL_GITHUB_REPO_STRUCTURE !== 'clean') {
      return difference(pluck(localNotArchivedRepos, 'name'), localRepoBlacklist);
    } else {
      return pluck(localNotArchivedRepos, 'name');
    }
  }

  static localArchivedRepos() {
    const localArchivedRepos: any = exec(`find ${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY} -name .git -type d -prune`, {silent: true}).stdout.trim().split('\n').filter((path) => {
      return path.includes('/archived/')
    }).map((path: string) => {
      const pathArr: string[] = path.split('/');
      return {name: `${first(last(pathArr,2))}`, path: path};
    });
    return localArchivedRepos;
  }

  static async missingLocalRepos() {
    const remoteRepos = await new GithubApi().repoNames();
    const localRepos = FilesCli.localRepos();
    const missing = difference(remoteRepos, localRepos);
    if (missing.length === 0) {
      LoggerService.success(`All the remote repos that are not blacklisted have been cloned.`);
      LoggerService.grey(`See ${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/mac-cli/dist/config.remote_repo_blacklist.json for a list of blacklisted repos.`)
    } else {
      LoggerService.info(`There are ${missing.length} repos missing locally.`);
    }
    return missing;
  }

  static createCacheFile(fileName: string, obj: any) {
    writeFileSync(`${CACHE_PATH}/${fileName}.json`, JSON.stringify(obj, null, 2), 'utf8');
  }

  static readCacheFile(type: string) {
    const currentCache: any = FilesCli.cacheExists(type) ? readFileSync(`${CACHE_PATH}/${type}.json`) : '[]';
    return JSON.parse(currentCache)
  }

  static readConfigFile(type: string) {
    const currentCache: any = FilesCli.configExists(type) ? readFileSync(`${CONFIG_PATH}/${type}.json`) : '[]';
    return JSON.parse(currentCache)
  }

  static readDockerFile(type: string) {
    const currentDockerCompose: any = FilesCli.dockerExists(type) ? readFileSync(`${DOCKER_PATH}/${type}.yml`, 'utf-8') : '[]';
    return parse(currentDockerCompose)
  }

}
