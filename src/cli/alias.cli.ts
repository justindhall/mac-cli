import {FilesCli} from "./files.cli";
import {readFileSync, writeFileSync} from "fs";
import {exec} from "shelljs";
import {flatten} from 'underscore';
import {PumaCli} from "./puma.cli";
import {LoggerService} from "../services/logger.service";
import {GitCli} from "./git.cli";

export class AliasCli {

  static create() {
    const localRepos = FilesCli.localRepos();
    let previousAliases:any = '';
    if (FilesCli.fileExists(`${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/mac-cli/dist/profiles/repos.sh`)) {
      previousAliases = readFileSync(`${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/mac-cli/dist/profiles/repos.sh`)
    }
    const aliases = localRepos.map((repo) => {
      return [
        `alias go-${repo}="cd ${GitCli.repoPath(repo)}"`,
        `alias open-${repo}="open ${PumaCli.url(repo)}"`,
      ]
    });
    const withShebang = ['#!/usr/bin/env bash', ...flatten(aliases)];
    writeFileSync(`${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/mac-cli/dist/profiles/repos.sh`, withShebang.join('\n'));
    const nextAliases = readFileSync(`${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/mac-cli/dist/profiles/repos.sh`);
    if(previousAliases === nextAliases) { return }
      ['zshrc', 'bash_profile', 'bashrc'].map((file: string) => {
      if (FilesCli.fileExists(`${process.env.HOME}/.${file}`)) {
        LoggerService.info(`Please resource your \`${process.env.HOME}/.${file}\` file to get updated aliases.`)
      }
    })
  }

}
