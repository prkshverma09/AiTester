'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginParent, type ParentLoginState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const initialState: ParentLoginState = {}

export default function ParentLoginPage() {
  const [state, formAction] = useActionState(loginParent, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <main className="w-full max-w-sm space-y-8 p-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parent Login</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to view your children and their progress.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {state.error}
            </p>
          )}
          <div className="space-y-2">
            <label htmlFor="parent-email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              id="parent-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="parent-password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              id="parent-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="text-slate-700 underline hover:text-slate-900">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  )
}
