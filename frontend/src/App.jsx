import { useState, useEffect } from 'react'

// Cascading Dropdown Data
const LOCATION_DATA = {
  "Karnataka": ["Bengaluru", "Mangaluru", "Mysuru", "Hubli"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
  "UAE": ["Dubai", "Abu Dhabi", "Sharjah"]
}

const API_BASE = "https://awaaz-6z1x.onrender.com"

function App() {
  // --- AUTH STATES ---
  const [currentUser, setCurrentUser] = useState(null)
  const [authView, setAuthView] = useState('login') // 'login', 'register', 'otp'
  
  // Auth Form Data
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('citizen')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [authError, setAuthError] = useState('')

  // --- DASHBOARD STATES ---
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState(null)
  const [feed, setFeed] = useState([]) 
  const [govData, setGovData] = useState(null)

  // --- AUTHENTICATION LOGIC ---
  const handleRequestOTP = async (e) => {
    e.preventDefault()
    setAuthError('')
    try {
      const res = await fetch(`${API_BASE}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone })
      })
      const data = await res.json()
      if (data.status === "unregistered") {
        setAuthError("Number not found. Please register first.")
      } else {
        setAuthView('otp') // Move to OTP screen
      }
    } catch (err) {
      setAuthError("Server error. Try again.")
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setAuthError('')
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, otp: otp })
      })
      if (!res.ok) throw new Error("Invalid OTP")
      const user = await res.json()
      setCurrentUser(user)
    } catch (err) {
      setAuthError("Invalid OTP. Hint: use 1234")
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setAuthError('')
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone_number: phone, username, role, state: selectedState, city: selectedCity 
        })
      })
      if (!res.ok) throw new Error("Registration failed")
      const user = await res.json()
      setCurrentUser(user) // Auto-login after register
    } catch (err) {
      setAuthError("Phone number or username already exists.")
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setAuthView('login')
    setPhone(''); setOtp(''); setUsername('')
  }

  // --- DASHBOARD LOGIC ---
  useEffect(() => {
    if (currentUser) {
      fetchFeed()
      if (currentUser.role === 'gov') fetchGovSummary()
    }
  }, [currentUser])

  const getUserZone = () => `${currentUser.city}, ${currentUser.state}`

  const fetchFeed = async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts/`)
      const data = await res.json()
      // Filter feed for the user's city
      setFeed(data.filter(alert => alert.zone === getUserZone()))
    } catch (error) {
      console.error(error)
    }
  }

  const fetchGovSummary = async () => {
    try {
      const res = await fetch(`${API_BASE}/gov/summary/${getUserZone()}`)
      setGovData(await res.json())
    } catch (error) {
      console.error(error)
    }
  }

  const handleVote = async (alertId, type) => {
    await fetch(`${API_BASE}/alerts/${alertId}/${type}`, { method: "POST" })
    fetchFeed()
    if (currentUser.role === 'gov') fetchGovSummary() 
  }

  const handleSubmitAlert = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/alerts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id, 
          zone: getUserZone(), 
          title, description, media_url: "string"
        })
      })
      setResult(await res.json()) 
      setTitle(''); setDescription('')
      fetchFeed()
    } catch (error) {
      console.error(error)
    }
  }

  // --- RENDER LOGIN/REGISTER GATEWAY ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">AWAAZ<span className="text-blue-600">.</span></h1>
            <p className="text-gray-500 font-medium">The Civic Intelligence Platform</p>
          </div>

          {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold text-center">{authError}</div>}

          {/* LOGIN VIEW */}
          {authView === 'login' && (
            <form onSubmit={handleRequestOTP} className="flex flex-col gap-4">
              <label className="font-bold text-gray-700 text-sm">Mobile Number</label>
              <input type="tel" placeholder="Enter 10-digit number" required value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" />
              <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl mt-2">Send Secure OTP</button>
              <p className="text-center text-sm text-gray-500 mt-4">
                New user? <button type="button" onClick={() => setAuthView('register')} className="text-blue-600 font-bold hover:underline">Create an account</button>
              </p>
            </form>
          )}

          {/* OTP VIEW */}
          {authView === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-500">OTP sent to <span className="font-bold">{phone}</span></p>
              </div>
              <label className="font-bold text-gray-700 text-sm">Enter OTP (Mock: 1234)</label>
              <input type="text" maxLength="4" required value={otp} onChange={(e) => setOtp(e.target.value)} className="p-3 text-center tracking-[1em] text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" />
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-2">Verify & Login</button>
              <button type="button" onClick={() => setAuthView('login')} className="text-sm text-gray-500 font-bold mt-2">← Back</button>
            </form>
          )}

          {/* REGISTER VIEW */}
          {authView === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex gap-2 mb-2 p-1 bg-gray-100 rounded-lg">
                <button type="button" onClick={() => setRole('citizen')} className={`flex-1 py-2 rounded-md font-bold text-sm ${role === 'citizen' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Citizen</button>
                <button type="button" onClick={() => setRole('gov')} className={`flex-1 py-2 rounded-md font-bold text-sm ${role === 'gov' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Gov Official</button>
              </div>
              <input type="text" placeholder="Full Name / Username" required value={username} onChange={(e) => setUsername(e.target.value)} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
              <input type="tel" placeholder="Mobile Number" required value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
              
              {/* CASCADING DROPDOWNS */}
              <div className="grid grid-cols-2 gap-3">
                <select required value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                  <option value="" disabled>Select State</option>
                  {Object.keys(LOCATION_DATA).map(state => <option key={state} value={state}>{state}</option>)}
                </select>
                <select required value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedState} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none disabled:opacity-50">
                  <option value="" disabled>Select City</option>
                  {selectedState && LOCATION_DATA[selectedState].map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl mt-2">Register</button>
              <p className="text-center text-sm text-gray-500 mt-2">
                Already have an account? <button type="button" onClick={() => setAuthView('login')} className="text-blue-600 font-bold hover:underline">Login</button>
              </p>
            </form>
          )}
        </div>
      </div>
    )
  }

  // --- RENDER MAIN DASHBOARD ---
  return (
    <div className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">AWAAZ<span className="text-blue-600">.</span></h1>
          <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">{currentUser.role === 'gov' ? 'Command Center' : 'Citizen Portal'} • {getUserZone()}</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="text-right">
            <p className="font-bold text-gray-900">{currentUser.username}</p>
            <p className="text-xs text-gray-500">{currentUser.phone_number}</p>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg font-bold transition-colors">Logout</button>
        </div>
      </div>

      {/* CITIZEN DASHBOARD */}
      {currentUser.role === 'citizen' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
              <h2 className="text-xl font-bold mb-4">Report an Issue in {currentUser.city}</h2>
              <form onSubmit={handleSubmitAlert} className="flex flex-col gap-4">
                <input type="text" placeholder="Issue Title (e.g. Massive Pothole)" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" />
                <textarea placeholder={`Describe the exact location in ${currentUser.city}...`} value={description} onChange={(e) => setDescription(e.target.value)} required rows="4" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all resize-none" />
                <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">Submit Alert</button>
              </form>
              {result && (
                <div className={`mt-6 p-4 rounded-xl border ${result.is_duplicate ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <p className={`font-bold flex items-center gap-2 ${result.is_duplicate ? 'text-red-700' : 'text-green-700'}`}>
                    {result.is_duplicate ? `🚨 Merged with parent thread #${result.matched_parent_thread.id}` : "✅ New alert broadcasted"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col gap-4">
            <h2 className="text-xl font-bold mb-2">Live {currentUser.city} Feed</h2>
            {feed.length === 0 && <p className="text-gray-500 font-medium p-4 bg-gray-50 rounded-xl border border-gray-200 border-dashed">No issues reported in {currentUser.city} yet. Be the first!</p>}
            {feed.map((alert) => (
              <div key={alert.id} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 ${alert.parent_alert_id ? 'border-l-red-500' : 'border-l-green-500'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{alert.title}</h3>
                    <span className="text-xs font-semibold text-gray-400">By User #{alert.user_id}</span>
                  </div>
                  <div className="flex bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <button onClick={() => handleVote(alert.id, 'upvote')} className="px-3 py-1 text-green-600 hover:bg-green-50 font-bold transition-colors">↑ {alert.upvotes || 0}</button>
                    <div className="w-px bg-gray-200"></div>
                    <button onClick={() => handleVote(alert.id, 'downvote')} className="px-3 py-1 text-red-600 hover:bg-red-50 font-bold transition-colors">↓ {alert.downvotes || 0}</button>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed mb-3">{alert.description}</p>
                {alert.parent_alert_id && (
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                    🔗 Duplicate of #{alert.parent_alert_id}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GOV DASHBOARD */}
      {currentUser.role === 'gov' && govData && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl">🏛️</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Official Zone Report</h2>
              <p className="text-gray-500 font-medium">{getUserZone()}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-10">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">⚡ AI Executive Summary</h3>
            <p className="text-blue-800 leading-relaxed">{govData.summary}</p>
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-4">Top Priority Action Items</h3>
          {govData.top_alerts.length === 0 && <p className="text-gray-500">No pressing issues in this zone.</p>}
          <div className="flex flex-col gap-4">
            {govData.top_alerts.map((alert, index) => (
              <div key={alert.id} className="flex items-center gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-3xl font-black text-blue-200">#{index + 1}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{alert.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm font-medium">
                    <span className="text-gray-600">Net Score: {(alert.upvotes || 0) - (alert.downvotes || 0)}</span>
                  </div>
                </div>
                <div className="text-gray-400 text-sm font-semibold max-w-[200px] truncate">{alert.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App