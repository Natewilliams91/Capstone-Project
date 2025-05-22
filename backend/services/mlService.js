const { PythonShell } = require('python-shell');
const path = require('path');

class MLService {
  constructor() {
    this.scriptDir = path.join(__dirname, '..');
    this.scriptName = 'predict.py';
  }

  async predictPoints(playerData) {
    try {
      const options = {
        mode: 'text',
        pythonPath: 'python',
        pythonOptions: ['-u'],
        scriptPath: this.scriptDir,
        args: [JSON.stringify({ playerData })]
      };

      //Run the script by its name
      const result = await PythonShell.run(this.scriptName, options);
      const prediction = JSON.parse(result[0]);

      if (prediction.error) {
        throw new Error(prediction.error);
      }
      //Return the full prediction data including game information
      return prediction; 
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  }
}

module.exports = new MLService();
