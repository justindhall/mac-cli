import {Octokit} from "@octokit/rest";
import {OWNER} from "../constants/github.constant";
import {LoggerService} from "../services/logger.service";
import {exit} from "shelljs";
import {FilesCli} from "../cli/files.cli";
import {difference, pluck, uniq} from "underscore";

export class GithubApi {
  private api: any;
  private cache: any = {};
  public token: string = process.env.GITHUB_TOKEN || '';
  public username: string = process.env.DEVELOPER || '';
  constructor() {
    this.auth();
  }

  auth() {
    return this.api = new Octokit({auth: this.token});
  }

  async repos(useCache = false) {
    try {
      if ([undefined, null].includes(this.cache['repos'])) {
        if (useCache && FilesCli.cacheExists('repos')) {
          return this.cache['repos'] = FilesCli.readCacheFile('repos');
        } else {
          const repos = await this.api.paginate(`GET /orgs/${OWNER}/repos`, {});
          FilesCli.createCacheFile('repos', repos);
          return this.cache['repos'] = repos;
        }
      } else {
        return this.cache['repos'];
      }
    } catch(error) {
      LoggerService.error(error);
      exit(1)
    }
  }

  async repoNames(useCache = false) {
    if ([undefined, null].includes(this.cache['repoNames'])) {
      const repos = await this.repos(useCache);
      const uniqueProjectNames = uniq(pluck(repos, 'name'));
      if (process.env.LOCAL_GITHUB_REPO_STRUCTURE !== 'clean') {
        const blacklist =  await FilesCli.readConfigFile('remote_repo_blacklist');
        return this.cache['repoNames'] = difference(uniqueProjectNames, blacklist);
      } else {
        return this.cache['repoNames'] = uniqueProjectNames;
      }
    } else {
      return this.cache['repoNames'];
    }
  }
}
