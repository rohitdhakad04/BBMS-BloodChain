import React, { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function DonateForm() {
  const { user, token } = useAuth()
  const [form, setForm] = useState({
    donorName: user?.name || '',
    bloodGroup: '',
    dateTime: new Date().toISOString().slice(0, 16),
    location: '',
    hospitalName: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.donorName || !form.bloodGroup || !form.dateTime || !form.location || !form.hospitalName) {
      setError('All fields are required')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await axios.post('/api/donations/donate', form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed')
    }
    setIsSubmitting(false)
  }

  const handleDonateAgain = () => {
    setResult(null)
    setForm({
      donorName: user?.name || '',
      bloodGroup: '',
      dateTime: new Date().toISOString().slice(0, 16),
      location: '',
      hospitalName: ''
    })
    setError('')
  }

  if (result) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="32" fill="#16A34A" fillOpacity="0.15"/>
            <path d="M20 32L28 40L44 24" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="font-display text-2xl text-green-700 mt-4">✅ Donation Recorded on Blockchain!</h2>
          <p className="text-gray-600 mt-1">Your donation has been permanently stored on the blockchain network.</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center border-b border-green-200 pb-2">
            <span className="text-gray-600 font-medium">Donation ID:</span>
            <span className="font-semibold text-gray-800">#{result.donationId}</span>
          </div>
          <div className="flex justify-between items-start border-b border-green-200 pb-2">
            <span className="text-gray-600 font-medium">Consensus:</span>
            <span className="font-semibold text-green-700">{result.message}</span>
          </div>
          <div className="border-b border-green-200 pb-2">
            <span className="text-gray-600 font-medium block mb-1">Transaction Hash:</span>
            <span className="font-mono text-xs break-all bg-gray-100 p-2 rounded block">{result.transactionHash}</span>
          </div>
          <div>
            <span className="text-gray-600 font-medium block mb-1">Block Hash:</span>
            <span className="font-mono text-xs bg-gray-100 p-2 rounded block">
              {result.blockHash ? result.blockHash.slice(0, 24) + '...' : '—'}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-gray-600 font-medium block mb-2">Approved by:</span>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3].map(n => {
              const nodeResult = result.nodeResults?.find(r => r.node === n)
              const success = nodeResult?.status === 'success'
              return (
                <span
                  key={n}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  Node {n} {success ? '✓' : '✗'}
                </span>
              )
            })}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mb-6 italic">
          This record is now permanently immutable on the blockchain
        </p>

        <button
          onClick={handleDonateAgain}
          className="w-full bg-crimson hover:bg-red-800 text-white rounded-lg py-3 font-semibold transition-colors"
        >
          Donate Again
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-8">
      <h2 className="font-display text-2xl text-crimson mb-6">Donate Blood 💉</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name</label>
          <input
            type="text"
            name="donorName"
            value={form.donorName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-crimson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
          <select
            name="bloodGroup"
            value={form.bloodGroup}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-crimson"
          >
            <option value="" disabled>Select Blood Group</option>
            {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
          <input
            type="datetime-local"
            name="dateTime"
            value={form.dateTime}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-crimson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location / Place</label>
          <input
            type="text"
            name="location"
            placeholder="Enter city or area"
            value={form.location}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-crimson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
          <input
            type="text"
            name="hospitalName"
            placeholder="Enter hospital name"
            value={form.hospitalName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-crimson"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-crimson hover:bg-red-800 text-white rounded-lg py-3 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Recording on Blockchain...
            </>
          ) : 'Submit Donation'}
        </button>
      </form>
    </div>
  )
}
