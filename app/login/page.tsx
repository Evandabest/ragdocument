import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" className='text-black' required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" className='text-black' required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  )
}