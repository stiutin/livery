export type LoginInput = {
  brandId: string
  email: string
  password: string
}

export type LoginResult = { ok: true }

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export const identityApi = {
  async login(input: LoginInput): Promise<LoginResult> {
    await delay(600)

    if (input.password.toLowerCase() === 'fail') {
      throw new Error('Invalid credentials.')
    }

    return { ok: true }
  }
}

