import React, { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function BloodSearch() {
  const { token } = useAuth()
  const [selectedGroup, setSelectedGroup] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    setIsSearching(true)
    setSearched(true)
    setError('')
    try {
      const response = await axios.get(`/api/donations/search?bloodGroup=${encodeURIComponent(selectedGroup)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResults(response.data.donations)
    } catch (err) {
      setError('Search failed')
      setResults([])
    }
    setIsSearching(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-8">
      <h2 className="font-display text-2xl text-crimson mb-1">Check Blood Availability 🔍</h2>
      <p className="text-gray-500 text-sm mb-6">Search for blood donors by blood group</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 mb-4 text-sm">{error}</div>
      )}

      <div className="flex gap-3 mb-8">
        <select
          value={selectedGroup}
          onChange={e => setSelectedGroup(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-crimson flex-1"
        >
          <option value="" disabled>Select Blood Group</option>
          {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <button
          onClick={handleSearch}
          disabled={!selectedGroup || isSearching}
          className="bg-crimson text-white px-8 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Searching...
            </>
          ) : 'Search Donors'}
        </button>
      </div>

      {searched && (
        <>
          {results.length > 0 ? (
            <>
              <div className="mb-4">
                <span className="bg-green-100 text-green-700 rounded-full px-4 py-1 text-sm font-medium">
                  {results.length} donor(s) found for {selectedGroup}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((donor, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-crimson text-white w-16 h-16 flex items-center justify-center text-xl font-bold rounded-full flex-shrink-0">
                        {donor.bloodGroup}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">{donor.donorName}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">🏥 {donor.hospitalName}</p>
                    <p className="text-gray-600 text-sm mb-1">📍 {donor.location}</p>
                    <p className="text-gray-500 text-xs mb-3">🕐 {donor.dateTime}</p>
                    <span className="font-mono bg-gray-100 text-xs rounded px-2 py-1">
                      {donor.blockHash ? donor.blockHash.slice(0, 12) : ''}...
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 opacity-30">
                <path d="M24 4C24 4 8 18 8 28C8 36.837 15.163 44 24 44C32.837 44 40 36.837 40 28C40 18 24 4 24 4Z" fill="#B91C1C"/>
              </svg>
              <p className="text-gray-500 text-lg">No donors found for {selectedGroup}</p>
              <p className="text-gray-400 text-sm mt-1">Try a different blood group</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
