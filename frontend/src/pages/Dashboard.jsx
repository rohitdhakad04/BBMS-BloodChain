import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import DonateForm from '../components/DonateForm'
import BloodSearch from '../components/BloodSearch'
import DonorList from '../components/DonorList'
import NodeStatus from '../components/NodeStatus'

export default function Dashboard() {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [stats, setStats] = useState({ totalDonations: 0, activeNodes: 0, consensusStatus: '' })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [donationsRes, nodesRes] = await Promise.allSettled([
          axios.get('/api/donations', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/blockchain/nodes', { headers: { Authorization: `Bearer ${token}` } })
        ])
        const totalDonations = donationsRes.status === 'fulfilled' ? donationsRes.value.data.count : 0
        let activeNodes = 0
        let consensusStatus = ''
        if (nodesRes.status === 'fulfilled') {
          const nodeData = nodesRes.value.data
          activeNodes = nodeData.nodes.filter(n => n.status === 'online').length
          consensusStatus = nodeData.consensus.reached ? 'Consensus ✅' : 'No Consensus ⚠️'
        }
        setStats({ totalDonations, activeNodes, consensusStatus })
      } catch (e) {}
    }
    fetchStats()
  }, [token])

  const tabs = [
    { label: '💉 Donate Blood', component: <DonateForm /> },
    { label: '🔍 Check Availability', component: <BloodSearch /> },
    { label: '📋 Donor List', component: <DonorList /> },
    { label: '🌐 Node Status', component: <NodeStatus /> }
  ]

  return (
    <div className="bg-gray-50 min-h-screen font-body">
      <Navbar />
      <div className="pt-20 px-4 max-w-7xl mx-auto pb-10">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-crimson">Welcome back, {user?.name} 👋</h1>
          <p className="text-gray-500 mt-1">Hospital Blood Donation Portal — Powered by Blockchain</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white shadow rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">🩸 Total Donations</p>
            <p className="text-3xl font-bold text-crimson">{stats.totalDonations}</p>
          </div>
          <div className="bg-white shadow rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">🌐 Active Nodes</p>
            <p className="text-3xl font-bold text-crimson">{stats.activeNodes}/3</p>
          </div>
          <div className="bg-white shadow rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">🔒 Network</p>
            <p className="text-xl font-semibold text-gray-800 mt-1">{stats.consensusStatus || '—'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === i
                  ? 'bg-crimson text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>{tabs[activeTab].component}</div>
      </div>
    </div>
  )
}
