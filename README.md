# mac-cli
A place to put ops code to setup you local development environment on a mac
## Setup
- ```mkdir -p $HOME/workspace```
- ```cd $HOME/workspace```
- ```git clone git@github.com:justindhall/roundtrip-mac-cli.git```
- You will probably want to add the following to your .zshrc or .bash_profile
```bash
# By default you should expect to put your code for Roundtrip in ~/roundtrip
# If you would like it to be somewhere else please change the following
export ROUNDTRIP_WORKSPACE_DIRECTORY=$HOME/roundtrip 
# You can find create a GITHUB_TOKEN by going to https://github.com/settings/tokens 
export GITHUB_TOKEN='<your token>'
source $HOME/workspace/mac-cli/dist/profiles/shared.sh
```
- npm install -g  ts-node tsc typescript
- Download docker from https://www.docker.com/products/docker-desktop
- ``start_roundtrip``
- ```mac-cli fetch```
- ```mac-cli setup```
