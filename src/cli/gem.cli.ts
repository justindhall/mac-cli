import {exec, find} from "shelljs";
import {writeFileSync} from "fs";

export class GemCli {

  static versionFile(): any {
    return find('.').filter(function(file) { return file.match(/\/version.rb$/); })[0];
  }
}
