const chalk = require('chalk');

export class LoggerService {
  static error(message: any) {
    console.log(
      chalk.red(LoggerService.clean(message))
    )
  }

  static info(message: any) {
    console.log(
      chalk.cyan(LoggerService.clean(message))
    )
  }

  static success(message: any) {
    console.log(
      chalk.green(LoggerService.clean(message))
    )
  }

  static warn(message: any) {
    console.log(
      chalk.yellow(LoggerService.clean(message))
    )
  }

  static grey(message: any) {
    console.log(
      chalk.grey(LoggerService.clean(message))
    )
  }

  static step(step: number, message: any) {
    console.log(
      chalk.magenta(`STEP #${step}: ${LoggerService.clean(message)}`)
    )
    return (step + 1);
  }

  static pink(message: any) {
    console.log(
      chalk.redBright(LoggerService.clean(message))
    )
  }

  static magenta(message: any) {
    console.log(
      chalk.magenta(LoggerService.clean(message))
    )
  }

  static clean(message: any) {
    if(typeof message === 'string') {
      return message;
    } else {
      return JSON.stringify(message, null, 2);
    }
  }

}
