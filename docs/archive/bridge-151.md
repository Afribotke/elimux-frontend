EDIT 1: src/app/auth/login/page.tsx
Find this line (should be in handleSubmit, after the session is validated):
TypeScript
setSessionMarkers(data.session)
Replace with:
TypeScript
setSessionMarkers(data.session)
window.dispatchEvent(new Event('elimux:auth:changed'))
EDIT 2: src/components/AuthContext.tsx (or wherever your auth provider is)
Find the useEffect that initializes auth state on mount. It probably looks something like:
TypeScript
useEffect(() => {
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession()
    setUser(data.session?.user ?? null)
    setLoading(false)
  }
  checkSession()
}, [])
Replace that entire useEffect block with:
TypeScript
useEffect(() => {
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession()
    setUser(data.session?.user ?? null)
    setLoading(false)
  }
  checkSession()

  // Re-check session when login completes in another tab/component
  const handleAuthChange = () => {
    checkSession()
  }
  window.addEventListener('elimux:auth:changed', handleAuthChange)
  return () => window.removeEventListener('elimux:auth:changed', handleAuthChange)
}, [])
If your auth provider uses supabase.auth.onAuthStateChange() instead of getSession(), add the listener alongside it:
TypeScript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user ?? null)
    setLoading(false)
  })

  const handleAuthChange = () => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
  }
  window.addEventListener('elimux:auth:changed', handleAuthChange)

  return () => {
    subscription.unsubscribe()
    window.removeEventListener('elimux:auth:changed', handleAuthChange)
  }
}, [supabase])
EXECUTE
Apply Edit 1 to src/app/auth/login/page.tsx
Apply Edit 2 to your auth provider component
npm run build — must pass
Commit both files, push, deploy
Test: log in on /auth/login → nav bar should show avatar/email immediately without needing a page refresh
Report back: does the nav update instantly after login?