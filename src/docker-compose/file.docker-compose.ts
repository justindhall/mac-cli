import {FilesCli} from "../cli/files.cli";
import {readFileSync, writeFileSync} from "fs";
import {DOCKER_PATH} from "../constants/file.constant";
import {keys} from 'underscore';
import {GitCli} from "../cli/git.cli";
import {parse, stringify} from "yaml";
import {exec, pwd} from 'shelljs';
import {LoggerService} from "../services/logger.service";

export class DockerComposeFile {
  cache: any = {};
  nginxConfig: any[] = [];
  createFiles() {
    exec(`rm ${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/docker-compose.yml`, {silent: true});
    const railsConfig = this.dockerConfig().rails;
    this.dockerCompose();
    return keys(railsConfig).map((repo: string, index: number) => {
      this.updateGemfile(repo);
      this.updateSettings(repo);
      this.updateWorkflows(repo);
      this.updatePuma(repo);
      this.updateDockerignore(repo);
      exec(`mkdir -p ${GitCli.repoPath(repo)}/tmp/pids`);
      exec(`touch ${GitCli.repoPath(repo)}/tmp/.keep`);
      this.updateGitignore(repo);
      const port = 3000 + index;
      const config = railsConfig[repo] || {};
      this.updateDockerCompose(repo, config, port);
      this.updateEntrypoint(repo, config, port);
      writeFileSync(`${process.env.ROUNDTRIP_WORKSPACE_DIRECTORY}/docker-compose.yml`, stringify(this.cache['dockerCompose'], {indent: 2}));

      this.updateNginxConfig(repo, config, port);
      const nginx = `
      worker_processes 4;
      events { worker_connections 1024; }
      http {
        ${this.nginxConfig.join('\n\n')}
      }
      `.trim();
      writeFileSync(`${GitCli.repoPath('local-ops-nginx')}/nginx.conf`, nginx, 'utf-8' );

      this.updateDatabaseConfig(repo);
      this.updateLocalDockerFile(repo, config, port);
      this.updateDockerFile(repo, config, port);
    })
  }


  updateDatabaseConfig(repo: string) {
    const databaseConfigFile = readFileSync(`${GitCli.repoPath(repo)}/config/database.yml`, 'utf-8');
    const databaseConfig = parse(databaseConfigFile);
    ['development', 'test'].map((environment) => {
      if ([undefined, null, ''].includes(databaseConfig[environment].url) || databaseConfig[environment].url.includes("ENV['DATABASE_URL']")) {
        databaseConfig[environment].url =`<%= ENV['DATABASE_URL'] || 'localhost' %>`;
      } else {
        databaseConfig[environment].url =`<%= ENV['DATABASE_URL'] || '${databaseConfig[environment].url || 'localhost'}' %>`;
      }
    });
    writeFileSync(`${GitCli.repoPath(repo)}/config/database.yml`, stringify(databaseConfig), 'utf-8');
  }


  updateGemfile(repo: string) {
    if(!FilesCli.fileExists(`${GitCli.repoPath(repo)}/Gemfile`)) { return; }
    const fileContents: any = readFileSync(`${GitCli.repoPath(repo)}/Gemfile`, 'utf-8');
    let lines: string[] = fileContents.split('\n');
    lines = lines.map((line: string) => {
       if (line.toLowerCase().includes('git@github.com:samuelbirk')) {
        return line.replace(/git@github.com:samuelbirk/i, "https://github.com/samuelbirk");
      } else if (line.toLowerCase().includes('git@github.com:')) {
        return line.replace(/git@github.com:/i, "https://github.com/");
      } else {
        return line;
      }
    });

    writeFileSync(`${GitCli.repoPath(repo)}/Gemfile`, lines.join('\n'), 'utf-8');
  }

  updateWorkflows(repo: string) {
    exec(`mkdir -p ${GitCli.repoPath(repo)}/.github/workflows`);
      const fileContents = readFileSync(`${DOCKER_PATH}/workflows/dockerpublish.yml`, 'utf-8');
      const workflow = parse(fileContents);
      workflow.env.IMAGE_NAME = repo;
      writeFileSync(`${GitCli.repoPath(repo)}/.github/workflows/dockerpublish.yml`, stringify(workflow), 'utf-8')
      exec(`cp -rf ${GitCli.repoPath('mac-cli')}/dist/docker/workflows/pull-request.yml ${GitCli.repoPath(repo)}/.github/workflows/pull-request.yml`)
  }

  updatePuma(repo: string) {
    if (!FilesCli.fileExists(`${GitCli.repoPath(repo)}/config/puma.rb`)) {
      exec(`cp -rf ${GitCli.repoPath('mac-cli')}/dist/docker/puma.rb ${GitCli.repoPath(repo)}/config/puma.rb`)
    }
  }


  updateDockerignore(repo: string) {
    if (!FilesCli.fileExists(`${GitCli.repoPath(repo)}/config/.dockerignore`)) {
      exec(`cp -rf ${GitCli.repoPath('mac-cli')}/dist/docker/.dockerignore ${GitCli.repoPath(repo)}/.dockerignore`)
    }
  }

  updateGitignore(repo: string) {
    const gitignore: any = readFileSync(`${GitCli.repoPath(repo)}/.gitignore`, 'utf-8');
    let ignored = gitignore.split('\n')
    if (!ignored.includes('tmp/*')) {
      ignored = [...ignored, 'tmp/*'];
    }
    if (!ignored.includes('!tmp/.keep')) {
      ignored = [...ignored, '!tmp/.keep'];
    }
    writeFileSync(`${GitCli.repoPath(repo)}/.gitignore`, ignored.join('\n'), 'utf-8');
  }

  updateSettings(repo: string) {
    if(!FilesCli.fileExists(`${GitCli.repoPath(repo)}/config/settings/development.yml`)) { return; }
    const fileContents: any = readFileSync(`${GitCli.repoPath(repo)}/config/settings/development.yml`, 'utf-8');
    let lines: string[] = fileContents.split('\n');
    lines = lines.map((line: string) => {
      if (line.includes('redis://localhost:')) {
        return line.replace('redis://localhost:', "redis://<%= ENV['REDIS_DOMAIN'] || 'localhost' %>:");
      } else {
        return line;
      }
    });

    writeFileSync(`${GitCli.repoPath(repo)}/config/settings/development.yml`, lines.join('\n'), 'utf-8');
  }

  updateNginxConfig(repo: string, config: any, port= 3000) {
    this.nginxConfig = [...this.nginxConfig, `
      upstream ${this.subdomain(repo, config)}.${process.env.BRANCH?.toLowerCase()}.roundtriphealth.com {
         least_conn;
         server ${this.subdomain(repo, config)}:${port} weight=10 max_fails=3 fail_timeout=30s;
      }
      
      server {
        listen 80;
        listen [::]:80;
        listen 443 ssl;
    
        server_name ${this.subdomain(repo, config)}.${process.env.BRANCH?.toLowerCase()}.roundtriphealth.com;
        ssl_certificate /etc/nginx/certs/nginx.crt;
        ssl_certificate_key /etc/nginx/certs/nginx.key;
    
        location / {
          proxy_pass http://${this.subdomain(repo, config)}.${process.env.BRANCH?.toLowerCase()}.roundtriphealth.com;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
        }
      }
    `]
  }

  updateLocalAndDeploymentDockerfile(dockerfile: string, repo: string, config: any) {
    let rubyVersion = readFileSync(`${GitCli.repoPath(repo)}/.ruby-version`, 'utf-8') || '2.7.1';
    let image = config.image;
    if ([undefined, null, ''].includes(config.image)) {
      image = `ruby:${rubyVersion.trim()}-alpine`
    }
    if (['ruby:2.4.2-alpine'].includes(image)) {
      dockerfile = dockerfile.replace('##ALPINE NPM PACKAGE##', '\\')
    } else {
      dockerfile = dockerfile.replace('##ALPINE NPM PACKAGE##', 'npm \\')
    }
    if (FilesCli.fileExists(`${GitCli.repoPath(repo)}/yarn.lock`)) {
      dockerfile = dockerfile.replace('##RUN YARN INSTALL##', 'RUN rm -rf node_modules && npm install -g yarn && yarn install --frozen-lockfile')
    }
    return dockerfile;
  }

  updateDockerFile(repo: string, config: any, port= 3000) {
    let dockerfile = this.dockerfile();
    let rubyVersion = readFileSync(`${GitCli.repoPath(repo)}/.ruby-version`, 'utf-8') || '2.7.1';
    if (![undefined, null, ''].includes(config.image)) {
      dockerfile = dockerfile.replace('FROM ruby:alpine', `FROM ${config.image}`);
    } else {
      dockerfile = dockerfile.replace('FROM ruby:alpine', `FROM ruby:${rubyVersion.trim()}-alpine`);
    }

    dockerfile = this.updateLocalAndDeploymentDockerfile(dockerfile, repo, config);
    writeFileSync(`${GitCli.repoPath(repo)}/Dockerfile`, dockerfile)
  }

  updateLocalDockerFile(repo: string, config: any, port= 3000) {
    let dockerfile = this.dockerfile();
    dockerfile =dockerfile.replace('EXPOSE 3000', `EXPOSE ${port}`);
    if (![undefined, null, ''].includes(config.local_image)) {
      dockerfile = dockerfile.replace('FROM ruby:alpine', `FROM ${config.local_image}`);
    } else {
      dockerfile = dockerfile.replace('FROM ruby:alpine', `FROM docker.pkg.github.com/roundtrip/${repo}/${repo}:${this.dockerFromVersion(repo)}`);
    }
    dockerfile = this.updateLocalAndDeploymentDockerfile(dockerfile, repo, config);
    writeFileSync(`${GitCli.repoPath(repo)}/Dockerfile-local`, dockerfile)
  }

  updateEntrypoint(repo: string, config: any, port= 3000) {
    let entrypoint: any = this.entrypoint(repo, config);
    entrypoint = entrypoint.replace(/3000/g, `${port}`);
    const db = readFileSync(`${GitCli.repoPath(repo)}/config/database.yml`, 'utf-8');

    if (!db.includes('rt-core-maybe?')) {
      entrypoint = entrypoint.replace('##DATABASE MIGRATION##', `bundle exec rails db:create && bundle exec rails db:migrate && bundle exec rails db:seed`);
    }
    entrypoint = entrypoint.replace(/3000/g, `${port}`);
    writeFileSync(`${GitCli.repoPath(repo)}/entrypoint.sh`, entrypoint, 'utf-8')
    exec(`chmod +x ${GitCli.repoPath(repo)}/entrypoint.sh`)
  }

  dockerFromVersion(repo: string) {
    const branch = GitCli.getBranch(repo);
    if(branch === 'master') {
      return 'latest'
    } else {
      return branch.toLowerCase();
    }
  }

  subdomain(repo: string, config: any) {
    if ([undefined, null, ''].includes(config.subdomain)) {
      switch(repo) {
        case 'roundtrip-1':
          return 'roundtrip';
        case 'roundtrip-2':
          return 'roundtrip2';
        default:
          return  repo.replace(/^roundtrip-/, '').replace(/\-/g, '');
      }
    } else {
      return config.subdomain
    }
  }

  workspacePath(repo: string) {
    return `.${GitCli.repoPath(repo).replace(process.env.ROUNDTRIP_WORKSPACE_DIRECTORY || '', '')}`
  }

  updateDockerCompose(repo: string, config: any, port= 3000) {
    if (this.cache['dockerCompose']['services'] === undefined) {
      this.cache['dockerCompose']['services'] = {[`rails-${repo}`]: {}}
    }
    if ([undefined, null, ''].includes(this.cache['dockerCompose']['services']['nginx']['links'])) {
      this.cache['dockerCompose']['services']['nginx']['links'] = []
    }
    if ([undefined, null, ''].includes(this.cache['dockerCompose']['services']['nginx']['depends_on'])) {
      this.cache['dockerCompose']['services']['nginx']['depends_on'] = []
    }
    this.cache['dockerCompose']['services']['nginx']['links'] = [...this.cache['dockerCompose']['services']['nginx']['links'], `rails-${repo}:${this.subdomain(repo, config)}`];
    this.cache['dockerCompose']['services']['nginx']['depends_on'] = [...this.cache['dockerCompose']['services']['nginx']['depends_on'], `rails-${repo}`];
    this.cache['dockerCompose']['services'][`rails-${repo}`] = {
      build: {
        context: this.workspacePath(repo),
        dockerfile: `./Dockerfile-local`,
        args: {
          GITHUB_TOKEN: "$GITHUB_TOKEN",
          GITHUB_USERNAME: "$GITHUB_USERNAME",
          APP_NAME: repo,
          RAILS_MASTER_KEY: "$RAILS_MASTER_KEY",
        }
      },
      command: config.entrypiint || './entrypoint.sh',
      environment: {
        DATABASE_URL: "postgres://$USER@db",
        TEST_DATABASE_URL: "postgres://$USER@db",
        RAILS_ENV: "development",
        REDIS_DOMAIN: "redis",
        USERNAME: "$USER",
        APP_NAME: repo,
        RAILS_MASTER_KEY: "$RAILS_MASTER_KEY",
      },
      volumes: [
        `${this.workspacePath(repo)}:/app`,
      ],
      ports: [
        `${port}:${port}`
      ],
      depends_on: [
        'db'
      ]
    }
  }

  dockerConfig() {
    if ([undefined, null].includes(this.cache['dockerConfig'])) {
      return this.cache['dockerConfig'] = FilesCli.readDockerFile('config');
    } else {
      return this.cache['dockerConfig'];
    }
  }

  dockerCompose(): any {
    if ([undefined, null].includes(this.cache['dockerCompose'])) {
      return this.cache['dockerCompose'] = FilesCli.readDockerFile('docker-compose');
    } else {
      return this.cache['dockerCompose'];
    }
  }

  dockerfile() {
    if ([undefined, null].includes(this.cache['dockerfile'])) {
      return this.cache['dockerfile'] = readFileSync(`${DOCKER_PATH}/Dockerfile`, 'utf-8');
    } else {
      return this.cache['dockerfile'];
    }
  }

  entrypoint(repo: string, config: any) {
    if (![undefined, null, ''].includes(config.entrypoint) || FilesCli.fileExists(`${GitCli.repoPath(repo)}/${config.entrypoint}`)) {
      return readFileSync(`${GitCli.repoPath(repo)}/${config.entrypoint}`, 'utf-8');
    } else {
      return readFileSync(`${DOCKER_PATH}/rails-entrypoint.sh`, 'utf-8');
    }
  }
}
