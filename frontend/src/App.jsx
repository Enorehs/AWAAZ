import { useState, useEffect } from 'react'

function App() {
  const [view, setView] = useState('citizen') 
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState(null)
  const [feed, setFeed] = useState([]) 
  const [govData, setGovData] = useState(null)

  const fetchFeed = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/alerts/")
      setFeed(await response.json())
    } catch (error) {
      console.error("Error fetching feed:", error)
    }
  }

  const fetchGovSummary = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/gov/summary/Koramangala, Bengaluru")
      setGovData(await response.json())
    } catch (error) {
      console.error("Error fetching gov summary:", error)
    }
  }

  useEffect(() => {
    fetchFeed()
    fetchGovSummary()
  }, [])

  const handleUpvote = async (alertId) => {
    await fetch(`http://127.0.0.1:8000/alerts/${alertId}/upvote`, { method: "POST" })
    fetchFeed()
    fetchGovSummary() 
  }

  const handleDownvote = async (alertId) => {
    await fetch(`http://127.0.0.1:8000/alerts/${alertId}/downvote`, { method: "POST" })
    fetchFeed()
    fetchGovSummary() 
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      user_id: 1, 
      zone: "Koramangala, Bengaluru", 
      title, description, media_url: "string"
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/alerts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      setResult(await response.json()) 
      setTitle('')
      setDescription('')
      fetchFeed()
      fetchGovSummary()
    } catch (error) {
      console.error("Error submitting alert:", error)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto font-sans">
      
      {/* NAVIGATION TABS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 md:mb-0">AWAAZ<span className="text-blue-600">.</span></h1>
        <div className="flex gap-2 p-1 bg-gray-200 rounded-lg">
          <button 
            onClick={() => setView('citizen')}
            className={`px-6 py-2 rounded-md font-semibold transition-all ${view === 'citizen' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
          >
            Citizen View
          </button>
          <button 
            onClick={() => setView('gov')}
            className={`px-6 py-2 rounded-md font-semibold transition-all ${view === 'gov' ? 'bg-blue-600 shadow-sm text-white' : 'text-gray-500 hover:text-black'}`}
          >
            Gov Dashboard
          </button>
        </div>
      </div>

      {/* CITIZEN VIEW */}
      {view === 'citizen' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
              <h2 className="text-xl font-bold mb-4">Report an Issue</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="Issue Title (e.g. Massive Pothole)" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                />
                <textarea 
                  placeholder="Describe the exact location and problem..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                  rows="4"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
                <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
                  Submit Alert
                </button>
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
            <h2 className="text-xl font-bold mb-2">Live Neighborhood Feed</h2>
            {feed.map((alert) => (
              <div key={alert.id} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 ${alert.parent_alert_id ? 'border-l-red-500' : 'border-l-green-500'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{alert.title}</h3>
                    <span className="text-xs font-semibold text-gray-400">ID: {alert.id} • {alert.zone}</span>
                  </div>
                  <div className="flex bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <button onClick={() => handleUpvote(alert.id)} className="px-3 py-1 text-green-600 hover:bg-green-50 font-bold transition-colors">
                      ↑ {alert.upvotes || 0}
                    </button>
                    <div className="w-px bg-gray-200"></div>
                    <button onClick={() => handleDownvote(alert.id)} className="px-3 py-1 text-red-600 hover:bg-red-50 font-bold transition-colors">
                      ↓ {alert.downvotes || 0}
                    </button>
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

      {/* GOV DASHBOARD VIEW */}
      {view === 'gov' && govData && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl">🏛️</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Official Zone Report</h2>
              <p className="text-gray-500 font-medium">{govData.zone}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-10">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">⚡ AI Executive Summary</h3>
            <p className="text-blue-800 leading-relaxed">{govData.summary}</p>
          </div>

          <h3 className="font-bold text-gray-900 text-lg mb-4">Top Priority Action Items</h3>
          <div className="flex flex-col gap-4">
            {govData.top_alerts.map((alert, index) => (
              <div key={alert.id} className="flex items-center gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-3xl font-black text-blue-200">#{index + 1}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{alert.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm font-medium">
                    <span className="text-gray-600">Net Score: {(alert.upvotes || 0) - (alert.downvotes || 0)}</span>
                    <span className="text-green-600">↑ {alert.upvotes || 0}</span>
                    <span className="text-red-600">↓ {alert.downvotes || 0}</span>
                  </div>
                </div>
                <div className="text-gray-400 text-sm font-semibold max-w-[200px] truncate">
                  {alert.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App