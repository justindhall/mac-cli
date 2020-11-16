import {LoggerService} from "../services/logger.service";
import {first} from "underscore";
import {GithubApi} from "../apis/github.api";
import {OWNER} from "../constants/github.constant";
import {FilesCli} from "../cli/files.cli";
import {GitCli} from "../cli/git.cli";
import {PumaCli} from "../cli/puma.cli";
import {CommandsCli} from "../cli/commands.cli";
import {AliasCli} from "../cli/alias.cli";
import {DockerComposeFile} from "../docker-compose/file.docker-compose";
import {IterateCli} from "../cli/iterate.cli";
const clear = require('clear');
const figlet = require('figlet');
const chalk = require('chalk');

export class CliNavigation {
  possibleCommands = [
    'create-branch',
    'checkout',
    'create-docker-compose',
    'repo-structure',
    'bundle',
    'branches',
    'bundle-install',
    'clone-missing-local-repos',
    'create-aliases',
    'db',
    'db:migrate',
    'db:reset',
    'fetch',
    'iterate',
    'link',
    'local-repos',
    'missing-local-repos',
    'npm',
    'repo-names',
    'repos',
    'run-in-all',
    'setup',
    'webpack',
    'yarn',
  ];

  constructor(args: any = {}) {
    this.displayIntro();
    this.run(args);
  }

  displayIntro() {
    clear();
    console.log(
      chalk.blue(
        figlet.textSync('mac-cli by Roundtrip', { horizontalLayout: 'full' })
      )
    );
  }

  async runCommandCliCommand(command: string, args: any) {
    const repo = args.r || args.repo;
    let verbose = args.v || args.verbose;
    if ([false, 0].includes(verbose)) {
      verbose = false
    } else if (verbose !== undefined) {
      verbose = true
    } else {
      LoggerService.info(`Add -v or --verbose to \`\$ mac-cli ${command}\` see more output.`);
    }
    if (command === 'bundle' || command === 'bundle-install') {
      CommandsCli.bundleInstall(repo, verbose);
    } else if (command === 'db' || command=='db:migrate') {
      CommandsCli.db(repo, verbose);
    } else if (command=='db:reset') {
      CommandsCli.dbReset(repo, verbose);
    } else if (command=='yarn') {
      CommandsCli.yarn(repo, verbose);
    } else if (command=='npm') {
      CommandsCli.npm(repo, verbose);
    } else if (command=='setup') {
      CommandsCli.setup(repo, verbose);
    }
  }

  async runCommand(command: string, args: any) {
    let passThroughArgs = {...args};
    delete passThroughArgs["_"];
    delete passThroughArgs["$0"];
    if (command === 'repos') {
      const repos: any = await new GithubApi().repos();
      LoggerService.info(`There are ${repos.length} repos currently in ${OWNER}. Here are the first one:`);
      console.log(repos[0]);
    } else if (command === 'checkout') {
      const branch = args.b || args.branch;
      const repo = args.r || args.repo;
      if ([undefined, null, ''].includes(branch)) {
        LoggerService.warn('You must specify a branch using -b or --branch');
      } else {
        if (repo === undefined) {
          await GitCli.checkout(branch);
        } else {
          await GitCli.checkoutInRepo(repo, branch);

        }
      }

    } else if (command === 'create-branch') {
      const branch = args.b || args.branch;
      if ([undefined, null, ''].includes(branch)) {
        LoggerService.warn('You must specify a branch using -b or --branch');
      } else {
        await GitCli.createBranch(branch);
      }

    } else if (command === 'repo-structure') {
      await GitCli.allPaths();
    } else if (command === 'iterate') {
      await IterateCli.run();
    } else if (command === 'branches') {
      await GitCli.branches();
    } else if (command === 'create-docker-compose') {
      new DockerComposeFile().createFiles();
    } else if (command === 'repo-names') {
      const repoNames: any = await new GithubApi().repoNames(true);
      LoggerService.info(`There are ${repoNames.length} repos currently in ${OWNER}. Here are the first 10 names:`);
      console.log(first(repoNames, 10));
    } else if (command === 'local-repos') {
      const localRepos: string[] = FilesCli.localRepos();
      LoggerService.info(`There are ${localRepos.length} repos currently in ${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}. Here are the first 10 names:`);
      console.log(first(localRepos, 10));
    } else if (command === 'missing-local-repos') {
      const missingLocalRepos: any = await FilesCli.missingLocalRepos();
      if (missingLocalRepos.length === 0) {
        LoggerService.success(`SUCCESS: All the remote repos that are not blacklisted have been cloned.`);
        LoggerService.info(`See ${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/mac-cli/dist/config.remote_repo_blacklist.json for a list of blacklisted repos.`);
      } else {
        LoggerService.info(`There are ${missingLocalRepos.length} repos currently in ${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}. Here are the first 10 names:`);
        console.log(first(missingLocalRepos, 10))
      }
    } else if (command === 'clone-missing-local-repos') {
      const dryRun = args['dryRun'] || false;
      await GitCli.cloneMissingRepos(dryRun);
    } else if (command === 'fetch') {
      await GitCli.fetch();
      AliasCli.create();
    } else if (command === 'run-in-all') {
      if([undefined, null, ''].includes(args.c)) {
        LoggerService.error('ERROR: Please supply a command.');
        LoggerService.grey("'$ mac-cli run-in-all -c 'bundle install' -r 'path/to/required/file.json' ")
        return;
      }
      const runCommand = args.c || args.command;
      const requiredFile = args.r || args.required;
      CommandsCli.runCommandInAllRepos([runCommand], [requiredFile]);
    } else if (command === 'link') {
      if ([undefined, null, ''].includes(args.repo)) {
        const localRepos: any = await FilesCli.localRepos();
        LoggerService.info(`mac-cli link --repo <repo-name> will link just one repo`)
        PumaCli.linkAllRepos()
      } else {
         PumaCli.link(args.repo);
      }
    } else if (command === 'create-aliases') {
      AliasCli.create();
    } else {
      this.runCommandCliCommand(command, args)
    }
  }

  run(args: any) {
    const command = args._[0];
    if(!this.possibleCommands.includes(command)) {
      LoggerService.error(`'${command}' is not an option.`);
      LoggerService.grey('Please choose one of the following');
      this.possibleCommands.map((cmd) => {
        LoggerService.info(`mac-cli  ${cmd}`);
      });
      return;
    }
    LoggerService.grey(`Running $ mac-cli ${command}`);
    if ([undefined, null, ''].includes(command)) {
      LoggerService.info('You have to choose a command.');
      LoggerService.warn('example: `mac-cli fetch`');
    } else {
      this.runCommand(command, args)
    }
  }
}
