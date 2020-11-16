
export class ObjectService {
  static flatten(obj: any, priorKeys: any[] = []) {
    let persistedArray: any[] = [];
    Object.keys(obj).map((key) => {
      debugger
      if (obj[key] instanceof Array) {
        obj[key].forEach((match: string) => {
          if (match.endsWith('*') && match.startsWith('*')) {
            persistedArray = [...persistedArray, ...[{
              path: priorKeys.concat(key).join('/'),
              includes: match.replace(/\*$/, '').replace(/^\*/, '')
            }]]
          } else if (match.endsWith('*')) {
            persistedArray = [...persistedArray, ...[{path: priorKeys.concat(key).join('/'), startsWith: match.replace(/\*$/, '')  }]]
          } else if (match.startsWith('*')) {
            persistedArray = [...persistedArray, ...[{path: priorKeys.concat(key).join('/'), endsWith: match.replace(/^\*/, '')  }]]
          } else {
            persistedArray = [...persistedArray, ...[{path: priorKeys.concat(key).join('/'), exactMatch: match}]]
          }
        });
      } else {
        persistedArray = [...this.flatten(obj[key], priorKeys.concat(key)), ...persistedArray]
      }
    });
    return persistedArray;
  }

}
