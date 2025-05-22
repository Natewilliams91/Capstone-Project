import sys
import json
import joblib
import numpy as np
import os
from typing import Dict, List, Any, Optional
from pymongo import MongoClient
from datetime import datetime
from dataclasses import dataclass
from pathlib import Path
import pandas as pd

@dataclass
class GameInfo:
    gameDate: str
    opponent: str
    isHome: bool

@dataclass
class RollingStats:
    points: float
    minutesPlayed: float
    fieldGoalAttempts: float
    freeThrowAttempts: float
    threePointAttempts: float
    totalRebounds: float
    assists: float

@dataclass
class TeamStats:
    offRtg: float
    defRtg: float
    pace: float

def connect_to_mongodb() -> Any:
    """Connect to MongoDB"""
    try:
        mongo_uri = os.getenv('MONGO_URI', "mongodb+srv://nate:Mareo123@nba-stats.qnzfc.mongodb.net/")
        client = MongoClient(mongo_uri)
        return client["NBA-stats"]
    except Exception as e:
        raise ConnectionError(f"Failed to connect to MongoDB: {str(e)}")

def get_team_abbrev_to_id(db: Any) -> Dict[str, int]:
    #team abbreviations to IDs.
    teams = list(db.teams.find({}, {"tid": 1, "abbrev": 1}))
    return {team["abbrev"]: team["tid"] for team in teams}

def get_opponent_team_id(db: Any, player_data: Dict) -> int:
   #opponent's team ID for the next game.
    if not player_data.get('nextGame'):
        raise ValueError("No next game found")
    
    next_game = player_data['nextGame']
    opponent_abbrev = next_game.opponent if hasattr(next_game, 'opponent') else next_game.get('opponent')
    if not opponent_abbrev:
        raise ValueError("No opponent found in next game")
    
    abbrev_to_id = get_team_abbrev_to_id(db)
    if opponent_abbrev not in abbrev_to_id:
        raise ValueError(f"Unknown opponent abbreviation: {opponent_abbrev}")
    
    return abbrev_to_id[opponent_abbrev]

def get_next_scheduled_game(db: Any, player_id: str) -> GameInfo:
    #next scheduled game for a player.
    player = db.players.find_one({"playerId": player_id})
    if not player:
        raise ValueError("Player not found")
    
    team_id = player.get('tid')
    if not team_id:
        raise ValueError("Player has no team ID")
    
    team = db.teams.find_one({"tid": team_id})
    if not team or 'abbrev' not in team:
        raise ValueError("Could not find team abbreviation")
    
    team_abbrev = team['abbrev']
    if not player.get('gameLogs'):
        raise ValueError("No game logs found for player")
    
    most_recent_game = max(player['gameLogs'], key=lambda x: datetime.strptime(x['gameDate'], "%d-%b-%y"))
    last_game_date = datetime.strptime(most_recent_game['gameDate'], "%d-%b-%y")
    
    scheduled_games = list(db.games.find({
        "$or": [
            {"homeTeam": team_abbrev},
            {"awayTeam": team_abbrev}
        ],
        "status": "Scheduled"
    }))
    
    if not scheduled_games:
        raise ValueError("No upcoming games found")
    
    for game in scheduled_games:
        game['datetime'] = datetime.strptime(game['gameDate'], "%a, %b %d, %Y")
    
    scheduled_games.sort(key=lambda x: x['datetime'])
    next_game = next((game for game in scheduled_games if game['datetime'] > last_game_date), None)
    
    if not next_game:
        raise ValueError("No upcoming games found")
    
    is_home = next_game['homeTeam'] == team_abbrev
    opponent = next_game['awayTeam'] if is_home else next_game['homeTeam']
    
    return GameInfo(
        gameDate=next_game['gameDate'],
        opponent=opponent,
        isHome=is_home
    )

def calculate_rolling_stats(games: List[Dict], window: int = 5) -> RollingStats:
    #Calculate rolling averages for recent games.
    if len(games) < window:
        games = games + [games[-1]] * (window - len(games))
    
    recent_games = games[-window:]
    
    return RollingStats(
        points=np.mean([g.get('points', 0) for g in recent_games]),
        minutesPlayed=np.mean([g.get('minutesPlayed', 0) for g in recent_games]),
        fieldGoalAttempts=np.mean([g.get('fieldGoalAttempts', 0) for g in recent_games]),
        freeThrowAttempts=np.mean([g.get('freeThrowAttempts', 0) for g in recent_games]),
        threePointAttempts=np.mean([g.get('threePointAttempts', 0) for g in recent_games]),
        totalRebounds=np.mean([g.get('totalRebounds', 0) for g in recent_games]),
        assists=np.mean([g.get('assists', 0) for g in recent_games])
    )

def get_team_stats(db: Any, team_id: int) -> TeamStats:
    #team statistics.
    team = db.teams.find_one({"tid": team_id})
    if not team:
        raise ValueError("Team not found")
    
    return TeamStats(
        offRtg=team.get('offRtg', 0),
        defRtg=team.get('defRtg', 0),
        pace=team.get('pace', 0)
    )

def calculate_advanced_features(rolling_stats: RollingStats, team_stats: TeamStats, opp_team_stats: TeamStats) -> Dict[str, float]:
    #Calculate advanced features.
    #Convert to numpy arrays
    minutes_played = np.array(rolling_stats.minutesPlayed)
    field_goal_attempts = np.array(rolling_stats.fieldGoalAttempts)
    free_throw_attempts = np.array(rolling_stats.freeThrowAttempts)
    points = np.array(rolling_stats.points)
    three_point_attempts = np.array(rolling_stats.threePointAttempts)
    
    # Usage Rate
    usage_rate = np.where(
        minutes_played > 0,
        (field_goal_attempts + 0.44 * free_throw_attempts) /
        (minutes_played + 1e-8),
        0
    )
    
    # Effective Field Goal Percentage
    effective_fg_pct = points / (2 * (field_goal_attempts + 0.44 * free_throw_attempts) + 1e-8)
    effective_fg_pct = np.nan_to_num(effective_fg_pct, nan=0, posinf=0, neginf=0)
    effective_fg_pct = np.clip(effective_fg_pct, 0, 1)
    
    # Three-Point Ratio
    three_point_ratio = three_point_attempts / (field_goal_attempts + 1e-8)
    three_point_ratio = np.nan_to_num(three_point_ratio, nan=0, posinf=0, neginf=0)
    three_point_ratio = np.clip(three_point_ratio, 0, 1)
    
    # Star Player Features
    is_star = (usage_rate > np.percentile(usage_rate, 85)).astype(int)
    star_boost = is_star * (1 + (opp_team_stats.defRtg - 105)/100)
    star_boost = np.clip(star_boost, 0.8, 1.2)
    
    # Log transform of FGA
    log_fga = np.log1p(field_goal_attempts)
    
    # New Matchup Features
    net_rtg_diff = team_stats.offRtg - opp_team_stats.defRtg
    pace_boost = ((team_stats.pace * opp_team_stats.pace) / 100)
    pace_boost = np.clip(pace_boost, 0.7, 1.3)
    
    return {
        'log_fga': float(log_fga),
        'points_rolling5': float(points),
        'effective_fg_pct': float(effective_fg_pct),
        'three_point_ratio': float(three_point_ratio),
        'net_rtg_diff': float(net_rtg_diff),
        'pace_boost': float(pace_boost),
        'usage_rate': float(usage_rate),
        'star_boost': float(star_boost)
    }

def preprocess_input(player_data: Dict) -> Dict:
    """Preprocess input data for prediction."""
    db = connect_to_mongodb()
    player = db.players.find_one({"playerId": player_data['playerId']})
    if not player:
        raise ValueError("Player not found")
    
    if not player_data.get('nextGame'):
        try:
            player_data['nextGame'] = get_next_scheduled_game(db, player_data['playerId'])
        except Exception as e:
            raise ValueError(f"Unable to determine next game: {str(e)}")
    
    # Get rolling stats
    rolling_stats = calculate_rolling_stats(player_data['recentGames'])
    
    # Get team stats
    team_stats = get_team_stats(db, player.get('tid'))
    opp_team_id = get_opponent_team_id(db, player_data)
    opp_team_stats = get_team_stats(db, opp_team_id)
    
    # Calculate advanced features
    features = calculate_advanced_features(rolling_stats, team_stats, opp_team_stats)
    
    return {
        'features': np.array(list(features.values())).reshape(1, -1),
        'nextGame': player_data['nextGame']
    }

def load_model() -> Any:
    #Load the trained model.
    model_path = Path('models/nba_points_model.joblib')
    if not model_path.exists():
        raise FileNotFoundError("Model file not found")
    
    try:
        return joblib.load(model_path)
    except Exception as e:
        raise RuntimeError(f"Error loading model: {str(e)}")

def main():
    #Main function for prediction requests.
    try:
        model = load_model()
        input_str = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read()
        input_data = json.loads(input_str)
        
        preprocessed_data = preprocess_input(input_data['playerData'])
        prediction = model.predict(preprocessed_data['features'])[0]
        next_game = preprocessed_data['nextGame']
        
        print(json.dumps({
            'prediction': float(prediction),
            'gameDate': next_game.gameDate,
            'opponent': next_game.opponent,
            'isHome': next_game.isHome
        }))
    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON input: {str(e)}'}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
