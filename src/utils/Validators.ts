import { config } from "../configs"
import { IEnvConfig } from "../configs/env.config"

function valueExists<T extends IEnvConfig, K extends keyof T>(keys: K[]): void {
  for (let key of keys) {
    const value = (config.env as T)[key]
    if (value === null || value === undefined || value === "") {
      throw Error(`The environment variable ${String(key)} must be set.`)
    }
  }
}

const Validators = {
  valueExists
}

export default Validators