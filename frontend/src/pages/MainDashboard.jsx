import React, { useState, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { AlertTriangle, MapIcon, Route, FileText, Activity, Shield, Search, X, Plus, Bell, MapPin, Clock, Navigation, TrendingUp, CheckCircle, AlertCircle, Eye, Menu, ChevronLeft } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import api from '../services/api'

// Import Components
import Navbar from "../components/Common/Navbar";
import Sidebar from "../components/Common/Sidebar";

import LeafletMap from "../components/Map/LeafletMap";
import ReportDetailPanel from "../components/Reports/ReportDetailPanel";

import StatsPanel from '../components/Dashboard/StatsPanel'
import AlertsPanel from '../components/Dashboard/AlertsPanel'
import LiveUpdates from '../components/Dashboard/LiveUpdates'
import RouteAnalysisIntegration from '../components/Route/RouteAnalysisIntegration'
import AccidentReportForm from '../components/Reports/AccidentReportForm'
import PreventionStrategies from './PreventionStrategies'
import RiskAndPreventionDashboard from './RiskAndPreventionDashboard'
import NotificationAlertPanel from '../components/Dashboard/NotificationAlertPanel'
import NotificationSettings from './NotificationSettings'
import NotificationToast from '../components/Common/NotificationToast'

const mapContainerStyle = { width: '100%', height: '100%' }
const defaultCenter = { lat: 10.8505, lng: 76.2711 }

export default function MainDashboard({ onLogout }) {

  const {
    accidents,
    alerts,
    nearMissEvents,
    wsConnected,
    selectedAccident,
    setSelectedAccident,
    submitAccidentReport,
    predictRisk,
    notifications,
    dismissNotification,
    addNotification,
  } = useApp()

  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportLocation, setReportLocation] = useState(null)
  const [riskPrediction, setRiskPrediction] = useState(null)
  const [selectedHotspot, setSelectedHotspot] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accidentImages, setAccidentImages] = useState({})

  // Risk Prediction Handler
  const handleRiskPrediction = async (conditions) => {
    try {
      const result = await predictRisk(conditions)
      setRiskPrediction(result)
    } catch (error) {
      console.error('Risk prediction failed:', error)
      alert('Failed to predict risk. Please try again.')
    }
  }

  // Accident Report Handler
  const handleAccidentReport = async (reportData) => {
    try {
      if (reportData.images && reportData.images.length > 0) {
        const locationKey = `${reportData.latitude.toFixed(4)}_${reportData.longitude.toFixed(4)}`
        setAccidentImages(prev => ({
          ...prev,
          [locationKey]: reportData.images
        }))
      }
      const response = await submitAccidentReport(reportData)
      return response
    } catch (error) {
      console.error('Failed to submit report:', error)
      alert('Failed to submit accident report. Please try again.')
      throw error
    }
  }

  console.log('🔍 MainDashboard Data Check:', {
    notifications,
    notificationsLength: notifications?.length,
    alerts,
    alertsLength: alerts?.length,
    activeTab
  })

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden relative">
      {/* Mobile Hamburger Button — z-[9999] to stay above Leaflet map layers */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-2 hover:bg-gray-700 transition"
        style={{ zIndex: 9999 }}
        title="Toggle Menu"
      >
        <Menu size={24} className="text-white" />
      </button>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 transition-opacity"
          style={{ zIndex: 9998 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-screen transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ zIndex: sidebarOpen ? 9999 : undefined }}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          wsConnected={wsConnected}
          onItemClick={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        {/* Top Navbar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />

        {/* Content Views */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              accidents={accidents}
              alerts={alerts}
              nearMissEvents={nearMissEvents}
              notifications={notifications}
            />
          )}

          {activeTab === 'map' && (
            <MapView
              accidents={accidents}
              alerts={alerts}
              selectedAccident={selectedAccident}
              setSelectedAccident={setSelectedAccident}
              selectedHotspot={selectedHotspot}
              setSelectedHotspot={setSelectedHotspot}
              setReportLocation={setReportLocation}
              setShowReportForm={setShowReportForm}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'route' && (
            <RouteAnalysisView />
          )}

          {activeTab === 'prediction' && (
            <RiskAndPreventionDashboard />
          )}

          {activeTab === 'alerts' && (
            <NotificationAlertPanel
              notifications={notifications}
              alerts={alerts}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'notification-settings' && (
            <NotificationSettings />
          )}

          {activeTab === 'reports' && (
            <ReportsView accidents={accidents} accidentImages={accidentImages} />
          )}

          {activeTab === 'prevention' && (
            <PreventionStrategies />
          )}
        </div>
      </div>

      {/* Accident Report Modal — highest z-index to sit above map, buttons bar, and slide panel */}
      {showReportForm && (
        <div className="fixed inset-0" style={{ zIndex: 99999 }}>
          <AccidentReportForm
            location={reportLocation}
            onClose={() => {
              setShowReportForm(false)
              setReportLocation(null)
            }}
            onSubmit={handleAccidentReport}
          />
        </div>
      )}

      {/* Notification Toast — above everything */}
      <div style={{ zIndex: 99999, position: 'relative' }}>
        <NotificationToast
          notifications={notifications}
          onDismiss={dismissNotification}
        />
      </div>
    </div>
  )
}

// ==================== Dashboard View ====================
function DashboardView({ accidents, alerts, nearMissEvents, notifications }) {
  const severityCounts = {
    Minor: accidents.filter(a => a.severity === 'Minor').length,
    Major: accidents.filter(a => a.severity === 'Major').length,
    Fatal: accidents.filter(a => a.severity === 'Fatal').length
  }

  const pieData = [
    { name: 'Minor', value: severityCounts.Minor, color: '#10B981' },
    { name: 'Major', value: severityCounts.Major, color: '#F59E0B' },
    { name: 'Fatal', value: severityCounts.Fatal, color: '#EF4444' }
  ]

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Stats Panel */}
      <StatsPanel
        accidents={accidents}
        alerts={alerts}
        nearMissEvents={nearMissEvents}
      />

      {/* Charts and Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Severity Distribution Chart */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold mb-4 text-white">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Accidents List */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold mb-4 text-white">Recent Accidents</h3>
          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {accidents.slice(0, 5).map(accident => (
              <div key={accident.id} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          accident.severity === 'Fatal' ? 'bg-red-500' :
                          accident.severity === 'Major' ? 'bg-orange-500' : 'bg-green-500'
                        } text-white`}
                      >
                        {accident.severity}
                      </span>
                      {accident.verified && (
                        <span className="px-2 py-1 rounded text-xs bg-blue-500 text-white">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                      {accident.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-400 flex-wrap">
                      <span>{accident.weather}</span>
                      <span>{accident.road_condition}</span>
                      <span>{new Date(accident.reported_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {accidents.length === 0 && (
              <p className="text-gray-400 text-center py-8">No accidents reported yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Alerts and Live Updates Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <AlertsPanel alerts={alerts} />
        <LiveUpdates
          accidents={accidents}
          alerts={alerts}
          notifications={notifications}
        />
      </div>
    </div>
  )
}

// ==================== Map View ====================
function MapView({ accidents, alerts, selectedAccident, setSelectedAccident, selectedHotspot, setSelectedHotspot, setReportLocation, setShowReportForm, setActiveTab }) {
  const [mapType, setMapType] = useState('hotspot')
  const [showPreventionStrategy, setShowPreventionStrategy] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState(null)
  const [filteredHotspots, setFilteredHotspots] = useState([])
  const [filteredAccidents, setFilteredAccidents] = useState(accidents || [])
  const [isSearching, setIsSearching] = useState(false)
  const [dynamicHotspots, setDynamicHotspots] = useState([])
  // Mobile: controls whether the sidebar panel is shown or collapsed
  const [showSidePanel, setShowSidePanel] = useState(false)
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
  const hasValidGoogleKey = googleMapsApiKey && googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY'

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const generateDynamicHotspots = (accidentList) => {
    if (!accidentList || accidentList.length === 0) return []
    const clusterRadius = 0.5
    const locationTolerance = 0.0001
    const clusters = []
    const processed = new Set()
    let nextId = 1
    let clusterCount = 1

    const locationMap = {}
    accidentList.forEach((accident, idx) => {
      const locKey = `${Math.round(accident.latitude / locationTolerance) * locationTolerance},${Math.round(accident.longitude / locationTolerance) * locationTolerance}`
      if (!locationMap[locKey]) locationMap[locKey] = []
      locationMap[locKey].push(idx)
    })

    Object.entries(locationMap).forEach(([locKey, indices]) => {
      if (indices.length >= 2) {
        const cluster = indices.map(idx => accidentList[idx])
        const fatalCount = cluster.filter(a => a.severity === 'Fatal').length
        const majorCount = cluster.filter(a => a.severity === 'Major').length
        const riskLevel = fatalCount > 0 ? 'High' : majorCount >= 1 ? 'Medium' : 'Low'
        clusters.push({
          id: nextId++,
          name: `Hotspot (Same Spot) #${clusterCount}`,
          lat: cluster[0].latitude,
          lng: cluster[0].longitude,
          riskLevel,
          accidents: cluster.length,
          fatal: fatalCount,
          major: majorCount,
          isDynamic: true,
          type: 'sameSpot'
        })
        indices.forEach(idx => processed.add(idx))
        clusterCount++
      }
    })

    accidentList.forEach((accident, idx) => {
      if (processed.has(idx)) return
      const cluster = [accident]
      processed.add(idx)
      accidentList.forEach((other, otherIdx) => {
        if (processed.has(otherIdx) || idx === otherIdx) return
        const distance = calculateDistance(accident.latitude, accident.longitude, other.latitude, other.longitude)
        if (distance <= clusterRadius) {
          cluster.push(other)
          processed.add(otherIdx)
        }
      })
      if (cluster.length > 2) {
        const avgLat = cluster.reduce((sum, acc) => sum + acc.latitude, 0) / cluster.length
        const avgLng = cluster.reduce((sum, acc) => sum + acc.longitude, 0) / cluster.length
        const fatalCount = cluster.filter(a => a.severity === 'Fatal').length
        const majorCount = cluster.filter(a => a.severity === 'Major').length
        const riskLevel = fatalCount > 0 ? 'High' : majorCount > 1 ? 'Medium' : 'Low'
        clusters.push({
          id: nextId++,
          name: `Hotspot (Cluster) #${clusterCount}`,
          lat: avgLat,
          lng: avgLng,
          riskLevel,
          accidents: cluster.length,
          fatal: fatalCount,
          major: majorCount,
          isDynamic: true,
          type: 'cluster'
        })
        clusterCount++
      }
    })
    return clusters
  }

  const getCombinedHotspots = () => [...dynamicHotspots]

  const filterHotspotsWithinRadius = (centerLat, centerLng, radiusKm = 5) => {
    return getCombinedHotspots().filter(hotspot => {
      return calculateDistance(centerLat, centerLng, hotspot.lat, hotspot.lng) <= radiusKm
    }).map(hotspot => ({
      ...hotspot,
      distance: calculateDistance(centerLat, centerLng, hotspot.lat, hotspot.lng)
    }))
  }

  React.useEffect(() => {
    if (accidents && accidents.length > 0) {
      const generated = generateDynamicHotspots(accidents)
      setDynamicHotspots(generated)
      setFilteredHotspots(getCombinedHotspots())
    }
  }, [accidents])

  React.useEffect(() => {
    if (!searchLocation) setFilteredAccidents(accidents || [])
  }, [accidents, searchLocation])

  const filterAccidentsWithinRadius = (centerLat, centerLng, radiusKm = 5) => {
    return accidents.filter(accident => {
      return calculateDistance(centerLat, centerLng, accident.latitude, accident.longitude) <= radiusKm
    })
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const query = searchQuery.trim().toLowerCase()
      if (['my location', 'current location', 'here', 'my current location'].includes(query)) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              const location = { lat: latitude, lng: longitude, name: 'Your Current Location' }
              setSearchLocation(location)
              setFilteredHotspots(filterHotspotsWithinRadius(latitude, longitude, 5))
              setFilteredAccidents(filterAccidentsWithinRadius(latitude, longitude, 5))
              setIsSearching(false)
            },
            (error) => {
              alert('Unable to access your location.')
              setIsSearching(false)
            }
          )
        } else {
          alert('Geolocation is not supported.')
          setIsSearching(false)
        }
      } else {
        let location = null

        // Primary: Nominatim with required headers
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
            { headers: { 'Accept': 'application/json', 'Accept-Language': 'en' }, mode: 'cors' }
          )
          if (response.ok) {
            const data = await response.json()
            if (data && data.length > 0) {
              location = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name }
            }
          }
        } catch (nominatimErr) {
          console.warn('Nominatim failed, trying Photon fallback:', nominatimErr)
        }

        // Fallback: Photon geocoder (CORS-friendly, OpenStreetMap-based)
        if (!location) {
          try {
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=1`)
            if (res.ok) {
              const json = await res.json()
              if (json.features && json.features.length > 0) {
                const feat = json.features[0]
                const [lng, lat] = feat.geometry.coordinates
                const props = feat.properties
                const name = [props.name, props.city, props.state, props.country].filter(Boolean).join(', ')
                location = { lat, lng, name }
              }
            }
          } catch (photonErr) {
            console.warn('Photon fallback also failed:', photonErr)
          }
        }

        if (location) {
          setSearchLocation(location)
          setFilteredHotspots(filterHotspotsWithinRadius(location.lat, location.lng, 5))
          setFilteredAccidents(filterAccidentsWithinRadius(location.lat, location.lng, 5))
        } else {
          alert('Location not found. Try a more specific name, or type "my location" to use GPS.')
        }
        setIsSearching(false)
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please check your internet connection and try again.')
      setIsSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchLocation(null)
    setFilteredHotspots(getCombinedHotspots())
    setFilteredAccidents(accidents)
  }

  const onMapClick = (e) => {
    setReportLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() })
    setShowReportForm(true)
  }

  const onAccidentSelect = (accident) => setSelectedAccident(accident)

  const onHotspotSelect = (hotspot) => {
    setSelectedHotspot(hotspot)
    // On mobile, open the side panel when a hotspot is selected
    if (hotspot) setShowSidePanel(true)
  }

  const handleReportAccidentNow = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setReportLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
          setShowReportForm(true)
        },
        () => alert('Unable to access your location.')
      )
    } else {
      alert('Geolocation is not supported.')
    }
  }

  return (
    <div className="h-full flex flex-col md:flex-row relative">

      {/* ── Mobile: floating action buttons — above Leaflet ── */}
      <div className="md:hidden flex items-center gap-2 p-3 bg-gray-800 border-b border-gray-700" style={{ zIndex: 9997, position: 'relative' }}>
        <button
          onClick={() => setShowSidePanel(true)}
          className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Search size={14} /> Search / Hotspots
        </button>
        <button
          onClick={handleReportAccidentNow}
          className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
        >
          <AlertCircle size={14} /> Report Now
        </button>
      </div>

      {/* ── Mobile slide-up panel overlay — must be above Leaflet (z ~400) ── */}
      {showSidePanel && (
        <div className="md:hidden fixed inset-0 flex flex-col justify-end" style={{ zIndex: 9999 }}>
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSidePanel(false)} />
          {/* panel */}
          <div className="relative bg-gray-800 rounded-t-2xl max-h-[80vh] overflow-y-auto border-t border-gray-700" style={{ zIndex: 10000 }}>
            {/* drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
              <span className="text-white font-semibold text-sm">
                {selectedHotspot ? 'Hotspot Details' : 'Search & Hotspots'}
              </span>
              <button onClick={() => setShowSidePanel(false)} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <SidePanelContent
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                handleClearSearch={handleClearSearch}
                isSearching={isSearching}
                searchLocation={searchLocation}
                filteredHotspots={filteredHotspots}
                handleReportAccidentNow={handleReportAccidentNow}
                selectedHotspot={selectedHotspot}
                setSelectedHotspot={setSelectedHotspot}
                showPreventionStrategy={showPreventionStrategy}
                setShowPreventionStrategy={setShowPreventionStrategy}
                setActiveTab={setActiveTab}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Left Sidebar ── */}
      <div className="hidden md:block w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto flex-shrink-0">
        <SidePanelContent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          handleClearSearch={handleClearSearch}
          isSearching={isSearching}
          searchLocation={searchLocation}
          filteredHotspots={filteredHotspots}
          handleReportAccidentNow={handleReportAccidentNow}
          selectedHotspot={selectedHotspot}
          setSelectedHotspot={setSelectedHotspot}
          showPreventionStrategy={showPreventionStrategy}
          setShowPreventionStrategy={setShowPreventionStrategy}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* ── Map ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-[300px] md:min-h-0 p-2 sm:p-4">
          <div className="h-full rounded-lg overflow-hidden shadow-2xl" style={{ minHeight: '300px' }}>
            <LeafletMap
              accidents={searchLocation ? filteredAccidents : accidents}
              alerts={alerts}
              hotspots={searchLocation ? filteredHotspots : getCombinedHotspots()}
              selectedAccident={selectedAccident}
              selectedHotspot={selectedHotspot}
              onAccidentSelect={onAccidentSelect}
              onHotspotSelect={onHotspotSelect}
              onMapClick={onMapClick}
              searchLocation={searchLocation}
              searchRadius={5000}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Extracted Side Panel Content ====================
function SidePanelContent({
  searchQuery, setSearchQuery, handleSearch, handleClearSearch,
  isSearching, searchLocation, filteredHotspots, handleReportAccidentNow,
  selectedHotspot, setSelectedHotspot, showPreventionStrategy, setShowPreventionStrategy,
  setActiveTab
}) {
  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        <div className="mb-3 flex items-center gap-2">
          <Search size={16} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-cyan-400">Search Location</h3>
        </div>
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search location... or type 'my location'"
              className="w-full px-3 py-2 pl-9 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition"
            />
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition shadow-lg shadow-cyan-500/20 disabled:shadow-none flex items-center justify-center gap-2 text-sm"
          >
            <Search size={14} />
            {isSearching ? 'Searching...' : 'Find Hotspots (5km)'}
          </button>
          {searchLocation && (
            <button
              onClick={handleClearSearch}
              className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm"
            >
              <X size={14} /> Clear Search
            </button>
          )}
        </div>
        {searchLocation && (
          <div className="mt-3 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-xs text-cyan-400 font-medium">
              📍 {filteredHotspots.length} hotspot{filteredHotspots.length !== 1 ? 's' : ''} found within 5km
            </p>
          </div>
        )}
        <button
          onClick={handleReportAccidentNow}
          className="w-full px-4 py-3 mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg font-semibold transition shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 text-sm"
        >
          <AlertCircle size={16} /> Report Accident Now
        </button>
      </div>

      {/* Hotspot Details */}
      {selectedHotspot ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Hotspot Details</h3>
            <button onClick={() => setSelectedHotspot(null)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {selectedHotspot.isDynamic && (
              <div className={`rounded-lg p-3 border ${
                selectedHotspot.type === 'sameSpot'
                  ? 'bg-purple-900/30 border-purple-500/50'
                  : 'bg-cyan-900/30 border-cyan-500/50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${selectedHotspot.type === 'sameSpot' ? 'text-purple-400' : 'text-cyan-400'}`}>
                    {selectedHotspot.type === 'sameSpot' ? '🎯' : '📍'}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${selectedHotspot.type === 'sameSpot' ? 'text-purple-300' : 'text-cyan-300'}`}>
                      {selectedHotspot.type === 'sameSpot' ? 'Auto-Generated: Same Spot' : 'Auto-Generated: Cluster'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedHotspot.type === 'sameSpot'
                        ? 'Multiple reports at the same exact location.'
                        : 'Created from a cluster of nearby accidents.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-base font-semibold text-white mb-3">{selectedHotspot.name}</h4>
              <div className="space-y-2 text-sm">
                {[
                  ['Risk Level', <span className={`font-semibold ${selectedHotspot.riskLevel === 'High' ? 'text-red-400' : selectedHotspot.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>{selectedHotspot.riskLevel}</span>],
                  ['Total Accidents', <span className="text-white font-semibold">{selectedHotspot.accidents}</span>],
                  ['Fatal', <span className="text-red-400 font-semibold">{selectedHotspot.fatal}</span>],
                  ['Major', <span className="text-orange-400 font-semibold">{selectedHotspot.major}</span>],
                  ['Minor', <span className="text-green-400 font-semibold">{selectedHotspot.accidents - selectedHotspot.fatal - selectedHotspot.major}</span>],
                ].map(([label, val], i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-400">{label}:</span>
                    {val}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-base font-semibold text-white mb-3 flex items-center">
                <MapPin size={16} className="mr-2" /> Location Details
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400 block mb-1">Coordinates:</span>
                  <div className="bg-gray-600 rounded p-2 font-mono text-xs">
                    <div>Lat: {selectedHotspot.lat.toFixed(6)}</div>
                    <div>Lng: {selectedHotspot.lng.toFixed(6)}</div>
                  </div>
                </div>
                {[['Location Type', 'Road Junction'], ['Area', 'Urban'], ['Traffic Density', <span className="text-yellow-400 font-semibold">High</span>]].map(([l, v], i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-400">{l}:</span>
                    {typeof v === 'string' ? <span className="text-white font-semibold">{v}</span> : v}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-base font-semibold text-white mb-3 flex items-center">
                <TrendingUp size={16} className="mr-2" /> Statistics
              </h4>
              <div className="space-y-2 text-sm">
                {[
                  ['Accidents/Month', <span className="text-white font-semibold">{(selectedHotspot.accidents / 12).toFixed(1)}</span>],
                  ['Fatality Rate', <span className="text-red-400 font-semibold">{((selectedHotspot.fatal / selectedHotspot.accidents) * 100).toFixed(1)}%</span>],
                  ['Major Injury Rate', <span className="text-orange-400 font-semibold">{((selectedHotspot.major / selectedHotspot.accidents) * 100).toFixed(1)}%</span>],
                  ['Trend', <span className="text-red-400 font-semibold">↗ Increasing</span>],
                ].map(([label, val], i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-400">{label}:</span>
                    {val}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('map')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition font-medium text-sm"
              >
                View Integrated Map
              </button>
              <button
                onClick={() => window.open(`https://www.google.com/maps?q=${selectedHotspot.lat},${selectedHotspot.lng}`, '_blank')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition font-medium text-sm"
              >
                View on Google Maps
              </button>
              <button
                onClick={() => setShowPreventionStrategy(!showPreventionStrategy)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg transition font-medium text-sm"
              >
                {showPreventionStrategy ? 'Hide Prevention Strategy' : 'Show Prevention Strategy'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 mt-4">
          <MapPin size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-base font-medium mb-1">Select a Hotspot</p>
          <p className="text-sm">Click on any hotspot marker on the map to view details here</p>
        </div>
      )}

      {/* Prevention Strategy Panel */}
      {showPreventionStrategy && selectedHotspot && (
        <div className="bg-gray-700 rounded-lg p-4 border border-orange-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center">
              <Shield size={18} className="mr-2 text-orange-400" /> Prevention Strategies
            </h3>
            <button onClick={() => setShowPreventionStrategy(false)} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-600 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-orange-400 mb-2">Immediate Actions</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Install additional traffic signals and signage</li>
                <li>• Deploy speed cameras and enforcement</li>
                <li>• Improve road lighting and visibility</li>
                <li>• Add pedestrian crossings and barriers</li>
              </ul>
            </div>
            <div className="bg-gray-600 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-orange-400 mb-2">Long-term Solutions</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Road infrastructure redesign</li>
                <li>• Traffic flow optimization</li>
                <li>• Public awareness campaigns</li>
                <li>• Regular safety audits</li>
              </ul>
            </div>
            <div className="bg-gray-600 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-orange-400 mb-2">Expected Impact</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-400">60%</div>
                  <div className="text-gray-400">Accident Reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-400">3–6</div>
                  <div className="text-gray-400">Months</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Route Analysis View ====================
function RouteAnalysisView() {
  return <RouteAnalysisIntegration />
}

// ==================== Risk Prediction View ====================
function RiskPredictionView({ handleRiskPrediction, riskPrediction }) {
  const [formData, setFormData] = useState({
    speed: 60,
    weather: 'Clear',
    vehicle_type: 'Car',
    road_condition: 'Dry',
    visibility: 'Good',
    time_of_day: 'Afternoon',
    traffic_density: 'Medium'
  })

  const onSubmit = (e) => {
    e.preventDefault()
    handleRiskPrediction(formData)
  }

  const getRiskColor = (score) => {
    if (score >= 70) return '#EF4444'
    if (score >= 40) return '#F59E0B'
    return '#10B981'
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold mb-6 text-white flex items-center gap-2">
          <AlertTriangle className="text-orange-500" /> Predict Accident Risk
        </h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2 text-gray-400">Speed (km/h)</label>
            <input
              type="number"
              value={formData.speed}
              onChange={(e) => setFormData({ ...formData, speed: Number(e.target.value) })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              min="0" max="200"
            />
          </div>
          {[
            ['weather', 'Weather', ['Clear', 'Rain', 'Fog', 'Snow']],
            ['vehicle_type', 'Vehicle Type', ['Car', 'Truck', 'Motorcycle', 'Bus']],
            ['road_condition', 'Road Condition', ['Dry', 'Wet', 'Icy', 'Damaged']],
            ['visibility', 'Visibility', ['Good', 'Moderate', 'Poor']],
            ['time_of_day', 'Time of Day', ['Morning', 'Afternoon', 'Evening', 'Night']],
            ['traffic_density', 'Traffic Density', ['Low', 'Medium', 'High']],
          ].map(([key, label, options]) => (
            <div key={key}>
              <label className="block text-sm mb-2 text-gray-400">{label}</label>
              <select
                value={formData[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="sm:col-span-2">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-semibold">
              Predict Risk
            </button>
          </div>
        </form>
      </div>

      {riskPrediction && (
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg sm:text-xl font-semibold text-white">Prediction Results</h3>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Risk Score</div>
              <div className="text-4xl sm:text-5xl font-bold" style={{ color: getRiskColor(riskPrediction.risk_score) }}>
                {riskPrediction.risk_score}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {[
              ['Predicted Severity', riskPrediction.severity],
              ['Confidence', `${riskPrediction.confidence}%`],
              ['Most Likely', Object.entries(riskPrediction.probabilities).reduce((a, b) => a[1] > b[1] ? a : b)[0]],
            ].map(([label, val]) => (
              <div key={label} className="bg-gray-700 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">{label}</div>
                <div className="text-xl sm:text-2xl font-bold text-white">{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Reports View ====================
function ReportsView({ accidents, accidentImages = {} }) {
  const [filter, setFilter] = useState('all')
  const [notificationRadius, setNotificationRadius] = useState(5)
  const [notificationSent, setNotificationSent] = useState(false)
  const [notifyingId, setNotifyingId] = useState(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const { submitAccidentReport, addNotification } = useApp()

  const filteredAccidents = accidents.filter(acc => {
    if (filter === 'all') return true
    return acc.severity === filter
  })

  const handleNotifyNearby = async (reportId) => {
    setNotifyingId(reportId)
    try {
      const selectedAccident = accidents.find(a => a.id === reportId)
      if (!selectedAccident) { alert('Accident not found'); return }
      const recipientsCount = Math.floor(Math.random() * 50) + 10
      const notificationMessage = {
        type: 'accident_alert',
        severity: selectedAccident.severity,
        title: `${selectedAccident.severity} Accident Alert`,
        message: `Accident at: ${selectedAccident.latitude.toFixed(4)}, ${selectedAccident.longitude.toFixed(4)}. Weather: ${selectedAccident.weather}. Exercise caution.`,
        location: `Lat: ${selectedAccident.latitude.toFixed(4)}, Lng: ${selectedAccident.longitude.toFixed(4)}`,
        timestamp: new Date().toISOString(),
        radius_km: notificationRadius,
        recipients_notified: recipientsCount,
        latitude: selectedAccident.latitude,
        longitude: selectedAccident.longitude
      }
      setNotificationSent(true)
      try {
        await api.createAlert(notificationMessage)
        if (addNotification) addNotification(`Notification dispatched within ${notificationRadius} km`, 'success')
      } catch (err) {
        if (addNotification) addNotification('Failed to dispatch notification', 'error')
      }
      setTimeout(() => setNotificationSent(false), 3000)
    } catch (error) {
      if (addNotification) addNotification('Failed to send notifications', 'error')
      else alert('Failed to send notifications')
    } finally {
      setNotifyingId(null)
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg sm:text-xl font-semibold text-white">Accident Report Management</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-auto bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">All Severities</option>
          <option value="Minor">Minor</option>
          <option value="Major">Major</option>
          <option value="Fatal">Fatal</option>
        </select>
      </div>

      {/* Mobile Card List */}
      <div className="sm:hidden space-y-3">
        {filteredAccidents.map((accident) => (
          <div key={accident.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">#{accident.id}</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  accident.severity === 'Fatal' ? 'bg-red-500' :
                  accident.severity === 'Major' ? 'bg-orange-500' : 'bg-green-500'
                } text-white`}>
                  {accident.severity}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${accident.verified ? 'bg-blue-600' : 'bg-gray-600'} text-white`}>
                  {accident.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-3">
              <div><span className="text-gray-500">Date: </span>{new Date(accident.reported_at).toLocaleDateString()}</div>
              <div><span className="text-gray-500">Weather: </span>{accident.weather}</div>
              <div className="col-span-2"><span className="text-gray-500">Road: </span>{accident.road_condition}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedReport(accident); setShowDetailPanel(true) }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded transition text-xs font-medium"
              >
                View Evidence
              </button>
              <button
                onClick={() => handleNotifyNearby(accident.id)}
                disabled={notifyingId === accident.id}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1.5 rounded transition text-xs font-medium"
              >
                {notifyingId === accident.id ? 'Notifying...' : 'Notify Nearby'}
              </button>
            </div>
          </div>
        ))}
        {filteredAccidents.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No accidents found matching the filter criteria</div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                {['ID', 'Severity', 'Date', 'Weather', 'Road Condition', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAccidents.map((accident) => (
                <tr key={accident.id} className="hover:bg-gray-700/50 transition">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{accident.id}</td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      accident.severity === 'Fatal' ? 'bg-red-500' :
                      accident.severity === 'Major' ? 'bg-orange-500' : 'bg-green-500'
                    } text-white`}>
                      {accident.severity}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(accident.reported_at).toLocaleDateString()}</td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{accident.weather}</td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{accident.road_condition}</td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${accident.verified ? 'bg-blue-600' : 'bg-gray-600'} text-white`}>
                      {accident.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedReport(accident); setShowDetailPanel(true) }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition text-xs"
                      >
                        View Evidence
                      </button>
                      <button
                        onClick={() => handleNotifyNearby(accident.id)}
                        disabled={notifyingId === accident.id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded transition text-xs"
                      >
                        {notifyingId === accident.id ? 'Notifying...' : 'Notify Nearby'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAccidents.length === 0 && (
            <div className="text-center py-8 text-gray-400">No accidents found matching the filter criteria</div>
          )}
        </div>
      </div>

      {/* Report Detail Panel */}
      {showDetailPanel && selectedReport && (
        <ReportDetailPanel
          report={selectedReport}
          onClose={() => { setShowDetailPanel(false); setSelectedReport(null) }}
          onDelete={async (reportId) => {
            try {
              await fetch(`/api/reports/${reportId}`, { method: 'DELETE' })
              addNotification('Report deleted successfully', 'success')
              setShowDetailPanel(false)
              setSelectedReport(null)
              window.location.reload()
            } catch (error) {
              addNotification('Failed to delete report', 'error')
            }
          }}
        />
      )}
    </div>
  )
}