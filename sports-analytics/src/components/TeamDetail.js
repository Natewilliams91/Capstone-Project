import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './TeamDetail.css';

function TeamDetail() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [leagueAverages, setLeagueAverages] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch(`/api/team/${teamId}`);
        const data = await res.json();
        setTeam(data);
        
        //fetch players for this team
        if (data.tid !== undefined) {
          const playerRes = await fetch(`/api/players?tid=${data.tid}`);
          const playerData = await playerRes.json();
          setRoster(playerData);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      }
    };

    const fetchLeagueAverages = async () => {
      try {
        const res = await fetch('/api/teams');
        const teams = await res.json();
        //Calculate league averages
        const averages = teams.reduce((acc, team) => {
          acc.ppg += team.ppg;
          acc.oppg += team.oppg;
          acc.offRtg += team.offRtg;
          acc.defRtg += team.defRtg;
          acc.pace += team.pace;
          return acc;
        }, { ppg: 0, oppg: 0, offRtg: 0, defRtg: 0, pace: 0 });

        //Divide by number of teams for averages
        const numTeams = teams.length;
        Object.keys(averages).forEach(key => {
          averages[key] = averages[key] / numTeams;
        });

        setLeagueAverages(averages);
      } catch (error) {
        console.error('Error fetching league averages:', error);
      }
    };

    fetchTeam();
    fetchLeagueAverages();
  }, [teamId]);

  const prepareChartData = () => {
    if (!team || !leagueAverages) return [];

    return [
      {
        name: 'Points Per Game',
        team: team.ppg,
        league: leagueAverages.ppg
      },
      {
        name: 'Opponent PPG',
        team: team.oppg,
        league: leagueAverages.oppg
      },
      {
        name: 'Offensive Rating',
        team: team.offRtg,
        league: leagueAverages.offRtg
      },
      {
        name: 'Defensive Rating',
        team: team.defRtg,
        league: leagueAverages.defRtg
      },
      {
        name: 'Pace',
        team: team.pace,
        league: leagueAverages.pace
      }
    ];
  };

  if (!team) {
    return <div className="team-detail-container">Loading...</div>;
  }

  const chartData = prepareChartData();

  return (
    <div className="team-detail-container">
      <h2 className="team-detail-title">
        {team.region} {team.name}
      </h2>

      {team.imgURL && (
        <img
          className="team-detail-logo"
          src={team.imgURL}
          alt={team.name}
        />
      )}

      <div className="team-stats-section">
        <h3>Team Statistics</h3>
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Record:</span>
            <span className="stat-value">{team.win} - {team.loss}</span>
            <span className="stat-percentage">({(team.winPct * 100).toFixed(1)}%)</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Conference:</span>
            <span className="stat-value">{team.conf}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Division:</span>
            <span className="stat-value">{team.div}</span>
          </div>
        </div>

        <div className="stats-chart">
          <h4>Team vs League Averages</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '8px' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'var(--text-color)' }}
                />
                <YAxis tick={{ fill: 'var(--text-color)' }} />
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
                <Bar 
                  dataKey="team" 
                  fill="#FF6B6B" 
                  name="Team"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="league" 
                  fill="#4ECDC4" 
                  name="League Average"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h3 className="team-detail-roster-title">Roster</h3>
      {roster.length > 0 ? (
        <ul className="team-detail-roster-list">
          {roster
            .filter(player => player.name && player.name.trim() !== '')
            .map((player) => (
              <li key={player._id}>
                <a href={`/player/${player._id}`}>{player.name}</a>
              </li>
            ))}
        </ul>
      ) : (
        <p className="team-detail-no-players">No players found for this team.</p>
      )}
    </div>
  );
}

export default TeamDetail;
