// src/components/WeatherCard.jsx
import React, { useState, useEffect } from "react";
import "./WeatherCard.css";

const getTheme = (main) => {
  if (!main) return "mist";
  const m = main.toLowerCase();
  if (m.includes("clear")) return "sunny";
  if (m.includes("cloud")) return "cloudy";
  if (m.includes("rain") || m.includes("drizzle")) return "rain";
  if (m.includes("snow")) return "snow";
  if (m.includes("thunder") || m.includes("storm")) return "thunder";
  return "mist";
};

const WeatherAnimation = ({ theme }) => {
  if (theme === "rain") {
    return (
      <div className="wc-anim rain" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="drop"
            style={{ left: `${i * 8}%`, animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    );
  }
  if (theme === "snow") {
    return (
      <div className="wc-anim snow" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="flake"
            style={{ left: `${(i * 10) % 100}%`, animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    );
  }
  if (theme === "cloudy") {
    return (
      <div className="wc-anim clouds" aria-hidden="true">
        <div className="cloud c1" />
        <div className="cloud c2" />
      </div>
    );
  }
  if (theme === "thunder") {
    return (
      <div className="wc-anim thunder" aria-hidden="true">
        <div className="cloud c1" />
        <div className="flash" />
      </div>
    );
  }
  if (theme === "sunny") {
    return (
      <div className="wc-anim sunny" aria-hidden="true">
        <div className="sun" />
      </div>
    );
  }
  return <div className="wc-anim mist" aria-hidden="true" />;
};

const DarkToggle = ({ dark, setDark }) => {
  return (
    <button
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`wc-toggle ${dark ? "dark" : "light"}`}
      onClick={() => setDark(!dark)}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
};

const WeatherCard = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("mist");
  const [dark, setDark] = useState(false);

  const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

  // load dark preference
  useEffect(() => {
    const saved = localStorage.getItem("wc_dark_mode");
    if (saved === "1") setDark(true);
  }, []);

  // update theme when weather changes
  useEffect(() => {
    if (weather) {
      const main = weather.descriptionMain || weather.description;
      setTheme(getTheme(weather.main || main));
    }
  }, [weather]);

  // persist dark mode preference
  useEffect(() => {
    localStorage.setItem("wc_dark_mode", dark ? "1" : "0");
  }, [dark]);

  const fetchWeather = async (q) => {
    if (!q) {
      setError("Please enter a city name.");
      return;
    }
    if (!API_KEY) {
      setError("Missing API key. Add VITE_OPENWEATHER_KEY to .env.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        q
      )}&units=metric&appid=${API_KEY}`;

      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404) throw new Error("City not found.");
        if (res.status === 401) throw new Error("Invalid API key (401).");
        throw new Error("Failed to fetch weather.");
      }

      const data = await res.json();

      const simplified = {
        name: data.name,
        country: data.sys?.country,
        temp: data.main?.temp,
        feels_like: data.main?.feels_like,
        humidity: data.main?.humidity,
        wind: data.wind?.speed,
        description: data.weather?.[0]?.description,
        descriptionMain: data.weather?.[0]?.main,
        icon: data.weather?.[0]?.icon,
        main: data.weather?.[0]?.main,
      };

      setWeather(simplified);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeather(city.trim());
  };

  const handleQuick = (name) => {
    setCity(name);
    fetchWeather(name);
  };

  return (
    <div className={`wc-app ${theme} ${dark ? "dark" : "light"}`}>
      {/* animations live directly inside wc-app so they cover the background */}
      <WeatherAnimation theme={theme} />

      {/* inner wrapper ensures alignment and matches the CSS centering rule */}
      <div className="wc-inner">
        <div className="wc-container">
          <header className="wc-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1>Weather</h1>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <DarkToggle dark={dark} setDark={setDark} />
            </div>
          </header>

          <form onSubmit={handleSubmit} className="wc-search" role="search">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search city (e.g. Chennai)"
              aria-label="city"
              className="wc-input"
            />
            <button type="submit" className="wc-btn" disabled={loading || !API_KEY}>
              {loading ? "Searching..." : "Get Weather"}
            </button>
          </form>

          <div className="wc-suggestions" role="list">
            <button type="button" onClick={() => handleQuick("Chennai")}>Chennai</button>
            <button type="button" onClick={() => handleQuick("London")}>London</button>
            <button type="button" onClick={() => handleQuick("New York")}>New York</button>
          </div>

          {error && <div className="wc-error" role="alert">{error}</div>}

          {weather && (
            <div className="wc-card" role="region" aria-label="weather card">
              <div className="wc-left">
                <div className="wc-location">{weather.name}, {weather.country}</div>

                <div className="wc-temp">
                  <span className="wc-temp-value">{Math.round(weather.temp)}</span>
                  <span className="wc-temp-unit">°C</span>
                </div>

                <div className="wc-feels">Feels like {Math.round(weather.feels_like)}°C</div>
              </div>

              <div className="wc-center">
                {weather.icon && (
                  <img
                    className="wc-icon"
                    src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
                    alt={weather.description}
                    width={96}
                    height={96}
                  />
                )}
                <div className="wc-desc">{weather.description}</div>
              </div>

              <div className="wc-right">
                <div className="wc-detail">
                  <div className="label">Humidity</div>
                  <div className="value">{weather.humidity}%</div>
                </div>
                <div className="wc-detail">
                  <div className="label">Wind</div>
                  <div className="value">{weather.wind} m/s</div>
                </div>
                <div className="wc-detail">
                  <div className="label">Condition</div>
                  <div className="value">{weather.main}</div>
                </div>
              </div>
            </div>
          )}

          {!weather && !error && (
            <div className="wc-empty">
              <p>Search a city to see its current weather.</p>
              {!API_KEY && <p style={{ color: "#ff8a8a", marginTop: 8 }}>Missing API key — add VITE_OPENWEATHER_KEY in .env</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
