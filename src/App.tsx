import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { format } from 'date-fns'
import { Sun, Moon, Wind, Droplets, Eye, Gauge } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast'

interface WeatherData {
  name: string
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
  visibility: number
  dt: number
}

interface ForecastData {
  list: Array<{
    dt: number
    main: {
      temp: number
    }
    weather: Array<{
      icon: string
      description: string
    }>
  }>
}

function MapUpdater({ coords }: { coords: [number, number] | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (coords) {
      map.setView(coords, 10)
    }
  }, [coords, map])
  
  return null
}

export default function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCoords([latitude, longitude])
          fetchWeather(latitude, longitude)
          fetchForecast(latitude, longitude)
        },
        (err) => {
          setError('Unable to retrieve your location. Please search for a city.')
        }
      )
    } else {
      setError('Geolocation is not supported by your browser. Please search for a city.')
    }
  }, [])

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${WEATHER_API_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
      setWeather(response.data)
    } catch (err) {
      setError('Unable to fetch weather data. Please try again.')
    }
    setLoading(false)
  }

  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const response = await axios.get(`${FORECAST_API_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
      setForecast(response.data)
    } catch (err) {
      console.error('Unable to fetch forecast data', err)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const geoResponse = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`)
      if (geoResponse.data.length > 0) {
        const { lat, lon } = geoResponse.data[0]
        setCoords([lat, lon])
        await fetchWeather(lat, lon)
        await fetchForecast(lat, lon)
      } else {
        setError('City not found. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
    setLoading(false)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold"><img src="/favicon.png" style={{ width: '60px', height: '60px' }} alt="Icon" /> Advanced Weather App</h1>
          <button onClick={toggleDarkMode} className="p-2 rounded-full bg-gray-200 text-gray-800">
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex">
            <input
              type="text"
              placeholder="Enter city name"
              className="flex-grow px-4 py-2 text-gray-700 bg-white rounded-l-lg focus:outline-none"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-r-lg hover:bg-blue-700 focus:outline-none"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </form>

        {error && <p className="text-red-500 text-center mb-4 bg-red-100 p-2 rounded">{error}</p>}

        {weather && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`md:col-span-2 rounded-lg p-6 ${darkMode ? 'bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg' : 'bg-white shadow-lg'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold">{weather.name}</h2>
                <p className="text-lg">{format(new Date(weather.dt * 1000), 'EEEE, h:mm a')}</p>
              </div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-6xl font-bold">{Math.round(weather.main.temp)}°C</p>
                  <p className="text-xl capitalize">{weather.weather[0].description}</p>
                  <p className="text-lg">Feels like {Math.round(weather.main.feels_like)}°C</p>
                </div>
                <img
                  src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                  alt={weather.weather[0].description}
                  className="w-32 h-32"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Wind className="mr-2" />
                  <div>
                    <p className="text-sm">Wind</p>
                    <p className="font-semibold">{weather.wind.speed} km/h</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Droplets className="mr-2" />
                  <div>
                    <p className="text-sm">Humidity</p>
                    <p className="font-semibold">{weather.main.humidity}%</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Eye className="mr-2" />
                  <div>
                    <p className="text-sm">Visibility</p>
                    <p className="font-semibold">{weather.visibility / 1000} km</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Gauge className="mr-2" />
                  <div>
                    <p className="text-sm">Pressure</p>
                    <p className="font-semibold">{weather.main.pressure} mb</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg' : 'bg-white shadow-lg'}`}>
              {coords && (
                <MapContainer 
                  center={coords} 
                  zoom={10} 
                  style={{ height: '100%', minHeight: '300px' }}
                  ref={mapRef}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={coords}>
                    <Popup>{weather.name}</Popup>
                  </Marker>
                  <MapUpdater coords={coords} />
                </MapContainer>
              )}
            </div>
          </div>
        )}

        {forecast && (
          <div className={`mt-8 rounded-lg p-6 ${darkMode ? 'bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg' : 'bg-white shadow-lg'}`}>
            <h2 className="text-2xl font-bold mb-4">5-Day Forecast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {forecast.list.filter((_, index) => index % 8 === 0).map((day) => (
                <div key={day.dt} className="text-center">
                  <p className="font-semibold">{format(new Date(day.dt * 1000), 'EEE')}</p>
                  <img
                    src={`http://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                    alt={day.weather[0].description}
                    className="w-12 h-12 mx-auto"
                  />
                  <p className="text-sm">{Math.round(day.main.temp)}°C</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}