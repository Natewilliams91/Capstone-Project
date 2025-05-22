import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PlayerDetail.css';

const TABS = {
  STATS: 'stats',
  GAMELOG: 'gamelog',
  PREDICTIONS: 'predictions'
};

const STAT_OPTIONS = [
  { key: 'points', label: 'Points', color: '#FF6B6B' },
  { key: 'rebounds', label: 'Rebounds', color: '#4ECDC4' },
  { key: 'assists', label: 'Assists', color: '#45B7D1' },
  { key: 'steals', label: 'Steals', color: '#96CEB4' },
  { key: 'blocks', label: 'Blocks', color: '#FFEEAD' }
];

function PlayerDetail() {
  const { playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS.STATS);
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [statsFilter, setStatsFilter] = useState('regular');
  const [predictionData, setPredictionData] = useState(null);
  const [visibleStats, setVisibleStats] = useState({
    points: true,
    rebounds: false,
    assists: false,
    steals: false,
    blocks: false
  });

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await fetch(`/api/player/${playerId}`);
        const data = await res.json();
        setPlayer(data);
      } catch (error) {
        console.error('Error fetching player:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [playerId]);

  const getPrediction = async () => {
    if (!player?.playerId) return;
    setPredictionLoading(true);
    setPredictionError(null);
    try {
      const requestData = {
        playerData: {
          playerId: player.playerId,
          recentGames: player.gameLogs?.slice(0, 5) || []
        }
      };
      const response = await fetch('/api/predict/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Prediction failed');
      }
      const data = await response.json();
      console.log('Prediction data:', data);
      setPrediction(data.prediction);
      setPredictionData({
        gameDate: data.gameDate,
        opponent: data.opponent,
        isHome: data.isHome
      });
    } catch (error) {
      setPredictionError(error.message);
    } finally {
      setPredictionLoading(false);
    }
  };

  const toggleStat = (statKey) => {
    setVisibleStats(prev => ({
      ...prev,
      [statKey]: !prev[statKey]
    }));
  };

  const prepareChartData = () => {
    if (!player?.gameLogs) return [];
    
    return player.gameLogs.slice(-20).map(game => ({
      date: game.gameDate,
      points: game.points,
      rebounds: game.totalRebounds,
      assists: game.assists,
      steals: game.steals,
      blocks: game.blocks
    }));
  };

  const renderContent = () => {
    if (activeTab === TABS.STATS) {
      const filteredStats = player.stats?.filter(stat =>
        statsFilter === 'regular' ? !stat.playoffs : stat.playoffs
      ) || [];
      
      const chartData = prepareChartData();

      return (
        <div className="stats-section">
          <div className="stats-header">
            <h3>Season Stats</h3>
            <div className="stats-filter">
              <button 
                className={statsFilter === 'regular' ? 'active' : ''}
                onClick={() => setStatsFilter('regular')}
              >
                Regular Season
              </button>
              <button 
                className={statsFilter === 'playoffs' ? 'active' : ''}
                onClick={() => setStatsFilter('playoffs')}
              >
                Playoffs
              </button>
            </div>
          </div>
          
          {/* Performance Trend Chart */}
          <div className="performance-chart">
            <div className="chart-header">
              <h3>Performance Trend (Last 20 Games)</h3>
              <div className="stat-toggles">
                {STAT_OPTIONS.map(stat => (
                  <button
                    key={stat.key}
                    className={`stat-toggle ${visibleStats[stat.key] ? 'active' : ''}`}
                    onClick={() => toggleStat(stat.key)}
                    style={{ backgroundColor: visibleStats[stat.key] ? stat.color : '#f0f0f0' }}
                  >
                    {stat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                  style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '8px' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'var(--text-color)' }}
                  />
                  <YAxis yAxisId="left" tick={{ fill: 'var(--text-color)' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-color)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-color)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-color)'
                    }}
                    labelStyle={{ color: 'var(--text-color)' }}
                  />
                  <Legend 
                    wrapperStyle={{ color: 'var(--text-color)' }}
                  />
                  {visibleStats.points && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="points"
                      stroke="#FF6B6B"
                      name="Points"
                      dot={false}
                      strokeWidth={2}
                    />
                  )}
                  {visibleStats.rebounds && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="rebounds"
                      stroke="#4ECDC4"
                      name="Rebounds"
                      dot={false}
                      strokeWidth={2}
                    />
                  )}
                  {visibleStats.assists && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="assists"
                      stroke="#45B7D1"
                      name="Assists"
                      dot={false}
                      strokeWidth={2}
                    />
                  )}
                  {visibleStats.steals && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="steals"
                      stroke="#96CEB4"
                      name="Steals"
                      dot={false}
                      strokeWidth={2}
                    />
                  )}
                  {visibleStats.blocks && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="blocks"
                      stroke="#FFEEAD"
                      name="Blocks"
                      dot={false}
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="player-detail-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>GP</th>
                  <th>GS</th>
                  <th>PTS</th>
                  <th>DRB</th>
                  <th>ORB</th>
                  <th>AST</th>
                  <th>STL</th>
                  <th>BLK</th>
                  <th>TOV</th>
                  <th>FG%</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.map((stat, idx) => (
                  <tr key={idx}>
                    <td>{stat.season - 1} - {stat.season}</td>
                    <td>{stat.gp}</td>
                    <td>{stat.gs}</td>
                    <td>{(stat.pts / stat.gp).toFixed(1)}</td>
                    <td>{(stat.drb / stat.gp).toFixed(1)}</td>
                    <td>{(stat.orb / stat.gp).toFixed(1)}</td>
                    <td>{(stat.ast / stat.gp).toFixed(1)}</td>
                    <td>{(stat.stl / stat.gp).toFixed(1)}</td>
                    <td>{(stat.blk / stat.gp).toFixed(1)}</td>
                    <td>{(stat.tov / stat.gp).toFixed(1)}</td>
                    <td>{((stat.fg / stat.fga) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (activeTab === TABS.GAMELOG) {
      return (
        <div className="gamelog-section">
          <h3>Game Logs</h3>
          <div className="table-wrapper">
            <table className="player-detail-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Result</th>
                  <th>MIN</th>
                  <th>PTS</th>
                  <th>REB</th>
                  <th>AST</th>
                  <th>FG</th>
                  <th>FT</th>
                  <th>STL</th>
                  <th>BLK</th>
                  <th>TOV</th>
                  <th>PF</th>
                </tr>
              </thead>
              <tbody>
                {player.gameLogs.map((game, idx) => (
                  <tr key={idx}>
                    <td>{game.gameDate}</td>
                    <td>{game.opponent}</td>
                    <td>{game.result}</td>
                    <td>{game.minutesPlayed}</td>
                    <td>{game.points}</td>
                    <td>{game.totalRebounds}</td>
                    <td>{game.assists}</td>
                    <td>{game.fieldGoals}/{game.fieldGoalAttempts}</td>
                    <td>{game.freeThrows}/{game.freeThrowAttempts}</td>
                    <td>{game.steals}</td>
                    <td>{game.blocks}</td>
                    <td>{game.turnovers}</td>
                    <td>{game.personalFouls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (activeTab === TABS.PREDICTIONS) {
      return (
        <div className="predictions-section">
          {predictionLoading ? (
            <div className="loading-spinner" />
          ) : predictionError ? (
            <div className="error-message">{predictionError}</div>
          ) : prediction ? (
            <div className="prediction-content">
              <h3>Points Prediction</h3>
              <div className="prediction-value">{prediction.toFixed(1)}</div>
              <div className="prediction-details">
                <p>Next Game: {predictionData?.gameDate || 'Not available'}</p>
                <p>Opponent: {predictionData?.opponent || 'Not available'}</p>
                <p>Location: {predictionData?.isHome ? 'Home' : 'Away'}</p>
              </div>
              <p>Based on recent performance</p>
              <p>Last updated: {new Date().toLocaleString()}</p>
            </div>
          ) : (
            <button onClick={getPrediction} className="predict-button">
              Get Prediction
            </button>
          )}
        </div>
      );
    }
  };

  if (loading) {
    return <div className="player-detail-container loading-spinner" />;
  }

  if (!player) {
    return <div className="player-detail-container error-message">Player not found.</div>;
  }

  return (
    <div className="player-detail-container">
      <div className="player-header">
        {player.imgURL && (
          <img
            src={player.imgURL}
            alt={player.name}
            className="player-detail-image"
          />
        )}
        <h2 className="player-detail-name">{player.name}</h2>
        <p className="player-detail-info">Position: {player.pos}</p>
      </div>
      <div className="tab-navigation">
        <button
          className={activeTab === TABS.STATS ? 'active' : ''}
          onClick={() => setActiveTab(TABS.STATS)}
        >
          Stats
        </button>
        <button
          className={activeTab === TABS.GAMELOG ? 'active' : ''}
          onClick={() => setActiveTab(TABS.GAMELOG)}
        >
          Game Log
        </button>
        <button
          className={activeTab === TABS.PREDICTIONS ? 'active' : ''}
          onClick={() => {
            setActiveTab(TABS.PREDICTIONS);
            if (!prediction) getPrediction();
          }}
        >
          Predictions
        </button>
      </div>
      {renderContent()}
    </div>
  );
}

export default PlayerDetail;
