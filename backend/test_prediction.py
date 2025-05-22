import json
from predict import preprocess_input, load_model, connect_to_mongodb, get_player_recent_games, get_next_scheduled_game
from datetime import datetime

def find_player_by_name(db, name):
    player = db.players.find_one({"name": name})
    if not player:
        raise Exception(f"Player '{name}' not found")
    return player

def test_prediction():
    db = connect_to_mongodb()
    player_name = "Klay Thompson"
    player = find_player_by_name(db, player_name)
    player_id = player.get('playerId') or player.get('_id') or player.get('id')
    recent_games = get_player_recent_games(db, player_id)
    next_game = get_next_scheduled_game(db, player_id)
    
    test_data = {
        "playerData": {
            "playerId": player_id,
            "recentGames": recent_games,
            "nextGame": next_game
        }
    }
    
    features = preprocess_input(test_data['playerData'])
    model = load_model()
    prediction = model.predict(features)[0]
    print(f"Prediction for {player_name} on {next_game['gameDate']} vs {next_game['opponent']} ({'Home' if next_game['isHome'] else 'Away'}): {prediction:.2f} points")

if __name__ == "__main__":
    test_prediction()
