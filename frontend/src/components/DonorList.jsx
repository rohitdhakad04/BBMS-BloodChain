import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function DonorList() {
  const { token } = useAuth()
  const [donors, setDonors] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchDonors = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/donations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDonors(response.data.donations)
    } catch (err) {
      setError('Failed to load donors')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchDonors()
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-md p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl text-crimson">All Donors 📋</h2>
        <button
          onClick={fetchDonors}
          className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 mb-4 text-sm">{error}</div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="h-8 bg-gray-200 rounded w-full"/>
            </div>
          ))}
        </div>
      ) : donors.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No donations recorded yet 🩸</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to donate blood!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-crimson text-white">
                <th className="px-4 py-3 text-left rounded-tl-lg">#</th>
                <th className="px-4 py-3 text-left">Donor Name</th>
                <th className="px-4 py-3 text-left">Blood Group</th>
                <th className="px-4 py-3 text-left">Hospital</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left rounded-tr-lg">Block Hash</th>
              </tr>
            </thead>
            <tbody>
              {donors.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{d.donorName}</td>
                  <td className="px-4 py-3">
                    <span className="bg-red-100 text-crimson font-semibold px-3 py-1 rounded-full text-xs">
                      {d.bloodGroup}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.hospitalName}</td>
                  <td className="px-4 py-3 text-gray-600">{d.location}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{d.dateTime}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {d.blockHash ? d.blockHash.slice(0, 14) : ''}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
