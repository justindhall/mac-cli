import {exec} from "shelljs";

export class IterateCli {


  static async run() {
    [3].forEach((sso_index) => {
      [0].forEach((slo_index) => {
        [ 0,1,2].forEach((cert_index) => {
          exec(`open https://saml.idme.dev/auths?sso_index=${sso_index}&slo_index=${slo_index}&cert_index=${cert_index}`)
        })
      })
    })
  }

}
