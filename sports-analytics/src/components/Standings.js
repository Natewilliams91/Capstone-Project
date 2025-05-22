import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Standings.css';

function Standings() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/teams');
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error('Error fetching teams:', error);
        setError('Failed to load team data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  //Group teams by division
  const divisions = teams.reduce((acc, team) => {
    const divisionName = team.div || 'No Division';
    if (!acc[divisionName]) {
      acc[divisionName] = [];
    }
    acc[divisionName].push(team);
    return acc;
  }, {});

  //Sort teams within each division by win percentage
  Object.keys(divisions).forEach(division => {
    divisions[division].sort((a, b) => (b.winPct || 0) - (a.winPct || 0));
  });

  if (loading) {
    return (
      <div className="standings-container">
        <h1>NBA Standings</h1>
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="standings-container">
        <h1>NBA Standings</h1>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="standings-container">
      <h1>NBA Standings</h1>

      {Object.keys(divisions).map((division) => (
        <div className="division-section" key={division}>
          <h2>{division} Division</h2>
          <div className="table-container">
            <table className="division-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>W - L</th>
                  <th>Win %</th>
                  <th>GP</th>
                  <th>PPG</th>
                  <th>oPPG</th>
                  <th>pDIFF</th>
                  <th>PACE</th>
                  <th>OFF RTG</th>
                  <th>DEF RTG</th>
                  <th>RTG DIFF</th>
                  <th>SoS</th>
                </tr>
              </thead>
              <tbody>
                {divisions[division].map((team) => (
                  <tr key={team._id}>
                    <td>
                      <Link to={`/team/${team._id}`} className="team-link">
                        {team.region} {team.name}
                      </Link>
                    </td>
                    <td>{team.win} - {team.loss}</td>
                    <td>{team.winPct?.toFixed(3)}</td>
                    <td>{team.gp}</td>
                    <td>{team.ppg}</td>
                    <td>{team.oppg}</td>
                    <td>{team.pdiff}</td>
                    <td>{team.pace}</td>
                    <td>{team.offRtg}</td>
                    <td>{team.defRtg}</td>
                    <td>{team.Rtgdiff}</td>
                    <td>{team.sos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Standings; 