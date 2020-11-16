#!/usr/bin/env node

const yargs = require('yargs');
import {CliNavigation} from "./navigation/cli.navigation";

new CliNavigation(yargs.argv);
