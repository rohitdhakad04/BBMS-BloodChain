import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function NodeStatus() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  const fetchNodes = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/blockchain/nodes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(response.data)
      setLastChecked(new Date().toLocaleTimeString())
    } catch (err) {}
    setIsLoading(false)
  }

  useEffect(() => {
    fetchNodes()
    const interval = setInterval(fetchNodes, 10000)
    return () => clearInterval(interval)
  }, [])

  const getNodeBorderColor = (node) => {
    if (node.status === 'offline') return 'border-red-400'
    if (node.isProposer) return 'border-blue-500'
    if (node.agrees) return 'border-green-500'
    return 'border-yellow-400'
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-8">
      <h2 className="font-display text-2xl text-crimson mb-6">🌐 Blockchain Network — Proof of Stake</h2>

      {data && (
        <>
          {data.consensus.reached ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center mb-6">
              <h3 className="font-display text-2xl text-green-700">✅ PoS Consensus Reached</h3>
              <p className="text-green-600 mt-1">
                {data.consensus.agreeingStake}/{data.consensus.totalStake} stake in agreement
              </p>
              <p className="text-sm text-gray-500 mt-2">Algorithm: {data.consensus.algorithm}</p>
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6 text-center mb-6">
              <h3 className="font-display text-2xl text-red-700">❌ Consensus Failed</h3>
              <p className="text-red-600 mt-1">
                Only {data.consensus.agreeingStake ?? 0}/{data.consensus.totalStake} stake — need {data.consensus.consensusThreshold}+
              </p>
              <p className="text-sm text-red-500 mt-2">⚠️ Data reliability cannot be guaranteed until consensus is restored</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {data.nodes.map(node => (
              <div key={node.id} className={`border-2 rounded-xl p-6 ${getNodeBorderColor(node)}`}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-display text-xl">Node {node.id}</h4>
                  {node.isProposer && node.status === 'online' && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">Proposer</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-mono mb-3">{node.url}</p>
                <div className="mb-3 flex items-center gap-2">
                  {node.status === 'online' ? (
                    <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">● Online</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full font-medium">● Offline</span>
                  )}
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    Stake: {node.stake}
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-800 mb-3">
                  Donations: {node.donationCount}
                </p>
                {node.status === 'offline' ? (
                  <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">— Unavailable</span>
                ) : node.agrees ? (
                  <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">✓ Attested</span>
                ) : (
                  <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">✗ Out of sync</span>
                )}
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Stake Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${data.consensus.reached ? 'bg-green-500' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(100, ((data.consensus.agreeingStake ?? 0) / data.consensus.totalStake) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.consensus.agreeingStake ?? 0}/{data.consensus.totalStake} stake agreed
                &nbsp;·&nbsp;threshold: {data.consensus.consensusThreshold}
              </p>
            </div>

            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Majority Count:</span> {data.consensus.majorityCount} donations
            </p>

            {data.consensus.proposer && (
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Block Proposer:</span>{' '}
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Node {data.consensus.proposer}</span>
              </p>
            )}

            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Attesting Nodes:</span>
              {data.consensus.agreeingNodes.map(n => (
                <span key={n} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Node {n}</span>
              ))}
            </div>

            {data.consensus.failedNodes.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Failed/Disagreeing:</span>
                {data.consensus.failedNodes.map(n => (
                  <span key={n} className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Node {n}</span>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-600">{data.consensus.message}</p>
          </div>
        </>
      )}

      <div className="mb-4">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-crimson text-sm font-medium hover:underline"
        >
          ℹ️ How does PoS consensus work?
        </button>
        {showInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-3 text-sm text-gray-700 leading-relaxed">
            Each blockchain node is a <strong>validator</strong> with a stake weight (Node 1: 40, Node 2: 35, Node 3: 25 — total: 100).
            When you donate blood, the highest-stake online validator is selected as the <strong>block proposer</strong>.
            Other validators act as <strong>attesters</strong>. A transaction is finalised only when the combined stake of
            agreeing validators reaches the consensus threshold (<strong>51/100</strong> — strict majority of stake).
            If too much stake is offline or disagreeing, the transaction is rejected. This is <strong>Proof of Stake</strong> consensus.
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Last checked: {lastChecked || '—'}</span>
        <button
          onClick={fetchNodes}
          disabled={isLoading}
          className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {isLoading ? 'Checking...' : 'Refresh Now'}
        </button>
      </div>
    </div>
  )
}
